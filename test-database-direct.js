const { createClient } = require('@supabase/supabase-js');

// Configuration - you'll need to set this environment variable
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://caqyqngqsgdezotvsbor.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';

async function testDatabaseDirect() {
  console.log('🗄️  Testing Database Operations Directly\n');
  console.log('='.repeat(60) + '\n');
  
  if (!supabaseServiceKey) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.log('💡 Set this to test database operations directly');
    console.log('\n📋 Alternative: Test the grant process manually in browser');
    console.log('1. Go to http://localhost:3000/admin/certifications');
    console.log('2. Try granting access to a user');
    console.log('3. Check browser console for any errors');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Step 1: Check current database state
    console.log('📊 Step 1: Checking Current Database State...\n');
    
    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .limit(5);
    
    if (profilesError) {
      console.log(`❌ Error fetching profiles: ${profilesError.message}`);
      return;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} profiles (showing first 5)`);
    if (profiles && profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.first_name || 'No'} ${profile.last_name || 'Name'} (${profile.email})`);
      });
    }
    
    // Check assessment_invitations table
    console.log('\n📊 Step 2: Checking Assessment Invitations Table...');
    
    const { data: invitations, error: invitationsError } = await supabase
      .from('assessment_invitations')
      .select('id, email, status, created_at, accepted_at')
      .eq('assessment_id', HJCPT_ASSESSMENT_ID);
    
    if (invitationsError) {
      console.log(`❌ Error fetching invitations: ${invitationsError.message}`);
      console.log('💡 This suggests the table might not exist or have wrong structure');
    } else {
      console.log(`✅ Found ${invitations?.length || 0} assessment invitations for HJCPT`);
      if (invitations && invitations.length > 0) {
        invitations.forEach((inv, index) => {
          const status = inv.status === 'accepted' ? '✅ Accepted' : '⏳ Pending';
          console.log(`   ${index + 1}. ${inv.email} - ${status} (${new Date(inv.created_at).toLocaleDateString()})`);
        });
      } else {
        console.log('   📝 No invitations found - this explains why enrollments page shows 0 users');
      }
    }
    
    // Check enrollments table
    console.log('\n📊 Step 3: Checking Enrollments Table...');
    
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        status,
        created_at,
        expires_at,
        profiles!inner(email, first_name, last_name)
      `)
      .eq('assessment_id', HJCPT_ASSESSMENT_ID);
    
    if (enrollmentsError) {
      console.log(`❌ Error fetching enrollments: ${enrollmentsError.message}`);
    } else {
      console.log(`✅ Found ${enrollments?.length || 0} enrollment records for HJCPT`);
      if (enrollments && enrollments.length > 0) {
        enrollments.forEach((enrollment, index) => {
          const name = `${enrollment.profiles.first_name || 'No'} ${enrollment.profiles.last_name || 'Name'}`;
          console.log(`   ${index + 1}. ${name} (${enrollment.profiles.email}) - ${enrollment.status}`);
        });
      }
    }
    
    // Step 4: Test creating an invitation manually
    console.log('\n📊 Step 4: Testing Manual Invitation Creation...');
    
    const testEmail = 'test-db@example.com';
    console.log(`   🎯 Creating invitation for: ${testEmail}`);
    
    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('assessment_invitations')
      .select('id')
      .eq('assessment_id', HJCPT_ASSESSMENT_ID)
      .eq('email', testEmail)
      .maybeSingle();
    
    if (existingInvitation) {
      console.log(`   ⚠️  Invitation already exists for ${testEmail}`);
    } else {
      // Create new invitation
      const { data: newInvitation, error: createError } = await supabase
        .from('assessment_invitations')
        .insert({
          assessment_id: HJCPT_ASSESSMENT_ID,
          email: testEmail,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.log(`   ❌ Failed to create invitation: ${createError.message}`);
        console.log('💡 This suggests a database structure or permission issue');
      } else {
        console.log(`   ✅ Successfully created invitation for ${testEmail}`);
        console.log(`      ID: ${newInvitation.id}, Status: ${newInvitation.status}`);
        
        // Now test if the enrollment API can see this user
        console.log('\n📊 Step 5: Testing if Enrollment API Sees New User...');
        
        const testResponse = await fetch('http://localhost:3000/api/admin/enrollments?certificationId=hcjpt');
        if (testResponse.ok) {
          const testData = await testResponse.json();
          const foundUser = testData.enrollments?.find(u => u.userEmail === testEmail);
          
          if (foundUser) {
            console.log(`   ✅ SUCCESS! User ${testEmail} now appears in enrollment API`);
            console.log(`      Status: ${foundUser.status}, Source: ${foundUser.enrollmentSource}`);
          } else {
            console.log(`   ❌ FAILED! User ${testEmail} still not visible in enrollment API`);
            console.log('💡 This suggests the API logic is not working correctly');
          }
        } else {
          console.log(`   ❌ Error testing enrollment API: ${testResponse.status}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNOSIS RESULTS:');
    
    if (invitations && invitations.length > 0) {
      console.log('✅ Database tables exist and have data');
      console.log('❌ But enrollment API is not showing the data');
      console.log('💡 Issue: API logic problem');
    } else if (invitationsError) {
      console.log('❌ Database table structure issue');
      console.log('💡 Issue: Missing or malformed assessment_invitations table');
    } else {
      console.log('✅ Database tables exist but are empty');
      console.log('💡 Issue: No users have been granted access yet');
    }
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Check if the grant process creates invitations in the database');
    console.log('2. Verify the enrollment API queries the right tables');
    console.log('3. Test manually in browser to see actual errors');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

// Run the test
testDatabaseDirect(); 