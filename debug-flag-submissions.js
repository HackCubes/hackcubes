require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugFlagSubmissions() {
  console.log('🔍 Debugging flag submissions...\n');
  
  const questionId = '533d4e96-fe35-4540-9798-162b3f261572';
  
  try {
    // Check flags for this question
    console.log('1. Checking flags for question:', questionId);
    const { data: flags, error: flagsError } = await supabase
      .from('flags')
      .select('*')
      .eq('question_id', questionId);
    
    if (flagsError) {
      console.error('Error fetching flags:', flagsError);
    } else {
      console.log('Flags found:', flags);
    }
    
    // Check flag_submissions table structure
    console.log('\n2. Checking flag_submissions table structure:');
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT column_name, data_type, is_nullable, column_default 
              FROM information_schema.columns 
              WHERE table_name = 'flag_submissions' 
              ORDER BY ordinal_position;`
      });
    
    if (columnsError) {
      console.error('Error checking table structure:', columnsError);
    } else {
      console.log('Table structure:', columns);
    }
    
    // Check existing flag submissions
    console.log('\n3. Checking existing flag submissions:');
    const { data: submissions, error: submissionsError } = await supabase
      .from('flag_submissions')
      .select('*')
      .eq('question_id', questionId);
    
    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
    } else {
      console.log('Existing submissions:', submissions);
    }
    
    // Check if the trigger function exists
    console.log('\n4. Checking if validation trigger exists:');
    const { data: triggerCheck, error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT tgname, tgtype, tgenabled 
              FROM pg_trigger 
              WHERE tgname = 'validate_flag_submission_trigger';`
      });
    
    if (triggerError) {
      console.error('Error checking trigger:', triggerError);
    } else {
      console.log('Trigger info:', triggerCheck);
    }
    
    // Test a flag submission manually
    if (flags && flags.length > 0) {
      console.log('\n5. Testing flag submission manually:');
      const testFlag = flags[0];
      console.log('Testing with flag:', testFlag);
      
      // Try to submit the correct answer
      const { data: testSubmission, error: testError } = await supabase
        .from('flag_submissions')
        .insert({
          question_id: questionId,
          flag_id: testFlag.id,
          submitted_value: testFlag.value,
          candidate_id: '77b7ee7c-828d-42b6-b84e-f919174ce1eb' // Test candidate ID
        })
        .select()
        .single();
      
      if (testError) {
        console.error('Test submission error:', testError);
      } else {
        console.log('Test submission result:', testSubmission);
      }
    }
    
  } catch (error) {
    console.error('Overall error:', error);
  }
}

debugFlagSubmissions();
