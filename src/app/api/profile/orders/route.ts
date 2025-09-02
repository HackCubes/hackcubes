import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔍 Fetching orders for user:', user.id, user.email);

    // Fetch user's orders
    const { data: orders, error: ordersError } = await supabase
      .from('certification_purchases')
      .select(`
        id,
        certification_id,
        order_id,
        payment_id,
        amount,
        currency,
        status,
        purchased_at
      `)
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    console.log('📦 Raw orders data:', orders?.length || 0, 'records found');
    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.certification_id} - ${order.amount} ${order.currency} - ${order.status}`);
      });
    }

    // Enhance orders with certification details
    const enhancedOrders = orders?.map(order => {
      let certificationName = order.certification_id;
      let certificationDescription = '';
      
      if (order.certification_id === 'hcjpt') {
        certificationName = 'HCJPT';
        certificationDescription = 'HackCube Certified Junior Penetration Tester';
      }

      return {
        ...order,
        certificationName,
        certificationDescription,
        formattedAmount: `${order.currency === 'INR' ? '₹' : '$'}${order.amount}`,
        purchaseDate: new Date(order.purchased_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    }) || [];

    return NextResponse.json({
      success: true,
      orders: enhancedOrders
    });

  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 