import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'USD', certificationId, userId } = body;

    // Validate required fields
    if (!amount || !certificationId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, certificationId, userId' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Verify user exists and get user details
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user already has access to this certification
    const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';
    const { data: existingInvitation } = await supabase
      .from('assessment_invitations')
      .select('id, status')
      .eq('assessment_id', HJCPT_ASSESSMENT_ID)
      .eq('email', user.email)
      .single();

    if (existingInvitation && existingInvitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'User already has access to this certification' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (smallest currency unit)
      currency: currency,
      receipt: `cert_${certificationId}_${Date.now()}`,
      notes: {
        certificationId,
        userId,
        userEmail: user.email,
      },
    } as any;

    const order = await razorpay.orders.create(options) as any;

    // Store order details in database
    const { error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        order_id: order.id,
        user_id: userId,
        user_email: user.email,
        certification_id: certificationId,
        amount: amount,
        currency: currency,
        status: 'created',
        razorpay_order_id: order.id,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue anyway, order is created in Razorpay
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
