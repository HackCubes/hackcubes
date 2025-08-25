const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testProfileCreation() {
  console.log('🧪 Testing profile creation with service role...');
  
  try {
    // Generate a proper UUID for testing
    const { v4: uuidv4 } = require('uuid');
    const testUserId = uuidv4();
    
    console.log('Generated test UUID:', testUserId);
    
    // Try to create a profile directly with service role
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: testUserId,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser' + Date.now(),
        }
      ])
      .select();

    if (error) {
      console.error('❌ Profile creation failed:', error);
      return false;
    }

    console.log('✅ Profile created successfully:', data[0]);
    
    // Clean up test data
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);
    
    console.log('🧹 Test data cleaned up');
    console.log('🎯 Profile creation should now work in signup flow!');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testProfileCreation();
