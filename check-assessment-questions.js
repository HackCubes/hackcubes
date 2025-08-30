require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAssessmentQuestions() {
  console.log('🔍 Checking assessment-question relationships...\n');
  
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  
  try {
    // Check assessment_questions table
    console.log('1. Assessment questions:');
    const { data: assessmentQuestions } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('assessment_id', assessmentId);
    console.log('Assessment questions:', assessmentQuestions);
    
    if (assessmentQuestions && assessmentQuestions.length > 0) {
      // Get the first question and its flags
      const firstQuestion = assessmentQuestions[0];
      console.log('\n2. First question details:');
      const { data: questionDetails } = await supabase
        .from('questions')
        .select('*')
        .eq('id', firstQuestion.question_id)
        .single();
      console.log('Question:', questionDetails);
      
      console.log('\n3. Flags for first question:');
      const { data: flags } = await supabase
        .from('flags')
        .select('*')
        .eq('question_id', firstQuestion.question_id);
      console.log('Flags:', flags);
      
      if (flags && flags.length > 0) {
        // Test submission with correct flag
        console.log('\n4. Testing flag submission:');
        const testFlag = flags[0];
        console.log('Testing with flag:', testFlag);
        
        // First, clear any existing submissions
        await supabase
          .from('flag_submissions')
          .delete()
          .eq('question_id', firstQuestion.question_id)
          .eq('candidate_id', '77b7ee7c-828d-42b6-b84e-f919174ce1eb');
        
        // Submit correct answer
        const { data: submission, error: submissionError } = await supabase
          .from('flag_submissions')
          .insert({
            question_id: firstQuestion.question_id,
            flag_id: testFlag.id,
            submitted_value: testFlag.value, // Submit correct answer
            candidate_id: '77b7ee7c-828d-42b6-b84e-f919174ce1eb'
          })
          .select()
          .single();
        
        if (submissionError) {
          console.error('Submission error:', submissionError);
        } else {
          console.log('Submission result:', submission);
          console.log('Is correct:', submission.is_correct);
          console.log('Score:', submission.score);
        }
        
        // Also test with wrong answer
        console.log('\n5. Testing with wrong answer:');
        const { data: wrongSubmission, error: wrongError } = await supabase
          .from('flag_submissions')
          .insert({
            question_id: firstQuestion.question_id,
            flag_id: testFlag.id,
            submitted_value: 'wrong_answer',
            candidate_id: '77b7ee7c-828d-42b6-b84e-f919174ce1eb'
          })
          .select()
          .single();
        
        if (wrongError) {
          console.error('Wrong submission error:', wrongError);
        } else {
          console.log('Wrong submission result:', wrongSubmission);
          console.log('Is correct:', wrongSubmission.is_correct);
          console.log('Score:', wrongSubmission.score);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAssessmentQuestions();
