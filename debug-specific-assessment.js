require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSpecificAssessment() {
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  console.log('🔍 Debugging assessment:', assessmentId);
  console.log('🌐 This should be the one you\'re testing on localhost:3001');
  console.log('');
  
  try {
    // 1. First, let's see what current submissions exist
    console.log('1. Current submissions for this assessment:');
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId);
    
    console.log(`   Found ${submissions?.length || 0} submissions:`);
    if (submissions && submissions.length > 0) {
      submissions.forEach(sub => {
        console.log(`   - ID: ${sub.id}`);
        console.log(`     Candidate: ${sub.candidate_id}`);
        console.log(`     Score: ${sub.current_score}/${sub.total_score}`);
        console.log(`     Status: ${sub.status}`);
        console.log(`     Started: ${sub.started_at}`);
        console.log(`     Progress: ${sub.progress_percentage}%`);
        console.log('');
      });
    }
    
    // 2. Check flag submissions for each submission
    console.log('2. Flag submissions:');
    for (const submission of submissions || []) {
      const { data: flagSubs } = await supabase
        .from('flag_submissions')
        .select('*')
        .eq('submission_id', submission.id);
      
      console.log(`   Submission ${submission.id}: ${flagSubs?.length || 0} flag submissions`);
      if (flagSubs && flagSubs.length > 0) {
        flagSubs.forEach(flag => {
          console.log(`     - Flag: ${flag.flag_type} | Correct: ${flag.is_correct} | Score: ${flag.score}`);
          console.log(`       Submitted: ${flag.submitted_flag}`);
          console.log(`       Expected: ${flag.value}`);
        });
      }
      console.log('');
    }
    
    // 3. Check enrollments
    console.log('3. Enrollments for this assessment:');
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*')
      .eq('assessment_id', assessmentId);
    
    console.log(`   Found ${enrollments?.length || 0} enrollments:`);
    if (enrollments && enrollments.length > 0) {
      enrollments.forEach(enr => {
        console.log(`   - User: ${enr.user_id}`);
        console.log(`     Score: ${enr.current_score}/${enr.max_possible_score}`);
        console.log(`     Status: ${enr.status}`);
        console.log(`     Progress: ${enr.progress_percentage}%`);
        console.log('');
      });
    }
    
    // 4. Test the Start Fresh functionality for one of the users
    console.log('4. Testing Start Fresh functionality...');
    
    if (submissions && submissions.length > 0) {
      const testSubmission = submissions[0];
      console.log(`   Using submission: ${testSubmission.id}`);
      
      // Store original score for comparison
      const originalScore = testSubmission.current_score;
      console.log(`   Original score: ${originalScore}`);
      
      // Clear flag submissions
      console.log('   Clearing flag submissions...');
      const { error: clearError } = await supabase
        .from('flag_submissions')
        .delete()
        .eq('submission_id', testSubmission.id);
      
      if (clearError) {
        console.log(`   ❌ Error clearing flags: ${clearError.message}`);
      } else {
        console.log('   ✅ Flag submissions cleared');
      }
      
      // Reset submission score
      console.log('   Resetting submission score...');
      const { error: resetError } = await supabase
        .from('submissions')
        .update({ 
          current_score: 0,
          total_score: 0,
          completed_at: null 
        })
        .eq('id', testSubmission.id);
      
      if (resetError) {
        console.log(`   ❌ Error resetting score: ${resetError.message}`);
      } else {
        console.log('   ✅ Submission score reset to 0');
      }
      
      // Also reset enrollment if exists
      const enrollment = enrollments?.find(e => e.user_id === testSubmission.candidate_id);
      if (enrollment) {
        console.log('   Resetting enrollment score...');
        const { error: enrollError } = await supabase
          .from('enrollments')
          .update({ current_score: 0 })
          .eq('id', enrollment.id);
        
        if (enrollError) {
          console.log(`   ❌ Error resetting enrollment: ${enrollError.message}`);
        } else {
          console.log('   ✅ Enrollment score reset to 0');
        }
      }
      
      // Verify the reset
      const { data: verifySubmission } = await supabase
        .from('submissions')
        .select('current_score, total_score')
        .eq('id', testSubmission.id)
        .single();
      
      const { data: verifyFlags } = await supabase
        .from('flag_submissions')
        .select('*')
        .eq('submission_id', testSubmission.id);
      
      console.log('   📊 Verification:');
      console.log(`     Submission score: ${verifySubmission?.current_score}`);
      console.log(`     Flag submissions remaining: ${verifyFlags?.length || 0}`);
      
      if (verifySubmission?.current_score === 0 && (verifyFlags?.length || 0) === 0) {
        console.log('   ✅ Start Fresh test PASSED');
      } else {
        console.log('   ❌ Start Fresh test FAILED');
      }
    }
    
    console.log('');
    console.log('🎯 Debug complete!');
    console.log('   Now go to: http://localhost:3001/assessments/' + assessmentId);
    console.log('   Try clicking "Start Fresh" and submitting some flags to test scoring.');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

debugSpecificAssessment();
