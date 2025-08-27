import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, certificationCode } = body as {
      email?: string;
      name?: string;
      certificationCode?: string;
    };

    if (!email || !certificationCode) {
      return NextResponse.json(
        { error: 'email and certificationCode are required' },
        { status: 400 }
      );
    }

    const prettyName =
      certificationCode === 'HCJPT'
        ? 'HackCube Certified Junior Penetration Tester'
        : certificationCode;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0e0e0e; color: #ffffff; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444, #f97316); padding: 24px 28px;">
          <h1 style="margin: 0; color: #0e0e0e; font-size: 22px;">Certification Access Update</h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 12px; color: #d1d5db;">Hi ${name || 'there'},</p>
          <p style="margin: 0 0 16px; color: #c7c7c7;">Your access to <strong style="color:#fff;">${prettyName}</strong> has been revoked.</p>
          <div style="background: #161616; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color:#a3a3a3;">If you believe this is a mistake or need further assistance, please reply to this email.</p>
          </div>
          <p style="margin: 0; color: #808080;">Regards,<br/>The HackCubes Team</p>
        </div>
        <div style="border-top: 1px solid #2a2a2a; padding: 16px; text-align:center; color:#6b7280; font-size:12px;">© ${new Date().getFullYear()} HackCubes. All rights reserved.</div>
      </div>
    `;

    const service = EmailService.getInstance();
    const resp = await service.sendEmail({
      to: email,
      subject: `Access revoked: ${certificationCode}`,
      html,
    });

    if (!resp.success) {
      return NextResponse.json({ error: resp.error || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('certification-revoked email error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
