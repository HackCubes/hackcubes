import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      certificationId,
    } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify Razorpay signature
    const body_string = razorpay_order_id + '|' + razorpay_payment_id;
    const expected_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body_string)
      .digest('hex');

    if (expected_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Update payment order status
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'completed',
        payment_id: razorpay_payment_id,
        payment_signature: razorpay_signature,
        completed_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (updateError) {
      console.error('Error updating payment order:', updateError);
    }

    // Grant access to certification (HJCPT)
    const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';
    
    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('assessment_invitations')
      .select('id, status')
      .eq('assessment_id', HJCPT_ASSESSMENT_ID)
      .eq('email', user.email)
      .single();

    if (existingInvitation) {
      // Update existing invitation
      const { error: inviteUpdateError } = await supabase
        .from('assessment_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', existingInvitation.id);

      if (inviteUpdateError) {
        console.error('Error updating invitation:', inviteUpdateError);
      }
    } else {
      // Create new invitation
      const { error: inviteError } = await supabase
        .from('assessment_invitations')
        .insert({
          assessment_id: HJCPT_ASSESSMENT_ID,
          email: user.email,
          status: 'accepted',
          created_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
        });

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        return NextResponse.json(
          { error: 'Failed to grant certification access' },
          { status: 500 }
        );
      }
    }

    // Record the purchase
    const { error: purchaseError } = await supabase
      .from('certification_purchases')
      .insert({
        user_id: user.id,
        user_email: user.email,
        certification_id: certificationId,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: body.amount || 100, // Default to $100 for HJCPT
        currency: body.currency || 'USD',
        status: 'completed',
        purchased_at: new Date().toISOString(),
      });

    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and certification access granted',
      certificationAccess: true,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
