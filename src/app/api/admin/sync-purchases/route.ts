import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // DISABLED FOR SECURITY - Only enable when needed for maintenance
  return NextResponse.json(
    { error: 'This endpoint is disabled for security reasons' },
    { status: 403 }
  );

  /* COMMENTED OUT - ADMIN SYNC FUNCTIONALITY
  try {
    const supabase = createClient();

    // Get current user (should be admin, but we'll allow any authenticated user for now)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting purchase sync for user:', user.email);

    // Get all completed payment orders that don't have corresponding certification purchases
    const { data: completedOrders, error: ordersError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('status', 'completed')
      .not('payment_id', 'is', null);

    if (ordersError) {
      console.error('Error fetching payment orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch payment orders' },
        { status: 500 }
      );
    }

    console.log(`📦 Found ${completedOrders?.length || 0} completed payment orders`);

    if (!completedOrders || completedOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed payment orders to sync',
        synced: 0
      });
    }

    let syncedCount = 0;
    const errors = [];

    for (const order of completedOrders) {
      try {
        // Check if purchase already exists
        const { data: existingPurchase } = await supabase
          .from('certification_purchases')
          .select('id')
          .eq('order_id', order.razorpay_order_id)
          .maybeSingle();

        if (existingPurchase) {
          console.log(`⏭️ Purchase already exists for order ${order.razorpay_order_id}`);
          continue;
        }

        // Set valid_until to 1 year from purchase date
        const purchaseDate = new Date(order.completed_at || order.updated_at);
        const validUntil = new Date(purchaseDate);
        validUntil.setFullYear(validUntil.getFullYear() + 1);

        // Create certification purchase record
        const { data: newPurchase, error: purchaseError } = await supabase
          .from('certification_purchases')
          .insert({
            user_id: order.user_id,
            user_email: order.user_email,
            certification_id: order.certification_id,
            order_id: order.razorpay_order_id,
            payment_id: order.payment_id,
            amount: order.amount,
            currency: order.currency,
            status: 'completed',
            purchased_at: order.completed_at || order.updated_at,
            valid_until: validUntil.toISOString(), // Add certification validity
          })
          .select()
          .single();

        if (purchaseError) {
          console.error(`❌ Error creating purchase for order ${order.razorpay_order_id}:`, purchaseError);
          errors.push({
            order_id: order.razorpay_order_id,
            error: purchaseError.message
          });
        } else {
          console.log(`✅ Created purchase record for order ${order.razorpay_order_id}`);
          syncedCount++;
        }

      } catch (err: any) {
        console.error(`❌ Error processing order ${order.razorpay_order_id}:`, err);
        errors.push({
          order_id: order.razorpay_order_id,
          error: err.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} purchases`,
      synced: syncedCount,
      total_orders: completedOrders.length,
      errors: errors
    });

  } catch (error: any) {
    console.error('Sync purchases error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
  */
} 