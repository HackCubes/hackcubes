import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    const assessmentId = searchParams.get('assessmentId');

    if (!enrollmentId || !assessmentId) {
      return NextResponse.json(
        { error: 'Missing required parameters: enrollmentId, assessmentId' },
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

    // Verify user has access to this assessment (check both enrollment and submission methods)
    let hasAccess = false;
    
    // Try to find enrollment first
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .eq('user_id', user.id)
      .eq('assessment_id', assessmentId)
      .single();

    if (enrollment) {
      hasAccess = true;
    } else {
      // If no enrollment found, check if user has completed this assessment (alternative access)
      const { data: submission } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_id', assessmentId)
        .eq('status', 'completed')
        .single();

      if (submission) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Assessment access not found' },
        { status: 404 }
      );
    }

    // Get report details if exists (search by user_id and assessment_id)
    const { data: report, error: reportError } = await supabase
      .from('assessment_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('assessment_id', assessmentId)
      .single();

    // Get assessment timeline (optional - may not exist)
    const { data: timeline } = await supabase
      .from('assessment_timeline')
      .select('*')
      .eq('user_id', user.id)
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true });

    // Calculate report phase information
    const assessmentCompletedAt = enrollment.assessment_completed_at || enrollment.completed_at;
    const reportDueAt = enrollment.report_due_at;
    const now = new Date();
    
    let reportPhase = {
      canSubmitReport: false,
      reportSubmitted: false,
      reportDue: null as string | null,
      timeRemaining: null as string | null,
      isOverdue: false
    };

    if (enrollment.status === 'COMPLETED' && assessmentCompletedAt) {
      const dueDate = reportDueAt ? new Date(reportDueAt) : new Date(assessmentCompletedAt);
      if (!reportDueAt) {
        dueDate.setHours(dueDate.getHours() + 24); // 24 hours to submit report
      }

      reportPhase = {
        canSubmitReport: !report && now <= dueDate,
        reportSubmitted: !!report,
        reportDue: dueDate.toISOString(),
        timeRemaining: now <= dueDate ? (dueDate.getTime() - now.getTime()).toString() : null,
        isOverdue: !report && now > dueDate
      };
    }

    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        assessmentCompletedAt: enrollment.assessment_completed_at || enrollment.completed_at,
        reportDueAt: enrollment.report_due_at,
        finalScore: enrollment.final_score,
        passThreshold: enrollment.pass_threshold
      },
      report: report ? {
        id: report.id,
        fileName: report.report_file_name,
        fileSize: report.report_file_size,
        submittedAt: report.submitted_at,
        status: report.status,
        finalScore: report.final_score,
        isPassed: report.is_passed,
        adminReviewNotes: report.admin_review_notes,
        reviewedAt: report.reviewed_at,
        certificateIssued: report.certificate_issued,
        certificateUrl: report.certificate_url,
        reviewComments: report.review_comments || []
      } : null,
      reportPhase,
      timeline: timeline || []
    });

  } catch (error) {
    console.error('Report status error:', error);
    return NextResponse.json(
      { error: 'Failed to get report status' },
      { status: 500 }
    );
  }
}
