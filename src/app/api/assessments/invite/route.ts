import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/email/service';

interface InvitationRequest {
  assessmentId: string;
  emails: Array<{
    email: string;
    name?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: InvitationRequest = await request.json();
    const { assessmentId, emails } = body;

    if (!assessmentId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { message: 'Assessment ID and emails array are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the assessment exists and user has access
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, name')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error('Assessment lookup error:', assessmentError);
      return NextResponse.json(
        { message: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Process invitations
    const invitations = emails.map(emailData => ({
      assessment_id: assessmentId,
      email: emailData.email.toLowerCase().trim(),
      invited_by: user.id,
      status: 'pending'
    }));

    // Insert invitations (handle duplicates)
    const { data: insertedInvitations, error: insertError } = await supabase
      .from('assessment_invitations')
      .upsert(invitations, {
        onConflict: 'assessment_id,email',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      console.error('Error inserting invitations:', insertError);
      return NextResponse.json(
        { message: 'Failed to create invitations' },
        { status: 500 }
      );
    }

    // TODO: Send actual email invitations
    // For now, we'll just create the database records
    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Nodemailer

    // Send email invitations
    const emailService = new EmailService();
    const emailResults = [];
    
    for (const invitation of insertedInvitations || []) {
      try {
        const emailData = emails.find(e => e.email.toLowerCase().trim() === invitation.email);
        const result = await emailService.sendEmail({
          to: invitation.email,
          subject: `You're invited to ${assessment.name} - HackCubes Assessment`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: #ffffff;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Assessment Invitation</h1>
              </div>
              
              <div style="padding: 40px 20px; background-color: #2a2a2a;">
                <h2 style="color: #ffffff; margin-bottom: 20px;">Hello ${emailData?.name || 'there'}!</h2>
                
                <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
                  You've been invited to participate in <strong style="color: #ffffff;">${assessment.name}</strong>.
                </p>
                
                <div style="background-color: #3a3a3a; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #cccccc; margin: 0; line-height: 1.6;">
                    This assessment will test your cybersecurity skills through various challenges. 
                    Click the button below to access the assessment.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/assessments/${assessmentId}/questions" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            font-weight: bold; 
                            display: inline-block;">
                    Start Assessment
                  </a>
                </div>
                
                <p style="color: #999999; font-size: 14px; margin-top: 30px;">
                  If you have any questions, please contact the assessment administrator.
                </p>
              </div>
              
              <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-top: 1px solid #3a3a3a;">
                <p style="color: #666666; margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} HackCubes. All rights reserved.
                </p>
              </div>
            </div>
          `
        });
        
        emailResults.push({
          email: invitation.email,
          success: result.success,
          error: result.error
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${invitation.email}:`, emailError);
        emailResults.push({
          email: invitation.email,
          success: false,
          error: 'Failed to send email'
        });
      }
    }

    const emailSuccessCount = emailResults.filter(r => r.success).length;
    const emailFailureCount = emailResults.filter(r => !r.success).length;

    const successCount = insertedInvitations?.length || 0;

    return NextResponse.json({
      message: `Successfully created ${successCount} invitation${successCount !== 1 ? 's' : ''}. Emails sent: ${emailSuccessCount}, failed: ${emailFailureCount}`,
      count: successCount,
      emailResults: {
        sent: emailSuccessCount,
        failed: emailFailureCount,
        details: emailResults
      }
    });

  } catch (error) {
    console.error('Error processing invitations:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
