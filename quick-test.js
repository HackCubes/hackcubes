#!/usr/bin/env node

// Simple Supabase connection verification
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function quickTest() {
  console.log('🔍 Quick Supabase Connection Test\n');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log('❌ Missing environment variables');
    console.log('   Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  try {
    const supabase = createClient(url, key);
    
    // Simple connection test
    const { error } = await supabase.from('waitlist').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Database not set up yet');
      console.log('   Error:', error.message);
      console.log('\n📋 Next steps:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Open SQL Editor');
      console.log('   3. Copy/paste content from database_setup.sql');
      console.log('   4. Click Run');
      return;
    }

    console.log('✅ Basic connection works!');
    
    // Test invite codes table
    const { error: inviteError } = await supabase.from('invite_codes').select('count', { count: 'exact', head: true });
    
    if (inviteError) {
      console.log('⚠️  Challenge tables not found');
      console.log('   Please run the database_setup.sql in Supabase dashboard');
      return;
    }

    console.log('✅ Challenge tables found!');
    console.log('✅ Setup is complete!\n');
    
    console.log('🎯 Ready to test:');
    console.log('   Visit: http://localhost:3000/challenge');
    console.log('   Console: hackCubesChallenge.start()');

  } catch (err) {
    console.log('❌ Connection failed:', err.message);
    console.log('\n🔧 Check your .env.local file');
  }
}

quickTest().catch(console.error);
