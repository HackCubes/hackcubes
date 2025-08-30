import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const enrollmentId = formData.get('enrollmentId') as string;
    const assessmentId = formData.get('assessmentId') as string;
    const reportFile = formData.get('reportFile') as File;

    if (!enrollmentId || !assessmentId || !reportFile) {
      return NextResponse.json(
        { error: 'Missing required fields: enrollmentId, assessmentId, reportFile' },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (reportFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed for report submission' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (reportFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user has completed the assessment (check both enrollments and submissions)
    let completionVerified = false;
    let completionTime = null;
    let actualEnrollmentId = enrollmentId;

    // First, try to verify via enrollments table
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .eq('user_id', user.id)
      .eq('assessment_id', assessmentId)
      .single();

    if (enrollment && enrollment.status === 'COMPLETED') {
      completionVerified = true;
      completionTime = enrollment.completed_at;
    } else if (enrollmentId === 'unknown') {
      // If enrollmentId is 'unknown', try to find via submissions table
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('candidate_id', user.id)
        .eq('status', 'COMPLETED')
        .single();

      if (submission) {
        completionVerified = true;
        completionTime = submission.completed_at;
        // Try to find the actual enrollment ID for this user and assessment
        const { data: foundEnrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('assessment_id', assessmentId)
          .single();
        
        if (foundEnrollment) {
          actualEnrollmentId = foundEnrollment.id;
        }
      }
    }

    if (!completionVerified) {
      return NextResponse.json(
        { error: 'Assessment must be completed before submitting report' },
        { status: 400 }
      );
    }

    // Check if report submission deadline has passed (24 hours from completion)
    if (completionTime) {
      const deadline = new Date(new Date(completionTime).getTime() + (24 * 60 * 60 * 1000));
      if (new Date() > deadline) {
        return NextResponse.json(
          { error: 'Report submission deadline has passed (24 hours from assessment completion)' },
          { status: 400 }
        );
      }
    }

    // Check if report already submitted (check by user_id and assessment_id instead of enrollment_id)
    const { data: existingReport } = await supabase
      .from('assessment_reports')
      .select('id')
      .eq('user_id', user.id)
      .eq('assessment_id', assessmentId)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: 'Report has already been submitted for this assessment' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage using service role client to bypass RLS
    const fileName = `reports/${assessmentId}/${actualEnrollmentId || user.id}/${Date.now()}_${reportFile.name}`;
    const fileBuffer = await reportFile.arrayBuffer();
    
    // Create service role client for storage operations (bypasses RLS)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('assessment-reports')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload report file' },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file using service client
    const { data: urlData } = serviceClient.storage
      .from('assessment-reports')
      .getPublicUrl(uploadData.path);

    // Calculate submission deadline (24 hours from assessment completion)
    const submissionDeadline = new Date(completionTime);
    submissionDeadline.setHours(submissionDeadline.getHours() + 24);

    // Create report record
    const reportRecord = {
      enrollment_id: actualEnrollmentId === 'unknown' ? null : actualEnrollmentId,
      user_id: user.id,
      assessment_id: assessmentId,
      report_file_url: urlData.publicUrl,
      report_file_name: reportFile.name,
      report_file_size: reportFile.size,
      submitted_at: new Date().toISOString(),
      submission_deadline: submissionDeadline.toISOString(),
      status: 'submitted'
    };

    console.log('Attempting to insert report record:', reportRecord);

    const { data: reportData, error: reportError } = await supabase
      .from('assessment_reports')
      .insert(reportRecord)
      .select()
      .single();

    if (reportError) {
      console.error('Report creation error details:', {
        error: reportError,
        message: reportError.message,
        details: reportError.details,
        hint: reportError.hint,
        code: reportError.code
      });
      
      // Clean up uploaded file if database insertion fails
      await serviceClient.storage
        .from('assessment-reports')
        .remove([uploadData.path]);

      return NextResponse.json(
        { error: `Failed to create report record: ${reportError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reportId: reportData.id,
      message: 'Report submitted successfully. Your exam is now under review.',
      submittedAt: reportData.submitted_at,
      status: 'submitted'
    });

  } catch (error) {
    console.error('Report submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}
