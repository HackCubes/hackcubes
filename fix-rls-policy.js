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

async function fixRLSPolicy() {
  console.log('🔧 Fixing RLS policy for profiles table...');
  
  try {
    // Drop existing policy
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
      `
    });
    
    // Create correct policies
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can insert own profile" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);
      `
    });
    
    if (error) {
      console.error('❌ Error fixing RLS policy:', error);
      return;
    }
    
    console.log('✅ RLS policy fixed successfully!');
    console.log('🎯 Users can now create profiles during signup');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixRLSPolicy();
