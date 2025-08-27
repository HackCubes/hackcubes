const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testDatabaseStructure() {
  console.log('🧪 Testing Database Structure...');

  try {
    // Read environment variables
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Check if submissions table exists with progress_percentage
    console.log('\n1️⃣ Testing submissions table...');
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, progress_percentage')
        .limit(1);
      
      if (error) {
        console.log('❌ submissions table error:', error.message);
      } else {
        console.log('✅ submissions table accessible with progress_percentage');
      }
    } catch (e) {
      console.log('❌ submissions table not accessible');
    }

    // Test 2: Check if enrollments table has final_score
    console.log('\n2️⃣ Testing enrollments table...');
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, final_score')
        .limit(1);
      
      if (error) {
        console.log('❌ enrollments table error:', error.message);
      } else {
        console.log('✅ enrollments table accessible with final_score');
      }
    } catch (e) {
      console.log('❌ enrollments table not accessible');
    }

    // Test 3: Check if flag_submissions table has submission_id
    console.log('\n3️⃣ Testing flag_submissions table...');
    try {
      const { data, error } = await supabase
        .from('flag_submissions')
        .select('id, submission_id')
        .limit(1);
      
      if (error) {
        console.log('❌ flag_submissions table error:', error.message);
      } else {
        console.log('✅ flag_submissions table accessible with submission_id');
      }
    } catch (e) {
      console.log('❌ flag_submissions table not accessible');
    }

    // Test 4: Check if user_flag_submissions table exists
    console.log('\n4️⃣ Testing user_flag_submissions table...');
    try {
      const { data, error } = await supabase
        .from('user_flag_submissions')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log('❌ user_flag_submissions table error:', error.message);
      } else {
        console.log('✅ user_flag_submissions table accessible');
      }
    } catch (e) {
      console.log('❌ user_flag_submissions table not accessible');
    }

    console.log('\n📋 Database structure test complete');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabaseStructure().catch(console.error);
