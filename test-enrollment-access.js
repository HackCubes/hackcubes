const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iqefobkbzlyxcmlbqwxo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Set it in your environment or .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';

async function testEnrollmentAccess() {
  console.log('🧪 Testing Enrollment Access System\n');

  try {
    // Test 1: Check all users with access via different methods
    console.log('📊 Checking all access methods...\n');

    // Check enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        status,
        expires_at,
        created_at,
        profiles!inner(email, first_name, last_name)
      `)
      .eq('assessment_id', HJCPT_ASSESSMENT_ID);

    if (enrollError) {
      console.log('⚠️  Enrollments table error:', enrollError.message);
    } else {
      console.log(`✅ Found ${enrollments?.length || 0} direct enrollments:`);
      enrollments?.forEach((e, i) => {
        const expiry = new Date(e.expires_at);
        const isExpired = expiry < new Date();
        console.log(`   ${i + 1}. ${e.profiles.email} - ${e.status} - Expires: ${expiry.toLocaleDateString()} ${isExpired ? '🔴 EXPIRED' : '🟢'}`);
      });
    }

    // Check invitations
    const { data: invitations, error: inviteError } = await supabase
      .from('assessment_invitations')
      .select('*')
      .eq('assessment_id', HJCPT_ASSESSMENT_ID)
      .eq('status', 'accepted');

    if (inviteError) {
      console.log('⚠️  Invitations table error:', inviteError.message);
    } else {
      console.log(`\n✅ Found ${invitations?.length || 0} admin-granted invitations:`);
      invitations?.forEach((inv, i) => {
        console.log(`   ${i + 1}. ${inv.email} - Invited: ${new Date(inv.accepted_at || inv.created_at).toLocaleDateString()}`);
      });
    }

    // Check purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from('certification_purchases')
      .select('*')
      .eq('certification_id', 'hcjpt')
      .eq('status', 'completed');

    if (purchaseError) {
      console.log('⚠️  Purchases table error:', purchaseError.message);
    } else {
      console.log(`\n✅ Found ${purchases?.length || 0} completed purchases:`);
      purchases?.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.user_email} - $${p.amount} - Purchased: ${new Date(p.purchased_at).toLocaleDateString()}`);
      });
    }

    // Test 2: Test the API endpoint
    console.log('\n🔍 Testing API endpoint...');
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/enrollments?certificationId=hcjpt');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response successful!');
        console.log(`📊 Stats: Total: ${data.stats?.total || 0}, Active: ${data.stats?.active || 0}, Expired: ${data.stats?.expired || 0}`);
        console.log(`💳 Payment-based: ${data.stats?.paymentBased || 0}, Admin-granted: ${data.stats?.adminGranted || 0}`);
        
        if (data.enrollments && data.enrollments.length > 0) {
          console.log('\n👥 All users with access:');
          data.enrollments.forEach((enrollment, i) => {
            const name = enrollment.firstName && enrollment.lastName 
              ? `${enrollment.firstName} ${enrollment.lastName}`
              : 'No Name';
            const source = enrollment.enrollmentSource === 'payment' ? '💳 Paid' : 
                          enrollment.enrollmentSource === 'admin_grant' ? '👨‍💼 Admin' : '📝 Manual';
            const status = enrollment.isExpired ? '🔴 Expired' : 
                          enrollment.status === 'completed' ? '✅ Completed' : '🟢 Active';
            
            console.log(`   ${i + 1}. ${name} (${enrollment.userEmail})`);
            console.log(`       Source: ${source} | Status: ${status} | Progress: ${enrollment.progress}%`);
            console.log(`       Enrolled: ${new Date(enrollment.enrollmentDate).toLocaleDateString()}`);
            console.log(`       Expires: ${new Date(enrollment.expiryDate).toLocaleDateString()}`);
          });
        } else {
          console.log('   No enrollments found - this might indicate missing data or table issues');
        }
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', response.status, errorText);
      }
    } catch (apiError) {
      console.log('⚠️  API test failed (server may not be running):', apiError.message);
    }

    // Test 3: Verify database constraints and triggers
    console.log('\n🔧 Testing database features...');
    
    // Check if expires_at is automatically set
    const { data: sampleEnrollments } = await supabase
      .from('enrollments')
      .select('expires_at, created_at')
      .limit(3);

    const hasAutoExpiry = sampleEnrollments?.every(e => e.expires_at !== null);
    console.log(`✅ Auto-expiry working: ${hasAutoExpiry ? 'Yes' : 'No'}`);

    // Check for users without expiry
    const { data: noExpiry } = await supabase
      .from('enrollments')
      .select('id')
      .is('expires_at', null);

    if (noExpiry && noExpiry.length > 0) {
      console.log(`⚠️  ${noExpiry.length} enrollments without expiry dates - run the fix SQL!`);
    } else {
      console.log('✅ All enrollments have expiry dates');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function simulateNewAccess() {
  console.log('\n🎭 Simulating new user access...');

  try {
    // Get a test user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No users found to test with');
      return;
    }

    const testUser = profiles[0];
    console.log(`Using test user: ${testUser.email}`);

    // Simulate admin granting access
    console.log('\n1. Simulating admin grant...');
    
    // Create invitation
    const { error: inviteError } = await supabase
      .from('assessment_invitations')
      .upsert({
        assessment_id: HJCPT_ASSESSMENT_ID,
        email: testUser.email,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      }, { onConflict: 'assessment_id,email' });

    if (inviteError) {
      console.log('❌ Failed to create invitation:', inviteError.message);
    } else {
      console.log('✅ Admin invitation created');
    }

    // Create enrollment
    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert({
        user_id: testUser.id,
        assessment_id: HJCPT_ASSESSMENT_ID,
        status: 'ENROLLED',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'user_id,assessment_id' });

    if (enrollError) {
      console.log('❌ Failed to create enrollment:', enrollError.message);
    } else {
      console.log('✅ Enrollment created with 1-year expiry');
    }

    // Simulate purchase
    console.log('\n2. Simulating purchase...');
    
    const { error: purchaseError } = await supabase
      .from('certification_purchases')
      .upsert({
        user_email: testUser.email,
        certification_id: 'hcjpt',
        order_id: `test_order_${Date.now()}`,
        payment_id: `test_payment_${Date.now()}`,
        amount: 100,
        currency: 'USD',
        status: 'completed',
        purchased_at: new Date().toISOString(),
      });

    if (purchaseError) {
      console.log('❌ Failed to create purchase:', purchaseError.message);
    } else {
      console.log('✅ Purchase record created');
    }

    console.log('\n✅ Simulation complete! User should now appear in enrollment page.');

  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
  }
}

async function main() {
  await testEnrollmentAccess();
  
  if (process.argv.includes('--simulate')) {
    await simulateNewAccess();
  }

  console.log('\n📋 Summary:');
  console.log('1. Check the database tables are created properly');
  console.log('2. Test the API endpoint for enrollment data');  
  console.log('3. Verify the admin enrollment page shows all users');
  console.log('4. Test granting access via admin panel');
  console.log('5. Test purchasing a certification');
  console.log('\nRun with --simulate flag to add test data');
}

if (require.main === module) {
  main();
} 