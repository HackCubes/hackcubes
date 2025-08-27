import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = (await request.json()) as { email?: string; name?: string };
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const derivedOrigin = host ? `${proto}://${host}` : undefined;
    // Prefer derived origin from request headers (works behind proxies) then fall back to env
    const siteUrl = derivedOrigin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectTo = `${siteUrl}/auth/callback?next=/dashboard`;

    // Always generate a magic link and send via our branded email
    const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo }
    });

    if (magicError || !magicData?.properties?.action_link) {
      return NextResponse.json({ error: magicError?.message || 'Failed to generate verification link' }, { status: 500 });
    }

    const actionLink = magicData.properties.action_link as string;

    const displayName = name && name.trim().length > 0 ? name.trim() : 'Hacker';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0e0e0e; color: #ffffff; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00FF7F, #3BE8FF); padding: 24px 28px;">
          <h1 style="margin: 0; color: #0e0e0e; font-size: 22px;">Verify your email</h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 12px; color: #d1d5db;">Hi ${displayName},</p>
          <p style="margin: 0 0 16px; color: #c7c7c7;">Click the button below to verify your email and finish setting up your HackCubes account.</p>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${actionLink}" style="display:inline-block; background: linear-gradient(135deg, #00FF7F, #3BE8FF); color:#0e0e0e; padding:12px 20px; border-radius: 9999px; text-decoration:none; font-weight:600;">Verify Email</a>
          </div>
          <p style="margin: 0 0 8px; color: #9ca3af;">If the button doesn’t work, copy and paste this link into your browser:</p>
          <p style="margin: 0 0 24px; color: #a3a3a3; word-break: break-all;">${actionLink}</p>
          <p style="margin: 0; color: #808080;">See you soon,<br/>The HackCubes Team</p>
        </div>
        <div style="border-top: 1px solid #2a2a2a; padding: 16px; text-align:center; color:#6b7280; font-size:12px;">© ${new Date().getFullYear()} HackCubes. All rights reserved.</div>
      </div>
    `;

    const resp = await EmailService.getInstance().sendEmail({ to: email, subject: 'Verify your HackCubes email', html });
    if (!resp.success) return NextResponse.json({ error: resp.error || 'Failed to send email' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('send-verification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
