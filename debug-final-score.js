require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentSubmissionState() {
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  console.log('🔍 Checking current submission state after flag submissions...');
  console.log('');
  
  try {
    // 1. Check all submissions for this assessment
    console.log('1. Current submissions:');
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false });
    
    console.log(`   Found ${submissions?.length || 0} submissions:`);
    submissions?.forEach((sub, i) => {
      console.log(`   ${i+1}. ID: ${sub.id.substring(0, 8)}...`);
      console.log(`      Candidate: ${sub.candidate_id}`);
      console.log(`      Status: ${sub.status}`);
      console.log(`      Current Score: ${sub.current_score}`);
      console.log(`      Total Score: ${sub.total_score}`);
      console.log(`      Started: ${sub.started_at}`);
      console.log(`      Completed: ${sub.completed_at}`);
      console.log('');
    });
    
    // 2. Check flag submissions for each submission
    console.log('2. Flag submissions by submission:');
    for (const submission of submissions || []) {
      const { data: flagSubs } = await supabase
        .from('flag_submissions')
        .select('*')
        .eq('submission_id', submission.id)
        .order('created_at', { ascending: false });
      
      console.log(`   Submission ${submission.id.substring(0, 8)}... (${submission.status}):`);
      console.log(`   Current/Total Score: ${submission.current_score}/${submission.total_score}`);
      console.log(`   Flag submissions: ${flagSubs?.length || 0}`);
      
      if (flagSubs && flagSubs.length > 0) {
        let totalCalculatedScore = 0;
        flagSubs.forEach((flag, i) => {
          console.log(`     ${i+1}. ${flag.flag_type} flag: ${flag.is_correct ? '✅' : '❌'} (${flag.score} points)`);
          console.log(`        Submitted: "${flag.submitted_flag}"`);
          console.log(`        Expected: "${flag.value}"`);
          console.log(`        Question: ${flag.question_id}`);
          if (flag.is_correct) {
            totalCalculatedScore += flag.score || 0;
          }
        });
        console.log(`     📊 Calculated total from flags: ${totalCalculatedScore}`);
        console.log(`     📊 Stored total in submission: ${submission.current_score}`);
        
        if (totalCalculatedScore !== submission.current_score) {
          console.log(`     ⚠️  MISMATCH: Calculated (${totalCalculatedScore}) != Stored (${submission.current_score})`);
        }
      }
      console.log('');
    }
    
    // 3. Check enrollments for this assessment
    console.log('3. Enrollments:');
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*')
      .eq('assessment_id', assessmentId);
    
    enrollments?.forEach(enr => {
      console.log(`   User: ${enr.user_id}`);
      console.log(`   Current Score: ${enr.current_score}`);
      console.log(`   Final Score: ${enr.final_score}`);
      console.log(`   Status: ${enr.status}`);
      console.log('');
    });
    
    // 4. Let's also check what the assessment submission logic should do
    console.log('4. Simulating assessment submission logic...');
    
    // Find a recent submission that should have flag submissions
    const recentSubmission = submissions?.find(s => s.status === 'STARTED' || s.status === 'COMPLETED');
    if (recentSubmission) {
      console.log(`   Using submission: ${recentSubmission.id}`);
      
      // Get flag submissions for this submission
      const { data: flagSubs } = await supabase
        .from('flag_submissions')
        .select('*')
        .eq('submission_id', recentSubmission.id);
      
      // Calculate total score from flag submissions
      let calculatedTotal = 0;
      let correctFlags = 0;
      
      flagSubs?.forEach(flag => {
        if (flag.is_correct) {
          calculatedTotal += flag.score || 0;
          correctFlags++;
        }
      });
      
      console.log(`   📊 Total flags: ${flagSubs?.length || 0}`);
      console.log(`   📊 Correct flags: ${correctFlags}`);
      console.log(`   📊 Calculated score: ${calculatedTotal}`);
      console.log(`   📊 Current stored score: ${recentSubmission.current_score}`);
      
      // Check if we need to update the submission score
      if (calculatedTotal !== recentSubmission.current_score) {
        console.log('   🔧 Updating submission score to match calculated total...');
        
        const { error: updateError } = await supabase
          .from('submissions')
          .update({
            current_score: calculatedTotal,
            total_score: calculatedTotal
          })
          .eq('id', recentSubmission.id);
        
        if (updateError) {
          console.log(`   ❌ Error updating: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated submission score to: ${calculatedTotal}`);
        }
      }
      
      // Also update enrollment if it exists
      const matchingEnrollment = enrollments?.find(e => 
        e.user_id === recentSubmission.candidate_id || 
        e.assessment_id === recentSubmission.assessment_id
      );
      
      if (matchingEnrollment && matchingEnrollment.current_score !== calculatedTotal) {
        console.log('   🔧 Updating enrollment score...');
        
        const { error: enrollError } = await supabase
          .from('enrollments')
          .update({
            current_score: calculatedTotal,
            final_score: calculatedTotal
          })
          .eq('id', matchingEnrollment.id);
        
        if (enrollError) {
          console.log(`   ❌ Error updating enrollment: ${enrollError.message}`);
        } else {
          console.log(`   ✅ Updated enrollment score to: ${calculatedTotal}`);
        }
      }
    }
    
    console.log('');
    console.log('🎯 Analysis complete!');
    console.log('   If there were score mismatches, they should now be fixed.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCurrentSubmissionState();
