require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkQuestionsAndFlags() {
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  console.log('🔍 Checking questions and flags for assessment:', assessmentId);
  console.log('');
  
  try {
    // Let's try to find questions that belong to this assessment
    // Since we don't have assessment_questions table, let's see what tables we can access
    
    console.log('1. Available tables check...');
    const tables = ['questions', 'flags', 'question_flags', 'assessment_questions'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: accessible (${data ? 'has data' : 'empty'})`);
          if (data && data.length > 0) {
            console.log(`      Sample columns: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }
    
    console.log('');
    
    // Since we have flag_submissions, let's see what questions they reference
    console.log('2. Questions referenced in flag_submissions...');
    const { data: flagSubmissions } = await supabase
      .from('flag_submissions')
      .select('question_id, flag_id, value, score')
      .not('question_id', 'is', null);
    
    const uniqueQuestions = [...new Set(flagSubmissions?.map(f => f.question_id) || [])];
    console.log(`   Found ${uniqueQuestions.length} unique question IDs:`);
    uniqueQuestions.forEach(qid => {
      const flags = flagSubmissions?.filter(f => f.question_id === qid) || [];
      console.log(`   - ${qid}: ${flags.length} flags`);
      flags.forEach(flag => {
        console.log(`     Flag ID: ${flag.flag_id}, Value: ${flag.value}, Score: ${flag.score}`);
      });
    });
    
    console.log('');
    
    // Let's also check if there are any users currently logged in that we can test with
    console.log('3. Testing user authentication...');
    console.log('   (This would normally require a browser session, but we can check user IDs from submissions)');
    
    const { data: submissions } = await supabase
      .from('submissions')
      .select('candidate_id')
      .eq('assessment_id', assessmentId);
    
    const userIds = [...new Set(submissions?.map(s => s.candidate_id) || [])];
    console.log(`   Users who have attempted this assessment: ${userIds.length}`);
    userIds.forEach(userId => {
      console.log(`   - ${userId}`);
    });
    
    console.log('');
    console.log('4. Recommended next steps:');
    console.log('   - Open http://localhost:3001/assessments/' + assessmentId);
    console.log('   - Sign in as one of the test users');
    console.log('   - Check browser console for any JavaScript errors');
    console.log('   - Try submitting a flag and watch the network tab for API calls');
    console.log('   - Verify that the handleSubmitFlagPerFlag function is being called');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkQuestionsAndFlags();
