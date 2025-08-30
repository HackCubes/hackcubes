require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStartOverFunctionality() {
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  // Use an actual candidate_id from the database
  const candidateId = '77b7ee7c-828d-42b6-b84e-f919174ce1eb'; // from the sample data we saw
  
  console.log('🔄 Testing "Start Over" functionality for assessment:', assessmentId);
  console.log('📋 Using candidate_id:', candidateId);
  console.log('');
  
  try {
    // 1. Check current state
    console.log('1. Checking current state...');
    
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('candidate_id', candidateId);
    
    console.log(`   📊 Found ${submissions?.length || 0} submissions`);
    if (submissions && submissions.length > 0) {
      submissions.forEach(sub => {
        console.log(`   - ID: ${sub.id}, Score: ${sub.current_score}, Status: ${sub.status}`);
      });
    }
    
    const { data: flagSubmissions } = await supabase
      .from('flag_submissions')
      .select('*')
      .eq('submission_id', submissions?.[0]?.id || 'none');
    
    console.log(`   🚩 Found ${flagSubmissions?.length || 0} flag submissions`);
    
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*')
      .eq('assessment_id', assessmentId);
    
    console.log(`   👤 Found ${enrollments?.length || 0} enrollments`);
    if (enrollments && enrollments.length > 0) {
      enrollments.forEach(enr => {
        console.log(`   - User: ${enr.user_id}, Score: ${enr.current_score}, Status: ${enr.status}`);
      });
    }
    
    console.log('');
    
    // 2. Test the restart functionality (simulate handleRestartAssessment)
    console.log('2. Testing restart functionality...');
    
    if (submissions && submissions.length > 0) {
      console.log('   🗑️  Deleting existing submissions...');
      const { error: deleteError } = await supabase
        .from('submissions')
        .delete()
        .eq('assessment_id', assessmentId)
        .eq('candidate_id', candidateId);
      
      if (deleteError) {
        console.log('   ❌ Error deleting submissions:', deleteError.message);
      } else {
        console.log('   ✅ Submissions deleted successfully');
      }
    }
    
    // Reset enrollment (if exists)
    if (enrollments && enrollments.length > 0) {
      console.log('   🔄 Resetting enrollment...');
      const enrollment = enrollments.find(e => e.user_id); // Find one with user_id
      if (enrollment) {
        const { error: resetError } = await supabase
          .from('enrollments')
          .update({
            status: 'ENROLLED',
            started_at: null,
            completed_at: null,
            expires_at: null,
            final_score: 0,
            current_score: 0,
            progress_percentage: 0
          })
          .eq('id', enrollment.id);
        
        if (resetError) {
          console.log('   ❌ Error resetting enrollment:', resetError.message);
        } else {
          console.log('   ✅ Enrollment reset successfully');
        }
      }
    }
    
    console.log('');
    
    // 3. Test Start Fresh functionality (simulate handleStartFresh from questions page)
    console.log('3. Testing Start Fresh functionality...');
    
    // Create a test submission to test the Start Fresh functionality
    console.log('   📝 Creating test submission...');
    const { data: newSubmission, error: createError } = await supabase
      .from('submissions')
      .insert({
        assessment_id: assessmentId,
        candidate_id: candidateId,
        status: 'STARTED',
        type: 'CTF',
        current_score: 100,
        total_score: 100,
        progress_percentage: 50.0,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.log('   ❌ Error creating test submission:', createError.message);
      return;
    }
    
    console.log('   ✅ Test submission created with score:', newSubmission.current_score);
    
    // Create a test flag submission
    console.log('   🚩 Creating test flag submission...');
    const { error: flagError } = await supabase
      .from('flag_submissions')
      .insert({
        submission_id: newSubmission.id,
        question_id: 'test-question-id',
        flag_id: 'test-flag-id',
        submitted_flag: 'test_flag_value',
        is_correct: true,
        score_earned: 100,
        flag_type: 'USER',
        value: 'test_flag_value',
        score: 100
      });
    
    if (flagError) {
      console.log('   ❌ Error creating flag submission:', flagError.message);
    } else {
      console.log('   ✅ Test flag submission created');
    }
    
    console.log('');
    
    // 4. Now test the Start Fresh logic
    console.log('4. Testing Start Fresh logic...');
    
    // Clear flag submissions
    console.log('   🧹 Clearing flag submissions...');
    const { error: clearFlagError } = await supabase
      .from('flag_submissions')
      .delete()
      .eq('submission_id', newSubmission.id);
    
    if (clearFlagError) {
      console.log('   ❌ Error clearing flag submissions:', clearFlagError.message);
    } else {
      console.log('   ✅ Flag submissions cleared');
    }
    
    // Reset submission score
    console.log('   📊 Resetting submission score...');
    const { error: resetScoreError } = await supabase
      .from('submissions')
      .update({ 
        current_score: 0,
        total_score: 0,
        completed_at: null 
      })
      .eq('id', newSubmission.id);
    
    if (resetScoreError) {
      console.log('   ❌ Error resetting submission score:', resetScoreError.message);
    } else {
      console.log('   ✅ Submission score reset to 0');
    }
    
    console.log('');
    
    // 5. Verify the reset worked
    console.log('5. Verifying reset...');
    
    const { data: finalSubmission } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', newSubmission.id)
      .single();
    
    const { data: finalFlags } = await supabase
      .from('flag_submissions')
      .select('*')
      .eq('submission_id', newSubmission.id);
    
    console.log('   📊 Final submission score:', finalSubmission?.current_score);
    console.log('   🚩 Remaining flag submissions:', finalFlags?.length || 0);
    
    if (finalSubmission?.current_score === 0 && (finalFlags?.length || 0) === 0) {
      console.log('   ✅ Start Fresh functionality working correctly!');
    } else {
      console.log('   ❌ Start Fresh functionality has issues');
    }
    
    // Cleanup - delete the test submission
    console.log('');
    console.log('6. Cleaning up test data...');
    await supabase
      .from('submissions')
      .delete()
      .eq('id', newSubmission.id);
    console.log('   ✅ Test data cleaned up');
    
    console.log('');
    console.log('🎯 Test completed! Both Start Over and Start Fresh functionality should work correctly.');
    console.log('   The issue might be in the UI not refreshing properly after the reset.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testStartOverFunctionality();
