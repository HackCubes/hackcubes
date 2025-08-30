import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email template for report submission confirmation
const getReportSubmissionEmailTemplate = (data: {
  candidateName: string;
  assessmentName: string;
  submittedAt: string;
  reviewTimeframe: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Submitted - Under Review</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00ff88, #0099ff); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .status-badge { background: #ff9800; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 15px 0; }
    .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    .button { background: #00ff88; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ HackCubes</div>
      <h1>Report Submitted Successfully</h1>
      <p>Your HJCPT assessment is now under review</p>
    </div>
    
    <div class="content">
      <h2>Hello ${data.candidateName}! 👋</h2>
      
      <div class="status-badge">📄 UNDER REVIEW</div>
      
      <p>Congratulations! You have successfully submitted your report for the <strong>${data.assessmentName}</strong> certification.</p>
      
      <div class="info-box">
        <h3>📋 Submission Details</h3>
        <ul>
          <li><strong>Assessment:</strong> ${data.assessmentName}</li>
          <li><strong>Submitted:</strong> ${data.submittedAt}</li>
          <li><strong>Status:</strong> Under Review</li>
          <li><strong>Review Timeframe:</strong> ${data.reviewTimeframe}</li>
        </ul>
      </div>
      
      <h3>🔍 What Happens Next?</h3>
      <ol>
        <li><strong>Expert Review:</strong> Our certified cybersecurity experts will thoroughly review your report</li>
        <li><strong>Assessment Evaluation:</strong> We'll evaluate both your practical assessment performance and report quality</li>
        <li><strong>Final Decision:</strong> You'll receive detailed feedback and your final certification result</li>
      </ol>
      
      <div class="info-box">
        <h4>📊 Evaluation Criteria</h4>
        <ul>
          <li>Technical accuracy and methodology</li>
          <li>Report clarity and professionalism</li>
          <li>Proper vulnerability documentation</li>
          <li>Remediation recommendations</li>
        </ul>
      </div>
      
      <p>We'll notify you via email once the review is complete. Thank you for your patience during this process.</p>
      
      <a href="https://hackcubes.com/profile" class="button">View Your Progress</a>
    </div>
    
    <div class="footer">
      <p>Best regards,<br>The HackCubes Team</p>
      <p><small>This is an automated message. Please do not reply to this email.</small></p>
    </div>
  </div>
</body>
</html>
`;

// Email template for report review completion
const getReportReviewEmailTemplate = (data: {
  candidateName: string;
  assessmentName: string;
  isPassed: boolean;
  finalScore: number;
  passThreshold: number;
  reviewNotes?: string;
  certificateUrl?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certification Results - ${data.isPassed ? 'Congratulations!' : 'Review Complete'}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${data.isPassed ? '#00ff88, #0099ff' : '#ff6b6b, #ffa500'}); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .status-badge { background: ${data.isPassed ? '#4caf50' : '#f44336'}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 15px 0; }
    .score-box { background: ${data.isPassed ? '#e8f5e8' : '#ffebee'}; border: 2px solid ${data.isPassed ? '#4caf50' : '#f44336'}; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .score-number { font-size: 48px; font-weight: bold; color: ${data.isPassed ? '#4caf50' : '#f44336'}; }
    .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    .button { background: #00ff88; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 15px 5px; }
    .button.secondary { background: #2196f3; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ HackCubes</div>
      <h1>${data.isPassed ? '🎉 Congratulations!' : '📋 Review Complete'}</h1>
      <p>Your ${data.assessmentName} results are ready</p>
    </div>
    
    <div class="content">
      <h2>Hello ${data.candidateName}! 👋</h2>
      
      <div class="status-badge">${data.isPassed ? '✅ PASSED' : '❌ NOT PASSED'}</div>
      
      <div class="score-box">
        <div class="score-number">${data.finalScore}%</div>
        <p><strong>Final Score</strong></p>
        <p>Passing threshold: ${data.passThreshold}%</p>
      </div>
      
      ${data.isPassed ? `
        <h3>🎊 Outstanding Achievement!</h3>
        <p>You have successfully passed the <strong>${data.assessmentName}</strong> certification! Your dedication to cybersecurity excellence has paid off.</p>
        
        ${data.certificateUrl ? `
          <div class="info-box">
            <h4>🏆 Your Certificate</h4>
            <p>Your official certificate has been generated and is ready for download.</p>
            <a href="${data.certificateUrl}" class="button">Download Certificate</a>
          </div>
        ` : ''}
        
        <h3>🚀 What's Next?</h3>
        <ul>
          <li>Add your HJCPT certification to your LinkedIn profile</li>
          <li>Include it in your resume and professional portfolio</li>
          <li>Consider advancing to intermediate certifications (HCIPT)</li>
          <li>Join our community of certified ethical hackers</li>
        </ul>
      ` : `
        <h3>📚 Areas for Improvement</h3>
        <p>While you didn't meet the passing threshold this time, this is a valuable learning experience. We encourage you to continue developing your skills.</p>
        
        <div class="info-box">
          <h4>💡 Next Steps</h4>
          <ul>
            <li>Review the feedback provided below</li>
            <li>Focus on strengthening identified weak areas</li>
            <li>Practice with additional hands-on exercises</li>
            <li>Consider retaking the assessment in the future</li>
          </ul>
        </div>
      `}
      
      ${data.reviewNotes ? `
        <div class="info-box">
          <h4>📝 Detailed Feedback</h4>
          <p>${data.reviewNotes}</p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://hackcubes.com/profile" class="button">View Profile</a>
        ${data.isPassed ? '' : '<a href="https://hackcubes.com/learning-paths" class="button secondary">Learning Resources</a>'}
      </div>
    </div>
    
    <div class="footer">
      <p>Best regards,<br>The HackCubes Team</p>
      <p><small>Questions? Contact us at support@hackcubes.com</small></p>
    </div>
  </div>
</body>
</html>
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    if (!type || !to || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to, data' },
        { status: 400 }
      );
    }

    let subject: string;
    let html: string;

    switch (type) {
      case 'report_submitted':
        subject = `Report Submitted - ${data.assessmentName} Under Review`;
        html = getReportSubmissionEmailTemplate(data);
        break;
      
      case 'report_reviewed':
        subject = data.isPassed 
          ? `🎉 Congratulations! You passed ${data.assessmentName}`
          : `${data.assessmentName} Results Available`;
        html = getReportReviewEmailTemplate(data);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    const emailData = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'HackCubes <support@hackcubes.com>',
      to: [to],
      subject,
      html,
    });

    return NextResponse.json({
      success: true,
      emailId: emailData.data?.id,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
