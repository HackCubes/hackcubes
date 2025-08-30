require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSectionsAndQuestions() {
  console.log('🔍 Checking sections and questions for assessment...\n');
  
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  
  try {
    // Check sections for this assessment
    console.log('1. Sections for assessment:');
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('order_index');
    
    if (sectionsError) {
      console.error('Sections error:', sectionsError);
    } else {
      console.log('Sections:', sections);
      
      if (sections && sections.length > 0) {
        // Get questions for these sections
        console.log('\n2. Questions for sections:');
        const sectionIds = sections.map(s => s.id);
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .in('section_id', sectionIds)
          .order('order_index');
        
        if (questionsError) {
          console.error('Questions error:', questionsError);
        } else {
          console.log('Questions:', questions);
          
          if (questions && questions.length > 0) {
            // Get flags for these questions
            console.log('\n3. Flags for questions:');
            const questionIds = questions.map(q => q.id);
            const { data: flags, error: flagsError } = await supabase
              .from('flags')
              .select('*')
              .in('question_id', questionIds);
            
            if (flagsError) {
              console.error('Flags error:', flagsError);
            } else {
              console.log('Flags:', flags);
              
              // Now test a submission if we have flags
              if (flags && flags.length > 0) {
                console.log('\n4. Testing flag submission to flag_submissions table:');
                const testFlag = flags[0];
                
                // Clear any existing submissions first
                await supabase
                  .from('flag_submissions')
                  .delete()
                  .eq('question_id', testFlag.question_id)
                  .eq('flag_id', testFlag.id)
                  .eq('candidate_id', '77b7ee7c-828d-42b6-b84e-f919174ce1eb');
                
                console.log('Testing with flag:', testFlag);
                console.log('Submitting correct value:', testFlag.value);
                
                const { data: submission, error: submissionError } = await supabase
                  .from('flag_submissions')
                  .insert({
                    question_id: testFlag.question_id,
                    flag_id: testFlag.id,
                    submitted_value: testFlag.value,
                    candidate_id: '77b7ee7c-828d-42b6-b84e-f919174ce1eb'
                  })
                  .select()
                  .single();
                
                if (submissionError) {
                  console.error('Submission error:', submissionError);
                } else {
                  console.log('✅ Submission successful:', submission);
                  console.log('Is correct:', submission.is_correct);
                  console.log('Score:', submission.score);
                  
                  if (!submission.is_correct) {
                    console.log('🚨 BUG FOUND: Correct flag submitted but marked as incorrect!');
                    console.log('Expected:', testFlag.value);
                    console.log('Submitted:', submission.submitted_value);
                    console.log('Case sensitive:', testFlag.is_case_sensitive);
                  }
                }
              }
            }
          }
        }
      } else {
        console.log('❌ No sections found for this assessment');
        console.log('This explains why no questions are loading!');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSectionsAndQuestions();
