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

    console.log('🔍 Payment verification started:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      certificationId
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('❌ Missing payment verification fields');
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
      console.error('❌ Invalid payment signature');
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    console.log('✅ Payment signature verified for user:', user.email);

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
      .maybeSingle();

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
      // Create new invitation (omit created_at to match schema)
      const { error: inviteError } = await supabase
        .from('assessment_invitations')
        .insert({
          assessment_id: HJCPT_ASSESSMENT_ID,
          email: user.email,
          status: 'accepted',
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

    // Create or update enrollment with 1-year expiry
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now

    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .eq('assessment_id', HJCPT_ASSESSMENT_ID)
      .maybeSingle();

    if (existingEnrollment) {
      // Update existing enrollment - extend expiry if current expiry is sooner than 1 year from now
      const currentExpiry = new Date(existingEnrollment.expires_at);
      const newExpiry = currentExpiry > expiryDate ? currentExpiry : expiryDate;
      
      const { error: enrollmentUpdateError } = await supabase
        .from('enrollments')
        .update({
          expires_at: newExpiry.toISOString(),
          status: 'ENROLLED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEnrollment.id);

      if (enrollmentUpdateError) {
        console.error('Error updating enrollment:', enrollmentUpdateError);
      }
    } else {
      // Create new enrollment with 1-year expiry
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          assessment_id: HJCPT_ASSESSMENT_ID,
          status: 'ENROLLED',
          expires_at: expiryDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        // Don't fail the payment if enrollment creation fails, but log it
      }
    }

    // Record the purchase (use request body values if provided, else fallbacks)
    const purchaseAmount = Number(body.amount);
    const purchaseCurrency = typeof body.currency === 'string' ? body.currency : 'USD';

    console.log('💰 Recording purchase in certification_purchases table...');
    console.log('Purchase data:', {
      user_id: user.id,
      user_email: user.email,
      certification_id: certificationId,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: Number.isFinite(purchaseAmount) ? purchaseAmount : 1,
      currency: purchaseCurrency,
      status: 'completed',
      purchased_at: new Date().toISOString(),
    });

    // Set valid_until to 1 year from now (for certification validity)
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const { data: purchaseData, error: purchaseError } = await supabase
      .from('certification_purchases')
      .insert({
        user_id: user.id,
        user_email: user.email,
        certification_id: certificationId,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: Number.isFinite(purchaseAmount) ? purchaseAmount : 1,
        currency: purchaseCurrency,
        status: 'completed',
        purchased_at: new Date().toISOString(),
        valid_until: validUntil.toISOString(), // Add certification validity
      })
      .select();

    if (purchaseError) {
      console.error('❌ Error recording purchase:', purchaseError);
      console.error('Full purchase error details:', JSON.stringify(purchaseError, null, 2));
      // Don't fail the payment if purchase recording fails, but log it heavily
    } else {
      console.log('✅ Purchase recorded successfully:', purchaseData);
    }

    // Send enrollment email notification
    try {
      // Get user profile for personalized email
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      const userName = profile 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        : undefined;

      // Send enrollment email
      const emailResponse = await fetch(`${request.url.split('/api')[0]}/api/emails/certification-enrolled`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          name: userName,
          certificationCode: 'HCJPT',
          assessmentId: HJCPT_ASSESSMENT_ID,
        }),
      });

      if (!emailResponse.ok) {
        console.warn('Failed to send enrollment email:', await emailResponse.text());
      } else {
        console.log('Enrollment email sent successfully to:', user.email);
      }

      // Send payment success email
      const paymentEmailResponse = await fetch(`${request.url.split('/api')[0]}/api/emails/payment-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          name: userName,
          certificationCode: 'HCJPT',
          amount: Number.isFinite(purchaseAmount) ? purchaseAmount : 1,
          currency: purchaseCurrency,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          assessmentId: HJCPT_ASSESSMENT_ID,
        }),
      });

      if (!paymentEmailResponse.ok) {
        console.warn('Failed to send payment success email:', await paymentEmailResponse.text());
      } else {
        console.log('Payment success email sent successfully to:', user.email);
      }
    } catch (emailError) {
      console.warn('Error sending enrollment email:', emailError);
      // Don't fail the payment if email fails
    }

    console.log('🎉 Payment verification completed successfully for:', user.email);

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
