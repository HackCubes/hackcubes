const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  try {
    console.log('Checking for missing columns...');
    
    // Test if final_score exists in enrollments
    const { data: enrollmentTest, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('final_score')
      .limit(1);
    
    console.log('Enrollments final_score column:', { exists: !enrollmentError, error: enrollmentError?.message });
    
    // Test if progress_percentage exists in submissions
    const { data: submissionTest, error: submissionError } = await supabase
      .from('submissions')
      .select('progress_percentage')
      .limit(1);
    
    console.log('Submissions progress_percentage column:', { exists: !submissionError, error: submissionError?.message });
    
    // Test current columns in submissions
    const { data: submissionColumns, error: columnsError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);
    
    if (submissionColumns && submissionColumns.length > 0) {
      console.log('Available submissions columns:', Object.keys(submissionColumns[0]));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addMissingColumns();
