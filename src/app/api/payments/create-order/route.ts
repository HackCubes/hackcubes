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
    const { amount, currency = 'USD', certificationId } = body;

    // Validate required fields
    if (amount === undefined || amount === null || !certificationId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, certificationId' },
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

    // Convert to subunits for Razorpay (paise for INR)
    let amountSubunits = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountSubunits)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (amountSubunits < 100) amountSubunits = 100;

    // Create Razorpay order
    const options = {
      amount: amountSubunits,
      currency,
      receipt: `cert_${certificationId}_${Date.now()}`,
      notes: {
        certificationId,
        userId: user.id,
        userEmail: user.email,
      },
    } as any;

    const order = await razorpay.orders.create(options) as any;

    // Store order details in database (store base units for readability)
    const { error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        order_id: order.id,
        user_id: user.id,
        user_email: user.email,
        certification_id: certificationId,
        amount: amountSubunits / 100,
        currency,
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

  } catch (error: any) {
    console.error('Payment order creation error:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to create payment order', details: error?.message || undefined },
      { status: 500 }
    );
  }
}
