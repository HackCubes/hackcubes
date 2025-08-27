import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, certificationCode, assessmentId } = body as {
      email?: string;
      name?: string;
      certificationCode?: string;
      assessmentId?: string;
    };

    if (!email || !certificationCode) {
      return NextResponse.json(
        { error: 'email and certificationCode are required' },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const prettyName =
      certificationCode === 'HCJPT'
        ? 'HackCube Certified Junior Penetration Tester'
        : certificationCode;

    const targetUrl = assessmentId
      ? `${siteUrl}/assessments/${assessmentId}`
      : `${siteUrl}/certification`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0e0e0e; color: #ffffff; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00FF7F, #3BE8FF); padding: 24px 28px;">
          <h1 style="margin: 0; color: #0e0e0e; font-size: 22px;">Certification Access Granted</h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 12px; color: #d1d5db;">Hi ${name || 'there'},</p>
          <p style="margin: 0 0 16px; color: #c7c7c7;">You've been enrolled in <strong style="color:#fff;">${prettyName}</strong>. Your access is now active.</p>
          <div style="background: #161616; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color:#a3a3a3;">Click the button below to open your assessment and begin when ready.</p>
          </div>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${targetUrl}" style="display:inline-block; background: linear-gradient(135deg, #00FF7F, #3BE8FF); color:#0e0e0e; padding:12px 20px; border-radius: 9999px; text-decoration:none; font-weight:600;">Open Assessment</a>
          </div>
          <p style="margin: 0 0 8px; color: #9ca3af;">You can also manage certifications anytime at:</p>
          <p style="margin: 0 0 24px; color: #a3a3a3;"><a style="color:#3BE8FF; text-decoration:none;" href="${siteUrl}/certification">${siteUrl}/certification</a></p>
          <p style="margin: 0; color: #808080;">Good luck!<br/>The HackCubes Team</p>
        </div>
        <div style="border-top: 1px solid #2a2a2a; padding: 16px; text-align:center; color:#6b7280; font-size:12px;">© ${new Date().getFullYear()} HackCubes. All rights reserved.</div>
      </div>
    `;

    const service = EmailService.getInstance();
    const resp = await service.sendEmail({
      to: email,
      subject: `You're enrolled: ${certificationCode} is now active`,
      html,
    });

    if (!resp.success) {
      return NextResponse.json({ error: resp.error || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('certification-enrolled email error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
