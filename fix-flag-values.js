require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFlagValues() {
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  console.log('🔧 Fixing flag values and scoring issues...');
  console.log('');
  
  try {
    // 1. Get the flag IDs that have null values
    console.log('1. Checking flags with null values...');
    const { data: flagsWithNullValues } = await supabase
      .from('flag_submissions')
      .select('flag_id, question_id')
      .is('value', null);
    
    console.log(`   Found ${flagsWithNullValues?.length || 0} flag submissions with null values`);
    
    // 2. Check the actual flags table for these flag IDs
    const flagIds = flagsWithNullValues?.map(f => f.flag_id) || [];
    if (flagIds.length > 0) {
      console.log('   Checking flags table for these IDs...');
      const { data: actualFlags } = await supabase
        .from('flags')
        .select('*')
        .in('id', flagIds);
      
      console.log(`   Found ${actualFlags?.length || 0} flags in flags table:`);
      actualFlags?.forEach(flag => {
        console.log(`     - ${flag.id}: value="${flag.value}", score=${flag.score}, type=${flag.type}`);
      });
      
      // 3. Update flag_submissions with correct values from flags table
      console.log('   Updating flag_submissions with correct values...');
      for (const flag of actualFlags || []) {
        const { error } = await supabase
          .from('flag_submissions')
          .update({ 
            value: flag.value,
            score: flag.score 
          })
          .eq('flag_id', flag.id);
        
        if (error) {
          console.log(`     ❌ Error updating flag ${flag.id}: ${error.message}`);
        } else {
          console.log(`     ✅ Updated flag ${flag.id} with value: ${flag.value}`);
        }
      }
    }
    
    console.log('');
    
    // 4. Let's also check all questions for this assessment
    console.log('2. Checking all questions and their flags...');
    
    // We need to find questions that belong to this assessment
    // Let's check the question IDs we found in flag_submissions
    const questionIds = ['b344955c-32a5-4097-b8ec-9f44c929d9ee', '1c407890-4181-47e6-86a1-5f281cb32043'];
    
    for (const questionId of questionIds) {
      console.log(`   Question: ${questionId}`);
      
      // Get question details
      const { data: question } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();
      
      if (question) {
        console.log(`     Name: ${question.name}`);
        console.log(`     Score: ${question.score}`);
        console.log(`     No of flags: ${question.no_of_flags}`);
      }
      
      // Get flags for this question
      const { data: flags } = await supabase
        .from('flags')
        .select('*')
        .eq('question_id', questionId);
      
      console.log(`     Flags (${flags?.length || 0}):`);
      flags?.forEach(flag => {
        console.log(`       - ${flag.type}: "${flag.value}" (${flag.score} points)`);
      });
      console.log('');
    }
    
    console.log('3. Testing corrected flag validation...');
    
    // Now let's test if the corrected flags work for submission
    const testCases = [
      { questionId: 'b344955c-32a5-4097-b8ec-9f44c929d9ee', flagValue: '25cd81141e4b7a0acc37f7a070d589c6', expectedScore: 25 },
      { questionId: '1c407890-4181-47e6-86a1-5f281cb32043', flagValue: 'this_is_user_flag_1337', expectedScore: 100 }
    ];
    
    for (const testCase of testCases) {
      console.log(`   Testing flag: ${testCase.flagValue}`);
      
      // Get the flag details
      const { data: flags } = await supabase
        .from('flags')
        .select('*')
        .eq('question_id', testCase.questionId);
      
      const matchingFlag = flags?.find(f => f.value === testCase.flagValue);
      if (matchingFlag) {
        console.log(`     ✅ Flag found: ${matchingFlag.type}, Score: ${matchingFlag.score}`);
      } else {
        console.log(`     ❌ Flag not found. Available flags:`);
        flags?.forEach(f => console.log(`       - "${f.value}" (${f.type})`));
      }
    }
    
    console.log('');
    console.log('4. Creating a simple test submission...');
    
    // Find a test submission to work with
    const { data: testSubmission } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('status', 'STARTED')
      .limit(1)
      .single();
    
    if (testSubmission) {
      console.log(`   Using submission: ${testSubmission.id}`);
      
      // Clear existing flag submissions for this test
      await supabase
        .from('flag_submissions')
        .delete()
        .eq('submission_id', testSubmission.id);
      
      // Test submitting a correct flag
      const { data: flags } = await supabase
        .from('flags')
        .select('*')
        .eq('question_id', '1c407890-4181-47e6-86a1-5f281cb32043')
        .eq('value', 'this_is_user_flag_1337')
        .single();
      
      if (flags) {
        console.log(`   Submitting correct flag: ${flags.value}`);
        
        const { data: newSubmission, error } = await supabase
          .from('flag_submissions')
          .insert({
            submission_id: testSubmission.id,
            question_id: flags.question_id,
            flag_id: flags.id,
            submitted_flag: flags.value,
            value: flags.value,
            is_correct: true,
            score: flags.score,
            flag_type: flags.type
          })
          .select()
          .single();
        
        if (error) {
          console.log(`     ❌ Error: ${error.message}`);
        } else {
          console.log(`     ✅ Flag submitted successfully`);
          console.log(`     ✅ Correct: ${newSubmission.is_correct}, Score: ${newSubmission.score}`);
          
          // Update submission total score
          const { error: updateError } = await supabase
            .from('submissions')
            .update({ 
              current_score: flags.score,
              total_score: flags.score 
            })
            .eq('id', testSubmission.id);
          
          if (updateError) {
            console.log(`     ❌ Error updating submission score: ${updateError.message}`);
          } else {
            console.log(`     ✅ Submission score updated to: ${flags.score}`);
          }
        }
      }
    }
    
    console.log('');
    console.log('🎯 Flag fixing complete!');
    console.log('   Now the Start Fresh and scoring should work correctly.');
    console.log('   Try testing on: http://localhost:3001/assessments/' + assessmentId);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixFlagValues();
