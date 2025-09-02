import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      name, 
      certificationCode, 
      amount, 
      currency, 
      orderId, 
      paymentId,
      assessmentId 
    } = body as {
      email?: string;
      name?: string;
      certificationCode?: string;
      amount?: number;
      currency?: string;
      orderId?: string;
      paymentId?: string;
      assessmentId?: string;
    };

    if (!email || !certificationCode || !amount || !currency || !orderId) {
      return NextResponse.json(
        { error: 'email, certificationCode, amount, currency, and orderId are required' },
        { status: 400 }
      );
    }

    // Prefer explicit env var, else derive from request headers (works on Vercel/proxies)
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const derivedOrigin = host ? `${proto}://${host}` : undefined;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || derivedOrigin || 'http://localhost:3000';

    const prettyName =
      certificationCode === 'HCJPT'
        ? 'HackCube Certified Junior Penetration Tester'
        : certificationCode;

    const currencySymbol = currency === 'INR' ? '₹' : '$';
    const formattedAmount = `${currencySymbol}${amount}`;

    const targetUrl = assessmentId
      ? `${siteUrl}/assessments/${assessmentId}`
      : `${siteUrl}/certification`;

    const ordersUrl = `${siteUrl}/profile/orders`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0e0e0e; color: #ffffff; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00FF7F, #3BE8FF); padding: 24px 28px;">
          <h1 style="margin: 0; color: #0e0e0e; font-size: 22px;">🎉 Payment Successful!</h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 12px; color: #d1d5db;">Hi ${name || 'there'},</p>
          <p style="margin: 0 0 16px; color: #c7c7c7;">Your payment for <strong style="color:#fff;">${prettyName}</strong> has been processed successfully!</p>
          
          <div style="background: #161616; border: 1px solid #2a2a2a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 16px; color: #00FF7F; font-size: 18px;">Payment Details</h3>
            <div style="color: #c7c7c7; line-height: 1.6;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #a3a3a3;">Certification:</span>
                <span style="color: #fff; font-weight: 600;">${prettyName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #a3a3a3;">Amount Paid:</span>
                <span style="color: #00FF7F; font-weight: 600; font-size: 16px;">${formattedAmount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #a3a3a3;">Order ID:</span>
                <span style="color: #fff; font-family: monospace; font-size: 12px;">${orderId}</span>
              </div>
              ${paymentId ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #a3a3a3;">Payment ID:</span>
                <span style="color: #fff; font-family: monospace; font-size: 12px;">${paymentId}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #a3a3a3;">Date:</span>
                <span style="color: #fff;">${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>

          <div style="background: #0a4d2e; border: 1px solid #00FF7F; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #a3f3a3; font-weight: 600;">✅ Your certification access is now active!</p>
            <p style="margin: 8px 0 0; color: #c7f0c7;">You can start your assessment immediately.</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${targetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00FF7F, #3BE8FF); color: #0e0e0e; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; margin-right: 12px;">Start Assessment</a>
            <a href="${ordersUrl}" style="display: inline-block; background: #2a2a2a; color: #fff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">View Order</a>
          </div>

          <div style="border-top: 1px solid #2a2a2a; padding-top: 16px; margin-top: 24px;">
            <p style="margin: 0 0 8px; color: #9ca3af; font-size: 14px;">Need help?</p>
            <p style="margin: 0 0 16px; color: #a3a3a3; font-size: 14px;">Contact us at <a style="color: #3BE8FF; text-decoration: none;" href="mailto:support@hackcubes.com">support@hackcubes.com</a></p>
            <p style="margin: 0; color: #808080;">Thank you for choosing HackCubes!<br/>The HackCubes Team</p>
          </div>
        </div>
        <div style="border-top: 1px solid #2a2a2a; padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
          © ${new Date().getFullYear()} HackCubes. All rights reserved.
        </div>
      </div>
    `;

    const service = EmailService.getInstance();
    const resp = await service.sendEmail({
      to: email,
      subject: `Payment Successful - ${certificationCode} Certification (${formattedAmount})`,
      html,
    });

    if (!resp.success) {
      return NextResponse.json({ error: resp.error || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('payment-success email error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 