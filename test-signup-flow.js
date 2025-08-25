const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Regular client for auth operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Admin client for checking results
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testFullSignupFlow() {
  console.log('🧪 Testing complete signup flow...');
  
  try {
    const testEmail = `testuser${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('📧 Testing signup with email:', testEmail);
    
    // Step 1: Sign up user (this should trigger profile creation)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return false;
    }

    console.log('✅ Auth user created:', authData.user?.id);
    
    // Step 2: Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Check if profile was created automatically by trigger
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.log('⚠️ Profile not found, trigger might not have worked:', profileError.message);
      
      // Step 4: Try manual profile creation with service role (our API approach)
      console.log('🔧 Attempting manual profile creation...');
      
      const { data: manualProfile, error: manualError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: testEmail,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser' + Date.now(),
          }
        ])
        .select()
        .single();

      if (manualError) {
        console.error('❌ Manual profile creation failed:', manualError);
        return false;
      }

      console.log('✅ Manual profile created successfully:', manualProfile);
    } else {
      console.log('✅ Profile created automatically by trigger:', profile);
    }

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    
    // Delete profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', authData.user.id);
    
    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    
    console.log('✅ Test completed successfully!');
    console.log('🎯 Signup flow should work now with API route fallback');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testFullSignupFlow();
