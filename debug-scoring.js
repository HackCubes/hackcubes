require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugScoringIssue() {
  console.log('🔍 Debugging scoring and results page issues...\n');
  
  const candidateId = '77b7ee7c-828d-42b6-b84e-f919174ce1eb';
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  
  try {
    // 1. Check current submissions
    console.log('1. Checking current submissions:');
    const { data: submissionsData } = await supabase
      .from('submissions')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('assessment_id', assessmentId);
    
    console.log('Submissions:', submissionsData);
    
    // 2. Check enrollments (legacy table)
    console.log('\n2. Checking enrollments (legacy):');
    const { data: enrollmentsData } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);
    
    console.log('Enrollments:', enrollmentsData);
    
    // 3. Check flag submissions for this candidate
    console.log('\n3. Checking flag submissions:');
    const { data: flagSubmissions } = await supabase
      .from('flag_submissions')
      .select('*')
      .eq('submission_id', submissionsData?.[0]?.id);
    
    console.log('Flag submissions:', flagSubmissions);
    
    // 4. Calculate expected total score
    console.log('\n4. Calculating expected score:');
    let totalScore = 0;
    if (flagSubmissions) {
      for (const submission of flagSubmissions) {
        if (submission.is_correct) {
          totalScore += submission.score || 0;
        }
      }
    }
    console.log('Expected total score:', totalScore);
    console.log('Current submission score:', submissionsData?.[0]?.current_score);
    console.log('Current enrollment score:', enrollmentsData?.[0]?.current_score);
    
    // 5. Update the submission score if it's wrong
    if (submissionsData?.[0] && submissionsData[0].current_score !== totalScore) {
      console.log('\n5. Fixing submission score...');
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('submissions')
        .update({ 
          current_score: totalScore,
          total_score: totalScore 
        })
        .eq('id', submissionsData[0].id)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Update failed:', updateError.message);
      } else {
        console.log('✅ Submission score updated:', updatedSubmission);
      }
    }
    
    // 6. Check what the results page would show
    console.log('\n6. Checking results page data:');
    // This is typically what the results page queries
    const { data: resultsData } = await supabase
      .from('flag_submissions')
      .select(`
        *,
        flags!inner(value, score, type),
        questions!inner(name, score)
      `)
      .eq('submission_id', submissionsData?.[0]?.id);
    
    console.log('Results page data:', resultsData);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugScoringIssue();
