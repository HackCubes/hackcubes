import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { WaitlistSignupData } from '@/types/waitlist';

export async function POST(request: NextRequest) {
  try {
    console.log('=== WAITLIST API CALLED ===');
    
    // Use service role client to bypass RLS issues
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

    console.log('Supabase client created');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const data: WaitlistSignupData & { inviteCode?: string } = await request.json();
    console.log('Request data:', data);

    // Validate required fields
    if (!data.email) {
      console.log('Email validation failed');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate invite code
    if (!data.inviteCode) {
      console.log('Invite code validation failed');
      return NextResponse.json(
        { error: 'Invite code is required. Complete the challenge to get one!' },
        { status: 400 }
      );
    }

    // Check if the invite code exists and is not used
    const { data: inviteCode, error: inviteError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', data.inviteCode.trim().toUpperCase())
      .eq('is_used', false)
      .single();

    if (inviteError || !inviteCode) {
      console.log('Invalid invite code:', data.inviteCode);
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 400 }
      );
    }

    console.log('Attempting to insert waitlist entry:', data.email);

    // Insert into waitlist table
    const { data: waitlistEntry, error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: data.email,
          name: data.name || null,
          company: data.company || null,
          role: data.role || null,
          interest_level: data.interest_level || 'high',
          referral_source: data.referral_source || null,
        }
      ])
      .select()
      .single();

    console.log('Supabase response:', { waitlistEntry, error });

    if (error) {
      // Handle duplicate email error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Email already exists in waitlist' },
          { status: 409 }
        );
      }
      
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    // Mark the invite code as used
    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({ 
        is_used: true, 
        used_at: new Date().toISOString(),
        used_by_email: data.email 
      })
      .eq('id', inviteCode.id);

    if (updateError) {
      console.error('Error updating invite code:', updateError);
      // Don't fail the whole operation, just log it
    }

    return NextResponse.json(
      { 
        message: 'Successfully joined waitlist',
        data: waitlistEntry 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    const { data: waitlistEntries, error } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch waitlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: waitlistEntries,
      count: waitlistEntries.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}