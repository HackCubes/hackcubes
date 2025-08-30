require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteResultsFlow() {
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  console.log('🔄 Testing complete results flow...');
  console.log('');
  
  try {
    // 1. Find a submission that has flag submissions
    console.log('1. Finding a test submission...');
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .neq('status', 'COMPLETED'); // Use one that's not completed yet
    
    let testSubmission = submissions?.find(s => s.current_score > 0);
    if (!testSubmission) {
      testSubmission = submissions?.[0];
    }
    
    if (!testSubmission) {
      console.log('❌ No test submission found');
      return;
    }
    
    console.log(`   Using submission: ${testSubmission.id.substring(0, 8)}...`);
    console.log(`   Candidate: ${testSubmission.candidate_id}`);
    console.log(`   Current score: ${testSubmission.current_score}`);
    
    // 2. Check what flag submissions exist
    const { data: flagSubs } = await supabase
      .from('flag_submissions')
      .select('*')
      .eq('submission_id', testSubmission.id);
    
    console.log(`   Flag submissions: ${flagSubs?.length || 0}`);
    
    let calculatedScore = 0;
    if (flagSubs && flagSubs.length > 0) {
      flagSubs.forEach(flag => {
        if (flag.is_correct) {
          calculatedScore += flag.score || 0;
        }
        console.log(`     - ${flag.flag_type}: ${flag.is_correct ? '✅' : '❌'} (${flag.score || 0} points)`);
      });
    }
    
    console.log(`   Calculated total score: ${calculatedScore}`);
    
    // 3. Simulate the assessment submission process
    console.log('\n2. Simulating assessment submission...');
    
    // Update submission to COMPLETED
    const { error: submissionError } = await supabase
      .from('submissions')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        total_score: calculatedScore,
        current_score: calculatedScore
      })
      .eq('id', testSubmission.id);
    
    if (submissionError) {
      console.log(`   ❌ Error updating submission: ${submissionError.message}`);
      return;
    }
    
    console.log('   ✅ Submission marked as COMPLETED');
    
    // Update enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        final_score: calculatedScore,
        current_score: calculatedScore
      })
      .eq('assessment_id', assessmentId)
      .eq('user_id', testSubmission.candidate_id)
      .select()
      .single();
    
    if (enrollmentError) {
      console.log(`   ❌ Error updating enrollment: ${enrollmentError.message}`);
    } else {
      console.log('   ✅ Enrollment updated with final_score:', enrollment.final_score);
    }
    
    // 4. Test the results page data fetching logic
    console.log('\n3. Testing results page data fetching...');
    
    // Simulate what the results page does
    const { data: resultsEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', testSubmission.candidate_id)
      .eq('assessment_id', assessmentId)
      .single();
    
    console.log(`   Enrollment final_score: ${resultsEnrollment?.final_score}`);
    
    // Try legacy submissions first
    let fetchedSubmissions = [];
    if (resultsEnrollment?.id) {
      const { data: subsData } = await supabase
        .from('user_flag_submissions')
        .select('*')
        .eq('enrollment_id', resultsEnrollment.id);
      fetchedSubmissions = subsData || [];
    }
    
    console.log(`   Legacy submissions found: ${fetchedSubmissions.length}`);
    
    // If no legacy submissions, try modern flow
    if (fetchedSubmissions.length === 0) {
      const { data: submissionData } = await supabase
        .from('submissions')
        .select('id')
        .eq('assessment_id', assessmentId)
        .eq('candidate_id', testSubmission.candidate_id);
      
      if (submissionData && submissionData.length > 0) {
        const { data: flagSubs } = await supabase
          .from('flag_submissions')
          .select('*')
          .eq('submission_id', submissionData[0].id);
        
        // Convert to legacy format
        fetchedSubmissions = (flagSubs || []).map((fs) => ({
          id: fs.id,
          enrollment_id: resultsEnrollment?.id || 'modern',
          question_id: fs.question_id,
          flag_id: fs.flag_id,
          submitted_answer: fs.submitted_flag || fs.value || '',
          is_correct: fs.is_correct,
          points_awarded: fs.score || 0,
          submitted_at: fs.created_at || new Date().toISOString()
        }));
      }
    }
    
    console.log(`   Modern submissions found: ${fetchedSubmissions.length}`);
    
    // Calculate total points from submissions
    const totalPointsAwarded = fetchedSubmissions.reduce((sum, s) => sum + (s.points_awarded || 0), 0);
    console.log(`   Total points from submissions: ${totalPointsAwarded}`);
    
    // This is what the results page will display
    const displayedFinalScore = resultsEnrollment?.final_score ?? totalPointsAwarded;
    console.log(`   Final displayed score: ${displayedFinalScore}`);
    
    console.log('\n🎯 Results flow test completed!');
    console.log(`   The results page should now show: ${displayedFinalScore} points`);
    console.log('   Try accessing the results page in the browser to verify.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCompleteResultsFlow();
