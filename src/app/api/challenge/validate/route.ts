import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Check if the invite code exists and is not used
    const { data: inviteCode, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_used', false)
      .single();

    if (error || !inviteCode) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Valid invite code',
      codeId: inviteCode.id
    });

  } catch (error) {
    console.error('Validate invite code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
