const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🔧 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error);
    return false;
  }
}

async function checkTables() {
  console.log('📋 Checking if payment tables exist...');
  
  try {
    // Check payment_orders table
    const { error: ordersError } = await supabase
      .from('payment_orders')
      .select('id')
      .limit(1);

    // Check certification_purchases table  
    const { error: purchasesError } = await supabase
      .from('certification_purchases')
      .select('id')
      .limit(1);

    if (!ordersError && !purchasesError) {
      console.log('✅ Payment tables already exist');
      return true;
    }

    console.log('⚠️  Payment tables do not exist');
    return false;
  } catch (error) {
    console.log('⚠️  Payment tables do not exist');
    return false;
  }
}

async function main() {
  console.log('🚀 HackCubes Payment System Setup\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  // Check if tables exist
  const tablesExist = await checkTables();

  if (!tablesExist) {
    console.log('\n📝 MANUAL SETUP REQUIRED:');
    console.log('1. Open your Supabase dashboard: https://app.supabase.com');
    console.log('2. Navigate to SQL Editor → New query');
    console.log('3. Copy and paste the contents of payment-tables-setup.sql');
    console.log('4. Click "Run" to execute the SQL');
    console.log('5. Run this script again to verify setup\n');
    
    console.log('💡 The payment tables are required for the payment integration to work.');
    console.log('💡 After creating the tables, users will be able to purchase HJCPT certification.');
  } else {
    console.log('\n✅ Payment system is ready!');
    console.log('🎉 Users can now purchase HJCPT certification for $100');
    console.log('🔗 Test the integration at: /certification/hcjpt');
  }

  console.log('\n📖 For detailed setup instructions, see PAYMENT_INTEGRATION.md');
}

main().catch(console.error);
