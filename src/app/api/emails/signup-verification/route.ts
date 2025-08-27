import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body as { email?: string; name?: string };

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const displayName = name && name.trim().length > 0 ? name.trim() : 'Hacker';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0e0e0e; color: #ffffff; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00FF7F, #3BE8FF); padding: 24px 28px;">
          <h1 style="margin: 0; color: #0e0e0e; font-size: 22px;">Welcome to HackCubes</h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 12px; color: #d1d5db;">Hi ${displayName},</p>
          <p style="margin: 0 0 12px; color: #c7c7c7;">Thanks for creating your account. We just sent a verification email to <strong style="color:#fff;">${email}</strong>.</p>
          <p style="margin: 0 0 16px; color: #a3a3a3;">Please open that email and click the verification link to activate your account.</p>
          <div style="background: #161616; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <ul style="margin:0; padding-left: 18px; color:#bfbfbf;">
              <li>Didn't receive it? Check your spam folder.</li>
              <li>Still nothing? Wait a minute and try resending from the sign-in page.</li>
            </ul>
          </div>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${siteUrl}/auth/signin" style="display:inline-block; background: linear-gradient(135deg, #00FF7F, #3BE8FF); color:#0e0e0e; padding:12px 20px; border-radius: 9999px; text-decoration:none; font-weight:600;">Go to Sign In</a>
          </div>
          <p style="margin: 0; color: #808080;">See you soon,<br/>The HackCubes Team</p>
        </div>
        <div style="border-top: 1px solid #2a2a2a; padding: 16px; text-align:center; color:#6b7280; font-size:12px;">© ${new Date().getFullYear()} HackCubes. All rights reserved.</div>
      </div>
    `;

    const service = EmailService.getInstance();
    const resp = await service.sendEmail({
      to: email,
      subject: 'Welcome to HackCubes — Verify your email',
      html,
    });

    if (!resp.success) {
      return NextResponse.json({ error: resp.error || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('signup-verification email error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
