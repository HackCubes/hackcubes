import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const certificationId = searchParams.get('certificationId');

    if (!orderId && !certificationId) {
      return NextResponse.json(
        { error: 'Either orderId or certificationId is required' },
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

    if (orderId) {
      // Check specific order status
      const { data: order, error: orderError } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .eq('user_email', user.email)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        order: {
          id: order.order_id,
          status: order.status,
          amount: order.amount,
          currency: order.currency,
          certification_id: order.certification_id,
          created_at: order.created_at,
          completed_at: order.completed_at,
        },
      });
    }

    if (certificationId) {
      // Check if user has access to certification
      const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';
      
      if (certificationId === 'hcjpt') {
        const { data: invitation } = await supabase
          .from('assessment_invitations')
          .select('id, status, accepted_at')
          .eq('assessment_id', HJCPT_ASSESSMENT_ID)
          .eq('email', user.email)
          .single();

        const hasAccess = invitation && invitation.status === 'accepted';

        // Also check purchase history
        const { data: purchases } = await supabase
          .from('certification_purchases')
          .select('*')
          .eq('user_email', user.email)
          .eq('certification_id', certificationId)
          .eq('status', 'completed')
          .order('purchased_at', { ascending: false });

        return NextResponse.json({
          success: true,
          hasAccess,
          accessGrantedAt: invitation?.accepted_at,
          purchases: purchases || [],
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
