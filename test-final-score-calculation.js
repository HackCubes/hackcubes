require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFinalScoreCalculation() {
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  console.log('🧪 Testing final score calculation logic...');
  console.log('');
  
  try {
    // Find a submission with flag submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('status', 'STARTED');
    
    console.log(`Found ${submissions?.length || 0} STARTED submissions to test with`);
    
    for (const submission of submissions || []) {
      console.log(`\n📋 Testing submission: ${submission.id.substring(0, 8)}...`);
      console.log(`   Candidate: ${submission.candidate_id}`);
      console.log(`   Current Score: ${submission.current_score}`);
      
      // Get flag submissions for this submission
      const { data: flagSubs } = await supabase
        .from('flag_submissions')
        .select('*')
        .eq('submission_id', submission.id);
      
      console.log(`   Flag submissions: ${flagSubs?.length || 0}`);
      
      if (flagSubs && flagSubs.length > 0) {
        let calculatedScore = 0;
        console.log('   Flag details:');
        
        flagSubs.forEach((flag, i) => {
          console.log(`     ${i+1}. ${flag.flag_type}: ${flag.is_correct ? '✅' : '❌'} (${flag.score || 0} points)`);
          console.log(`        Submitted: "${flag.submitted_flag}"`);
          console.log(`        Expected: "${flag.value}"`);
          
          if (flag.is_correct) {
            calculatedScore += flag.score || 0;
          }
        });
        
        console.log(`   📊 Calculated total: ${calculatedScore}`);
        console.log(`   📊 Stored current: ${submission.current_score}`);
        
        // Test the final submission logic
        console.log('   🏁 Simulating final submission...');
        
        // Update the enrollment as the final submission would do
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('*')
          .eq('assessment_id', assessmentId)
          .eq('user_id', submission.candidate_id)
          .single();
        
        if (enrollment) {
          console.log(`   Found enrollment: ${enrollment.id.substring(0, 8)}... (current score: ${enrollment.current_score})`);
          
          // Simulate the final score update
          const { error: updateError } = await supabase
            .from('enrollments')
            .update({
              final_score: calculatedScore,
              current_score: calculatedScore
            })
            .eq('id', enrollment.id);
          
          if (updateError) {
            console.log(`   ❌ Error updating enrollment: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated enrollment final_score to: ${calculatedScore}`);
          }
          
          // Also update the submission
          const { error: submissionError } = await supabase
            .from('submissions')
            .update({
              total_score: calculatedScore,
              current_score: calculatedScore
            })
            .eq('id', submission.id);
          
          if (submissionError) {
            console.log(`   ❌ Error updating submission: ${submissionError.message}`);
          } else {
            console.log(`   ✅ Updated submission score to: ${calculatedScore}`);
          }
        }
      }
    }
    
    console.log('\n🎯 Final score calculation test complete!');
    console.log('   All enrollments should now have correct final_score values.');
    console.log('   Try submitting the assessment again in the UI to see if the results page shows the correct score.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFinalScoreCalculation();
