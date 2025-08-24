import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { emailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient(
      (process as any).env.NEXT_PUBLIC_SUPABASE_URL!,
      (process as any).env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { name, email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data: entry, error } = await supabase
      .from('early_joiners')
      .insert([{ email, name: name || null }])
      .select()
      .single();

    if (error) {
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
      console.error('Supabase error (early_joiners insert):', error);
      return NextResponse.json({ error: 'Failed to join' }, { status: 500 });
    }

    // Send welcome email asynchronously (don't block the response)
    emailService.sendEarlyJoinerWelcome(entry.email, entry.name).catch(emailError => {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the signup if email fails
    });

    return NextResponse.json(
      { message: 'Successfully joined', data: entry },
      { status: 201 }
    );
  } catch (err) {
    console.error('Early joiners API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createServiceClient(
      (process as any).env.NEXT_PUBLIC_SUPABASE_URL!,
      (process as any).env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data, error } = await supabase
      .from('early_joiners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error (early_joiners fetch):', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({ data, count: data?.length ?? 0 });
  } catch (err) {
    console.error('Early joiners API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
