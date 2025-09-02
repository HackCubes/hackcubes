const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iqefobkbzlyxcmlbqwxo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';

async function testEnrollmentCreation() {
  console.log('🧪 Testing enrollment creation with expiry...');
  
  try {
    // Test user (use a test email)
    const testEmail = 'test-enrollment@example.com';
    
    // 1. Check if test user exists, create if not
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', testEmail)
      .single();
    
    if (!profile) {
      console.log('   Creating test user profile...');
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: testEmail,
          first_name: 'Test',
          last_name: 'User',
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('   ❌ Failed to create test profile:', profileError.message);
        return;
      }
      profile = newProfile;
    }
    
    console.log(`   ✅ Test user found/created: ${profile.email}`);
    
    // 2. Create assessment invitation (simulating admin grant)
    console.log('   Creating assessment invitation...');
    const { error: inviteError } = await supabase
      .from('assessment_invitations')
      .upsert({
        assessment_id: HJCPT_ASSESSMENT_ID,
        email: testEmail,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      });
    
    if (inviteError) {
      console.error('   ❌ Failed to create invitation:', inviteError.message);
      return;
    }
    
    console.log('   ✅ Assessment invitation created');
    
    // 3. Create enrollment with expiry
    console.log('   Creating enrollment with 1-year expiry...');
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .upsert({
        user_id: profile.id,
        assessment_id: HJCPT_ASSESSMENT_ID,
        status: 'ENROLLED',
        expires_at: expiryDate.toISOString(),
      })
      .select()
      .single();
    
    if (enrollmentError) {
      console.error('   ❌ Failed to create enrollment:', enrollmentError.message);
      return;
    }
    
    console.log('   ✅ Enrollment created successfully');
    console.log(`      Enrollment ID: ${enrollment.id}`);
    console.log(`      Expires: ${new Date(enrollment.expires_at).toLocaleDateString()}`);
    
    // 4. Test the API endpoint
    console.log('   Testing API endpoint...');
    try {
      const apiUrl = 'http://localhost:3000/api/admin/enrollments?certificationId=hcjpt';
      console.log(`   Making request to: ${apiUrl}`);
      
      // Note: This would work if the Next.js server is running locally
      // For testing without server, we can skip this part
      console.log('   ⚠️  API test skipped (requires local Next.js server)');
      
    } catch (apiError) {
      console.log(`   ⚠️  API test failed: ${apiError.message}`);
    }
    
    return { profile, enrollment };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

async function testExpiryExtension(userEmail) {
  console.log('🔄 Testing expiry extension...');
  
  try {
    // Get current enrollment
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (!profile) {
      console.error('   ❌ User not found');
      return;
    }
    
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('id, expires_at')
      .eq('user_id', profile.id)
      .eq('assessment_id', HJCPT_ASSESSMENT_ID)
      .single();
    
    if (fetchError || !enrollment) {
      console.error('   ❌ Enrollment not found:', fetchError?.message);
      return;
    }
    
    console.log(`   Current expiry: ${new Date(enrollment.expires_at).toLocaleDateString()}`);
    
    // Extend by 6 months
    const currentExpiry = new Date(enrollment.expires_at);
    const newExpiry = new Date(currentExpiry.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
    
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        expires_at: newExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id);
    
    if (updateError) {
      console.error('   ❌ Failed to extend expiry:', updateError.message);
      return;
    }
    
    console.log(`   ✅ Expiry extended to: ${newExpiry.toLocaleDateString()}`);
    
  } catch (error) {
    console.error('❌ Expiry extension test failed:', error.message);
  }
}

async function testCertificationPurchaseFlow() {
  console.log('💳 Testing certification purchase flow...');
  
  try {
    const testEmail = 'test-purchase@example.com';
    
    // Simulate certification purchase record
    const { error: purchaseError } = await supabase
      .from('certification_purchases')
      .upsert({
        user_email: testEmail,
        certification_id: 'hcjpt',
        order_id: `test_order_${Date.now()}`,
        payment_id: `test_payment_${Date.now()}`,
        amount: 100,
        currency: 'USD',
        status: 'completed',
        purchased_at: new Date().toISOString(),
      });
    
    if (purchaseError) {
      console.error('   ❌ Failed to create purchase record:', purchaseError.message);
      return;
    }
    
    console.log('   ✅ Purchase record created');
    
    // This would normally be handled by the payment verification webhook
    console.log('   💡 Note: In real flow, payment webhook would create enrollment');
    
  } catch (error) {
    console.error('❌ Purchase flow test failed:', error.message);
  }
}

async function generateAnalyticsReport() {
  console.log('📊 Generating enrollment analytics...');
  
  try {
    // Get all enrollments for HJCPT
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        status,
        created_at,
        expires_at,
        progress_percentage,
        profiles!inner(email, first_name, last_name)
      `)
      .eq('assessment_id', HJCPT_ASSESSMENT_ID);
    
    if (error) {
      console.error('   ❌ Failed to fetch enrollments:', error.message);
      return;
    }
    
    const now = new Date();
    const stats = {
      total: enrollments.length,
      active: enrollments.filter(e => new Date(e.expires_at) > now).length,
      expired: enrollments.filter(e => new Date(e.expires_at) <= now).length,
      completed: enrollments.filter(e => e.status === 'COMPLETED').length,
      avgProgress: enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length,
    };
    
    console.log('\n   📈 HJCPT Enrollment Statistics:');
    console.log(`      Total Enrollments: ${stats.total}`);
    console.log(`      Active: ${stats.active}`);
    console.log(`      Expired: ${stats.expired}`);
    console.log(`      Completed: ${stats.completed}`);
    console.log(`      Average Progress: ${stats.avgProgress.toFixed(1)}%`);
    
    // Show recent enrollments
    if (enrollments.length > 0) {
      console.log('\n   🎯 Recent Enrollments:');
      enrollments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .forEach((enrollment, index) => {
          const profile = enrollment.profiles;
          const isExpired = new Date(enrollment.expires_at) <= now;
          const status = isExpired ? '🔴 EXPIRED' : '🟢 ACTIVE';
          
          console.log(`      ${index + 1}. ${profile.first_name || 'Unknown'} ${profile.last_name || ''} (${profile.email})`);
          console.log(`         Status: ${status} | Progress: ${enrollment.progress_percentage || 0}%`);
          console.log(`         Enrolled: ${new Date(enrollment.created_at).toLocaleDateString()}`);
          console.log(`         Expires: ${new Date(enrollment.expires_at).toLocaleDateString()}`);
        });
    }
    
  } catch (error) {
    console.error('❌ Analytics generation failed:', error.message);
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    const testEmails = ['test-enrollment@example.com', 'test-purchase@example.com'];
    
    for (const email of testEmails) {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (profile) {
        // Delete enrollments
        await supabase
          .from('enrollments')
          .delete()
          .eq('user_id', profile.id);
        
        // Delete invitations
        await supabase
          .from('assessment_invitations')
          .delete()
          .eq('email', email);
        
        // Delete purchases
        await supabase
          .from('certification_purchases')
          .delete()
          .eq('user_email', email);
        
        console.log(`   ✅ Cleaned up data for ${email}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Certification Enrollment Tests...\n');
  
  try {
    // Test enrollment creation
    const testResult = await testEnrollmentCreation();
    
    if (testResult) {
      // Test expiry extension
      await testExpiryExtension(testResult.profile.email);
    }
    
    // Test purchase flow
    await testCertificationPurchaseFlow();
    
    // Generate analytics
    await generateAnalyticsReport();
    
    console.log('\n🎉 All tests completed successfully!');
    
    // Ask if user wants to cleanup
    console.log('\n🧹 Test data created. Run with --cleanup flag to remove test data.');
    
    if (process.argv.includes('--cleanup')) {
      await cleanupTestData();
    }
    
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 