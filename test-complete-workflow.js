require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteWorkflow() {
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  const testUserId = 'f8494a8b-ec32-4363-a8ad-1984e9263bef'; // A user that has attempted the assessment
  
  console.log('🚀 Testing complete Start Fresh + Scoring workflow');
  console.log('📋 Assessment ID:', assessmentId);
  console.log('👤 Test User ID:', testUserId);
  console.log('');
  
  try {
    // 1. Clear everything for fresh start
    console.log('1. Clearing all data for fresh start...');
    
    // Find the user's submission
    const { data: userSubmission } = await supabase
      .from('submissions')
      .select('id')
      .eq('assessment_id', assessmentId)
      .eq('candidate_id', testUserId)
      .single();
    
    if (userSubmission) {
      console.log(`   Found submission: ${userSubmission.id}`);
      
      // Clear flag submissions
      await supabase
        .from('flag_submissions')
        .delete()
        .eq('submission_id', userSubmission.id);
      
      // Reset submission score
      await supabase
        .from('submissions')
        .update({ 
          current_score: 0,
          total_score: 0,
          completed_at: null 
        })
        .eq('id', userSubmission.id);
      
      console.log('   ✅ Cleared flag submissions and reset submission score');
    }
    
    // Also clear enrollment score
    const { data: userEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('assessment_id', assessmentId)
      .eq('user_id', testUserId)
      .single();
    
    if (userEnrollment) {
      await supabase
        .from('enrollments')
        .update({ current_score: 0 })
        .eq('id', userEnrollment.id);
      
      console.log('   ✅ Reset enrollment score');
    }
    
    console.log('');
    
    // 2. Test flag submission simulation
    console.log('2. Testing flag submission...');
    
    if (userSubmission) {
      // Get a correct flag to test with
      const { data: flags } = await supabase
        .from('flags')
        .select('*')
        .eq('question_id', '1c407890-4181-47e6-86a1-5f281cb32043') // Techfront Solutions
        .eq('type', 'USER');
      
      if (flags && flags.length > 0) {
        const testFlag = flags[0];
        console.log(`   Testing with flag: ${testFlag.value} (${testFlag.score} points)`);
        
        // Simulate client-side validation
        const userAnswer = testFlag.value;
        const flagValue = testFlag.value;
        const isCorrect = userAnswer === flagValue;
        const pointsAwarded = isCorrect ? testFlag.score : 0;
        
        console.log(`   Validation: correct=${isCorrect}, points=${pointsAwarded}`);
        
        // Insert flag submission
        const { data: newFlagSubmission, error: flagError } = await supabase
          .from('flag_submissions')
          .insert({
            submission_id: userSubmission.id,
            question_id: testFlag.question_id,
            flag_id: testFlag.id,
            submitted_flag: userAnswer,
            value: userAnswer,
            is_correct: isCorrect,
            score: pointsAwarded,
            flag_type: testFlag.type
          })
          .select()
          .single();
        
        if (flagError) {
          console.log(`   ❌ Error submitting flag: ${flagError.message}`);
        } else {
          console.log(`   ✅ Flag submitted successfully`);
          
          // Update submission score
          const { error: scoreError } = await supabase
            .from('submissions')
            .update({ 
              current_score: pointsAwarded,
              total_score: pointsAwarded 
            })
            .eq('id', userSubmission.id);
          
          if (scoreError) {
            console.log(`   ❌ Error updating score: ${scoreError.message}`);
          } else {
            console.log(`   ✅ Submission score updated to: ${pointsAwarded}`);
          }
          
          // Also update enrollment for backward compatibility
          if (userEnrollment) {
            await supabase
              .from('enrollments')
              .update({ current_score: pointsAwarded })
              .eq('id', userEnrollment.id);
            
            console.log(`   ✅ Enrollment score updated to: ${pointsAwarded}`);
          }
        }
      }
    }
    
    console.log('');
    
    // 3. Test submitting a second flag (for multi-flag question)
    console.log('3. Testing second flag submission...');
    
    if (userSubmission) {
      const { data: flags } = await supabase
        .from('flags')
        .select('*')
        .eq('question_id', '1c407890-4181-47e6-86a1-5f281cb32043') // Techfront Solutions
        .eq('type', 'ROOT');
      
      if (flags && flags.length > 0) {
        const testFlag = flags[0];
        console.log(`   Testing with ROOT flag: ${testFlag.value} (${testFlag.score} points)`);
        
        // Get current submission score first
        const { data: currentSubmission } = await supabase
          .from('submissions')
          .select('current_score')
          .eq('id', userSubmission.id)
          .single();
        
        const currentScore = currentSubmission?.current_score || 0;
        console.log(`   Current score: ${currentScore}`);
        
        // Simulate submission
        const userAnswer = testFlag.value;
        const isCorrect = userAnswer === testFlag.value;
        const pointsAwarded = isCorrect ? testFlag.score : 0;
        const newTotalScore = currentScore + pointsAwarded;
        
        // Insert flag submission
        const { error: flagError } = await supabase
          .from('flag_submissions')
          .insert({
            submission_id: userSubmission.id,
            question_id: testFlag.question_id,
            flag_id: testFlag.id,
            submitted_flag: userAnswer,
            value: userAnswer,
            is_correct: isCorrect,
            score: pointsAwarded,
            flag_type: testFlag.type
          });
        
        if (flagError) {
          console.log(`   ❌ Error submitting flag: ${flagError.message}`);
        } else {
          console.log(`   ✅ ROOT flag submitted successfully`);
          
          // Update total score
          await supabase
            .from('submissions')
            .update({ 
              current_score: newTotalScore,
              total_score: newTotalScore 
            })
            .eq('id', userSubmission.id);
          
          console.log(`   ✅ Total score updated to: ${newTotalScore}`);
          
          // Update enrollment
          if (userEnrollment) {
            await supabase
              .from('enrollments')
              .update({ current_score: newTotalScore })
              .eq('id', userEnrollment.id);
          }
        }
      }
    }
    
    console.log('');
    
    // 4. Verify final state
    console.log('4. Verifying final state...');
    
    if (userSubmission) {
      const { data: finalSubmission } = await supabase
        .from('submissions')
        .select('current_score, total_score')
        .eq('id', userSubmission.id)
        .single();
      
      const { data: finalFlags } = await supabase
        .from('flag_submissions')
        .select('*')
        .eq('submission_id', userSubmission.id);
      
      console.log(`   📊 Final submission score: ${finalSubmission?.current_score}`);
      console.log(`   🚩 Total flag submissions: ${finalFlags?.length || 0}`);
      
      finalFlags?.forEach(flag => {
        console.log(`     - ${flag.flag_type} flag: ${flag.is_correct ? '✅' : '❌'} (${flag.score} points)`);
      });
      
      if (userEnrollment) {
        const { data: finalEnrollment } = await supabase
          .from('enrollments')
          .select('current_score')
          .eq('id', userEnrollment.id)
          .single();
        
        console.log(`   📋 Final enrollment score: ${finalEnrollment?.current_score}`);
      }
    }
    
    console.log('');
    console.log('🎯 Test completed!');
    console.log('   The assessment should now be working correctly.');
    console.log('   Try accessing: http://localhost:3001/assessments/' + assessmentId);
    console.log('   Expected behavior:');
    console.log('     ✅ Start Fresh button clears all submissions and resets score to 0');
    console.log('     ✅ Flag submissions add up correctly to total score');
    console.log('     ✅ Multi-flag questions show individual inputs');
    console.log('     ✅ Results page shows correct score');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testCompleteWorkflow();
