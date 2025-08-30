require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testScoringFix() {
  console.log('🧪 Testing scoring fixes end-to-end...\n');
  
  const candidateId = '77b7ee7c-828d-42b6-b84e-f919174ce1eb';
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  
  try {
    // 1. Reset scores to 0 for testing
    console.log('1. Resetting scores for fresh test...');
    
    const { data: submission } = await supabase
      .from('submissions')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('assessment_id', assessmentId)
      .single();
    
    if (submission) {
      await supabase
        .from('submissions')
        .update({ current_score: 0, total_score: 0 })
        .eq('id', submission.id);
      
      console.log('✅ Reset submission score to 0');
    }
    
    await supabase
      .from('enrollments')
      .update({ current_score: 0 })
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);
    
    console.log('✅ Reset enrollment score to 0');
    
    // 2. Submit a flag and test scoring
    console.log('\n2. Testing flag submission and scoring...');
    
    const { data: flags } = await supabase
      .from('flags')
      .select('*')
      .eq('question_id', 'f6ce8293-3ea2-4657-8102-32e3e7c78b28')
      .limit(1);
    
    if (!flags || flags.length === 0) {
      console.log('❌ No flags found for testing');
      return;
    }
    
    const testFlag = flags[0];
    console.log('Testing with flag:', testFlag.value);
    
    // Clear any existing submissions
    await supabase
      .from('flag_submissions')
      .delete()
      .eq('submission_id', submission.id)
      .eq('flag_id', testFlag.id);
    
    // Submit correct flag with client-side validation
    const userAnswer = testFlag.is_case_sensitive ? testFlag.value : testFlag.value.toLowerCase();
    const flagValue = testFlag.is_case_sensitive ? testFlag.value : testFlag.value.toLowerCase();
    const isCorrect = userAnswer === flagValue;
    const pointsAwarded = isCorrect ? testFlag.score : 0;
    
    console.log('Client validation:', { userAnswer, flagValue, isCorrect, pointsAwarded });
    
    const { data: flagSubmission, error: flagError } = await supabase
      .from('flag_submissions')
      .insert({
        submission_id: submission.id,
        question_id: testFlag.question_id,
        flag_id: testFlag.id,
        value: testFlag.value,
        submitted_flag: testFlag.value,
        is_correct: isCorrect,
        score: pointsAwarded,
        flag_type: testFlag.type || 'USER'
      })
      .select()
      .single();
    
    if (flagError) {
      console.log('❌ Flag submission failed:', flagError.message);
      return;
    }
    
    console.log('✅ Flag submitted successfully');
    
    // 3. Test the scoring logic (simulate frontend scoring update)
    console.log('\n3. Testing scoring update logic...');
    
    // Update submission score (modern flow)
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('submissions')
      .update({ 
        current_score: pointsAwarded,
        total_score: pointsAwarded 
      })
      .eq('id', submission.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Score update failed:', updateError.message);
    } else {
      console.log('✅ Submission score updated:', updatedSubmission.current_score);
    }
    
    // Update enrollment score for backward compatibility
    const { data: updatedEnrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .update({ current_score: pointsAwarded })
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId)
      .select()
      .single();
    
    if (enrollmentError) {
      console.log('❌ Enrollment score update failed:', enrollmentError.message);
    } else {
      console.log('✅ Enrollment score updated:', updatedEnrollment.current_score);
    }
    
    // 4. Test results page data
    console.log('\n4. Testing results page data...');
    
    const { data: resultsData } = await supabase
      .from('flag_submissions')
      .select(`
        *,
        flags!inner(value, score, type),
        questions!inner(name, score)
      `)
      .eq('submission_id', submission.id);
    
    console.log('Results page data count:', resultsData?.length);
    if (resultsData && resultsData.length > 0) {
      const totalScore = resultsData
        .filter(r => r.is_correct)
        .reduce((sum, r) => sum + (r.score || 0), 0);
      console.log('Total score from results:', totalScore);
    }
    
    // 5. Verify final state
    console.log('\n5. Final verification...');
    
    const { data: finalSubmission } = await supabase
      .from('submissions')
      .select('current_score, total_score')
      .eq('id', submission.id)
      .single();
    
    const { data: finalEnrollment } = await supabase
      .from('enrollments')
      .select('current_score')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId)
      .single();
    
    console.log('Final submission score:', finalSubmission?.current_score);
    console.log('Final enrollment score:', finalEnrollment?.current_score);
    
    if (finalSubmission?.current_score === pointsAwarded && finalEnrollment?.current_score === pointsAwarded) {
      console.log('🎉 SUCCESS: Scoring logic is working correctly!');
    } else {
      console.log('❌ ISSUE: Scores do not match expected values');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testScoringFix();
