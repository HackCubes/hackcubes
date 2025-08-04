#!/usr/bin/env node

// Simple script to test Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  // Check environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    return false;
  }

  if (!anonKey) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    return false;
  }

  if (!serviceKey) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
    return false;
  }

  console.log('✅ Environment variables found');
  console.log(`   URL: ${url}`);
  console.log(`   Anon Key: ${anonKey.substring(0, 20)}...`);
  console.log(`   Service Key: ${serviceKey.substring(0, 20)}...\n`);

  try {
    // Test connection with service role
    const supabase = createClient(url, serviceKey);
    
    // Test database connection
    const { data, error } = await supabase
      .from('waitlist')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    console.log(`   Waitlist table exists and is accessible\n`);

    // Test invite_codes table
    const { data: inviteCodes, error: inviteError } = await supabase
      .from('invite_codes')
      .select('count(*)', { count: 'exact', head: true });

    if (inviteError) {
      console.log('❌ Invite codes table not found:', inviteError.message);
      console.log('   Please run the database_setup.sql in your Supabase dashboard');
      return false;
    }

    console.log('✅ Challenge tables found and accessible');
    console.log('✅ Supabase setup is complete!\n');

    console.log('🎯 Next steps:');
    console.log('   1. Visit http://localhost:3000/challenge');
    console.log('   2. Open browser console (F12)');
    console.log('   3. Try the challenge: hackCubesChallenge.start()');

    return true;

  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection().catch(console.error);
