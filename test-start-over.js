const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testStartOverLogic() {
  console.log('Testing Start Over Logic...\n');

  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  const userId = 'b2ea9cc8-e1a4-4077-a734-0b38cf9a3a17'; // Replace with actual user ID

  try {
    // 1. Check current enrollment status
    console.log('1. Checking current enrollment status...');
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('assessment_id', assessmentId)
      .single();
    
    if (!enrollment) {
      console.log('❌ No enrollment found');
      return;
    }
    
    console.log('✅ Current enrollment status:', enrollment.status);
    console.log('   Current score:', enrollment.current_score);
    console.log('   Final score:', enrollment.final_score);
    console.log('   Progress:', enrollment.progress_percentage + '%');

    // 2. Check if there are existing submissions
    console.log('\n2. Checking existing submissions...');
    const { data: existingSubmissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('candidate_id', userId);

    if (existingSubmissions && existingSubmissions.length > 0) {
      console.log('✅ Found modern submission:', existingSubmissions[0].id);
      console.log('   Status:', existingSubmissions[0].status);
      console.log('   Total score:', existingSubmissions[0].total_score);

      // Check flag submissions
      const { data: flagSubmissions } = await supabase
        .from('flag_submissions')
        .select('*')
        .eq('submission_id', existingSubmissions[0].id);

      console.log('   Flag submissions count:', flagSubmissions?.length || 0);
    } else {
      console.log('ℹ️  No modern submissions found');
    }

    // 3. Check legacy submissions
    const { data: legacySubmissions } = await supabase
      .from('user_flag_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('assessment_id', assessmentId);

    console.log('   Legacy submissions count:', legacySubmissions?.length || 0);

    console.log('\n✅ Start Over logic should work with this data state');
    console.log('\nTo test the actual reset:');
    console.log('1. Go to the results page');
    console.log('2. Click "Start Over"');
    console.log('3. Verify enrollment status changes to IN_PROGRESS');
    console.log('4. Verify all scores reset to 0');
    console.log('5. Verify flag submissions are cleared');

  } catch (error) {
    console.error('❌ Error testing start over logic:', error);
  }
}

testStartOverLogic();
