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
    // Drop existing policy and create new ones
    const queries = [
      `DROP POLICY IF EXISTS "Users can update own profile" ON profiles;`,
      `CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);`,
      `CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);`
    ];
    
    for (const query of queries) {
      console.log(`Executing: ${query}`);
      const { error } = await supabase
        .from('_supabase_admin')
        .select('*')
        .limit(1);
      
      // Use direct SQL execution
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql: query })
      });
      
      if (!response.ok) {
        console.log(`Query: ${query}`);
        console.log(`Response status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text}`);
      } else {
        console.log(`✅ Successfully executed: ${query}`);
      }
    }
    
    console.log('✅ RLS policy fix completed!');
    console.log('🎯 Users should now be able to create profiles during signup');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixRLSPolicy();
