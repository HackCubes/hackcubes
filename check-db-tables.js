const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('Checking available tables...');
    
    // Check user_flag_submissions
    const { data: userFlagSubmissions, error: userFlagError } = await supabase
      .from('user_flag_submissions')
      .select('*')
      .limit(1);
    
    console.log('user_flag_submissions:', { available: !userFlagError, error: userFlagError?.message });
    
    // Check flag_submissions  
    const { data: flagSubmissions, error: flagError } = await supabase
      .from('flag_submissions')
      .select('*')
      .limit(1);
    
    console.log('flag_submissions:', { available: !flagError, error: flagError?.message });
    
    // Check enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .limit(1);
    
    console.log('enrollments:', { available: !enrollmentError, error: enrollmentError?.message });
    
    // Check submissions
    const { data: submissions, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);
    
    console.log('submissions:', { available: !submissionError, error: submissionError?.message });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
