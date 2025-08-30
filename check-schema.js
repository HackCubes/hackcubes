const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');
  
  try {
    // Check assessments table
    console.log('1. Checking assessments table...');
    const { data: assessments, error: assessError } = await supabase
      .from('assessments')
      .select('*')
      .limit(1);
    
    if (assessError) {
      console.error('❌ Error fetching assessments:', assessError);
    } else if (assessments && assessments.length > 0) {
      console.log('✅ Assessment columns:', Object.keys(assessments[0]));
      console.log('   Sample assessment ID:', assessments[0].id);
    }
    
    // Check enrollments table
    console.log('\n2. Checking enrollments table...');
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .limit(1);
    
    if (enrollError) {
      console.error('❌ Error fetching enrollments:', enrollError);
    } else if (enrollments && enrollments.length > 0) {
      console.log('✅ Enrollment columns:', Object.keys(enrollments[0]));
      console.log('   Sample enrollment:', enrollments[0]);
    } else {
      console.log('ℹ️ No enrollments found');
    }
    
    // Check flag submissions table
    console.log('\n3. Checking flag_submissions table...');
    const { data: flagSubs, error: flagError } = await supabase
      .from('flag_submissions')
      .select('*')
      .limit(1);
    
    if (flagError) {
      console.error('❌ Error fetching flag submissions:', flagError);
    } else if (flagSubs && flagSubs.length > 0) {
      console.log('✅ Flag submission columns:', Object.keys(flagSubs[0]));
    } else {
      console.log('ℹ️ No flag submissions found');
    }
    
    // Check users table to understand the user ID structure
    console.log('\n4. Checking users table...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (userError) {
      console.error('❌ Error fetching profiles:', userError);
    } else if (users && users.length > 0) {
      console.log('✅ Profile columns:', Object.keys(users[0]));
      console.log('   Sample user ID:', users[0].id);
    } else {
      console.log('ℹ️ No profiles found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSchema();
