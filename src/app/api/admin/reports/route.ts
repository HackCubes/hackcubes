import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Helper function to construct report file URL
async function constructReportFileUrl(supabase: any, report: any): Promise<string> {
  try {
    // Search for the file in the assessment folder
    const basePath = `reports/${report.assessment_id}`;
    
    // List all files in the assessment folder to find the one matching our filename
    const { data: files, error } = await supabase.storage
      .from('assessment-reports')
      .list(basePath, { 
        limit: 100
        // Remove search parameter to get all files, then filter manually
      });

    if (error) {
      console.error('Error searching for file:', error);
      return '';
    }

    if (files && files.length > 0) {
      // Find the file that ends with our report filename
      const matchingFile = files.find((file: any) => 
        file.name.endsWith(report.report_file_name)
      );
      
      if (matchingFile) {
        const fullPath = `${basePath}/${matchingFile.name}`;
        const { data: publicUrl } = supabase.storage
          .from('assessment-reports')
          .getPublicUrl(fullPath);
        
        return publicUrl.publicUrl;
      }
    }

    // If not found in the direct assessment folder, search in subfolders
    // This handles the case where files are stored in user-specific subfolders
    const { data: subfolders } = await supabase.storage
      .from('assessment-reports')
      .list(basePath);

    if (subfolders) {
      for (const folder of subfolders) {
        if (folder.name !== '.emptyFolderPlaceholder') {
          const subfolderPath = `${basePath}/${folder.name}`;
          const { data: subfolderFiles } = await supabase.storage
            .from('assessment-reports')
            .list(subfolderPath, {
              limit: 100
              // Remove search parameter to get all files, then filter manually
            });

          if (subfolderFiles && subfolderFiles.length > 0) {
            const matchingFile = subfolderFiles.find((file: any) => 
              file.name.endsWith(report.report_file_name)
            );
            
            if (matchingFile) {
              const fullPath = `${subfolderPath}/${matchingFile.name}`;
              const { data: publicUrl } = supabase.storage
                .from('assessment-reports')
                .getPublicUrl(fullPath);
              
              return publicUrl.publicUrl;
            }
          }
        }
      }
    }

    console.log(`File not found: ${report.report_file_name} in assessment ${report.assessment_id}`);
    return '';
  } catch (error) {
    console.error('Error constructing file URL:', error);
    return '';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'submitted';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Create regular client for authentication
    const authClient = createServerClient();
    
    // Create service role client for data access (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify admin authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Admin API accessed by user:', user?.id, user?.email);
    
    // Check if user is admin (using profiles table with service role client)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      console.log('User profile found:', profile);

      if (!profile?.is_admin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    } catch (error) {
      // If profiles table doesn't exist or user not found, deny access
      console.log('Profiles table error or user not found', error);
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get reports with basic information (no complex joins for now)
    let query = supabase
      .from('assessment_reports')
      .select('*')
      .order('submitted_at', { ascending: false });

    // Apply status filter (handle 'all' status)
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    console.log('Fetching reports with status:', status, 'page:', page, 'limit:', limit);

    const { data: reports, error: reportsError } = await query.range(offset, offset + limit - 1);

    console.log('Raw reports from database:', reports?.length || 0, 'Error:', reportsError);

    if (reportsError) {
      console.error('Reports fetch error:', reportsError);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // Enrich reports with user details
    console.log('Enriching reports with user details...');
    const enrichedReports = await Promise.all(
      (reports || []).map(async (report, index) => {
        console.log(`Processing report ${index + 1}:`, report.id);
        try {
          // Try to get user details from profiles table first
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, first_name, last_name, username')
            .eq('id', report.user_id)
            .single();

          console.log('Profile data for user', report.user_id, ':', profileData);

          if (profileData) {
            // File URL is already stored in the database, no need to construct it
            return {
              ...report,
              // Use the existing report_file_url from database
              report_file_url: report.report_file_url,
              user: {
                id: report.user_id,
                email: profileData.email,
                full_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.username || profileData.email
              },
              assessment: {
                id: report.assessment_id,
                name: `Assessment ${report.assessment_id.slice(0, 8)}...`
              }
            };
          }

          // Fallback to auth.users if profiles not available
          console.log('No profile found, trying auth.users for:', report.user_id);
          const { data: userData } = await supabase.auth.admin.getUserById(report.user_id);
          
          console.log('Auth user data:', userData?.user?.email);

          return {
            ...report,
            // Use the existing report_file_url from database
            report_file_url: report.report_file_url,
            user: {
              id: report.user_id,
              email: userData?.user?.email || 'Unknown',
              full_name: userData?.user?.user_metadata?.full_name || userData?.user?.email || 'Unknown User'
            },
            assessment: {
              id: report.assessment_id,
              name: `Assessment ${report.assessment_id.slice(0, 8)}...`
            }
          };
        } catch (error) {
          console.error('Error fetching user data for report:', report.id, error);
          
          return {
            ...report,
            // Use the existing report_file_url from database
            report_file_url: report.report_file_url,
            user: {
              id: report.user_id,
              email: 'Unknown',
              full_name: 'Unknown User'
            },
            assessment: {
              id: report.assessment_id,
              name: `Assessment ${report.assessment_id.slice(0, 8)}...`
            }
          };
        }
      })
    );

    console.log('Enriched reports count:', enrichedReports.length);

    // Get total count for pagination
    let countQuery = supabase
      .from('assessment_reports')
      .select('*', { count: 'exact', head: true });

    // Apply same status filter for count
    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    return NextResponse.json({
      success: true,
      reports: enrichedReports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Admin reports fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reportId,
      status,
      finalScore,
      isPassed,
      adminReviewNotes,
      comments
    } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: reportId, status' },
        { status: 400 }
      );
    }

    // Create regular client for authentication
    const authClient = createServerClient();
    
    // Create service role client for data access (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify admin authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Update report
    const updateData: any = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (finalScore !== undefined) updateData.final_score = finalScore;
    if (isPassed !== undefined) updateData.is_passed = isPassed;
    if (adminReviewNotes) updateData.admin_review_notes = adminReviewNotes;

    const { data: updatedReport, error: updateError } = await supabase
      .from('assessment_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      console.error('Report update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      );
    }

    // Add review comments if provided
    if (comments && Array.isArray(comments)) {
      const commentInserts = comments.map((comment: any) => ({
        report_id: reportId,
        admin_id: user.id,
        comment_text: comment.text,
        comment_type: comment.type || 'general'
      }));

      const { error: commentsError } = await supabase
        .from('report_review_comments')
        .insert(commentInserts);

      if (commentsError) {
        console.error('Comments insert error:', commentsError);
        // Continue anyway, the main review was saved
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Report review completed successfully',
      report: updatedReport
    });

  } catch (error) {
    console.error('Report review error:', error);
    return NextResponse.json(
      { error: 'Failed to review report' },
      { status: 500 }
    );
  }
}
