require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCorrectFlagSubmission() {
  console.log('🧪 Testing correct flag submission...\n');
  
  try {
    // Get a flag to test with
    const { data: flags } = await supabase
      .from('flags')
      .select('*')
      .eq('question_id', 'f6ce8293-3ea2-4657-8102-32e3e7c78b28')
      .limit(1);
    
    if (!flags || flags.length === 0) {
      console.log('❌ No flags found for question');
      return;
    }
    
    const testFlag = flags[0];
    console.log('🏁 Testing with flag:', testFlag);
    
    // Create or get a submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .upsert({
        assessment_id: '533d4e96-fe35-4540-9798-162b3f261572',
        candidate_id: '77b7ee7c-828d-42b6-b84e-f919174ce1eb',
        status: 'STARTED',
        type: 'CTF'
      }, {
        onConflict: 'assessment_id,candidate_id'
      })
      .select()
      .single();
    
    if (submissionError) {
      console.log('❌ Cannot create submission:', submissionError.message);
      return;
    }
    
    console.log('✅ Using submission:', submission.id);
    
    // Clear any existing flag submissions for this test
    await supabase
      .from('flag_submissions')
      .delete()
      .eq('submission_id', submission.id)
      .eq('flag_id', testFlag.id);
    
    // Test submission with CORRECT flag value
    console.log('\n📝 Submitting CORRECT flag value:', testFlag.value);
    
    // Calculate correctness client-side like the frontend does
    const userAnswer = testFlag.is_case_sensitive ? testFlag.value : testFlag.value.toLowerCase();
    const flagValue = testFlag.is_case_sensitive ? testFlag.value : testFlag.value.toLowerCase();
    const isCorrect = userAnswer === flagValue;
    const pointsAwarded = isCorrect ? testFlag.score : 0;
    
    console.log('   Client-side validation:', { userAnswer, flagValue, isCorrect, pointsAwarded });
    
    const { data: correctSubmission, error: correctError } = await supabase
      .from('flag_submissions')
      .insert({
        submission_id: submission.id,
        question_id: testFlag.question_id,
        flag_id: testFlag.id,
        value: testFlag.value, // Submit the CORRECT value
        submitted_flag: testFlag.value, // Also provide for legacy compatibility
        is_correct: isCorrect, // Set client-computed correctness
        score: pointsAwarded, // Set client-computed score
        flag_type: testFlag.type || 'USER'
      })
      .select()
      .single();
    
    if (correctError) {
      console.log('❌ Correct submission failed:', correctError.message);
    } else {
      console.log('✅ Correct submission result:');
      console.log(`   Is correct: ${correctSubmission.is_correct}`);
      console.log(`   Score: ${correctSubmission.score}`);
      console.log(`   Expected: is_correct=true, score=${testFlag.score}`);
      
      if (!correctSubmission.is_correct) {
        console.log('🚨 BUG CONFIRMED: Correct answer marked as incorrect!');
        console.log('   Submitted:', correctSubmission.value);
        console.log('   Expected:', testFlag.value);
        console.log('   Case sensitive:', testFlag.is_case_sensitive);
        
        // Let's check if there's a trigger
        console.log('\n🔍 Checking if trigger fired...');
        console.log('   Flag hash:', testFlag.hash);
        console.log('   Flag value:', testFlag.value);
        
        // Maybe the issue is that the trigger validation function doesn't exist
        // Let's test with wrong answer to see if that gets marked correctly
        console.log('\n📝 Testing with WRONG answer...');
        
        const { data: wrongSubmission, error: wrongError } = await supabase
          .from('flag_submissions')
          .insert({
            submission_id: submission.id,
            question_id: testFlag.question_id,
            flag_id: testFlag.id,
            value: 'definitely_wrong_answer',
            submitted_flag: 'definitely_wrong_answer', // Also provide for legacy compatibility
            flag_type: testFlag.type || 'USER'
          })
          .select()
          .single();
        
        if (wrongError) {
          console.log('❌ Wrong submission failed:', wrongError.message);
        } else {
          console.log('✅ Wrong submission result:');
          console.log(`   Is correct: ${wrongSubmission.is_correct}`);
          console.log(`   Score: ${wrongSubmission.score}`);
          
          if (wrongSubmission.is_correct === false && wrongSubmission.score === 0) {
            console.log('✅ Wrong answer correctly marked as incorrect');
            console.log('🔍 This means the validation is working but has an issue with correct answers');
          }
        }
      } else {
        console.log('🎉 SUCCESS: Correct answer properly validated!');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCorrectFlagSubmission();
