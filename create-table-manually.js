require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createFlagSubmissionsTableManually() {
  console.log('🔧 Creating flag_submissions table manually...\n');
  
  try {
    // First check if we can create tables using direct insert
    console.log('1. Testing table creation with simple insert...');
    
    // Try to select from the table first to see what exists
    const { data: existingData, error: selectError } = await supabase
      .from('flag_submissions')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log('❌ Table does not exist or has issues:', selectError.message);
      
      // Since we can't use exec_sql, let's try to work with what we have
      // Let's check what tables we can access
      const tablesToCheck = ['submissions', 'flags', 'questions'];
      
      for (const table of tablesToCheck) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        console.log(`${table}: ${error ? '❌ ' + error.message : '✅ accessible'}`);
      }
      
      // Since we can't directly create tables, let's try a different approach
      // Let's create a submission entry in the submissions table first
      console.log('\n2. Creating test submission...');
      
      const testSubmission = {
        assessment_id: '533d4e96-fe35-4540-9798-162b3f261572',
        candidate_id: '77b7ee7c-828d-42b6-b84e-f919174ce1eb',
        status: 'STARTED',
        type: 'CTF'
      };
      
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .insert(testSubmission)
        .select()
        .single();
      
      if (submissionError) {
        console.log('❌ Cannot create submission:', submissionError.message);
      } else {
        console.log('✅ Test submission created:', submissionData.id);
        
        // Now try to create flag submission with this submission_id
        console.log('\n3. Testing flag submission creation...');
        
        // Since the old table was dropped, maybe it exists but with limited columns
        // Let's try with minimal data first
        const minimalFlagData = {
          submission_id: submissionData.id,
          question_id: 'f6ce8293-3ea2-4657-8102-32e3e7c78b28',
          flag_id: '1c3807a7-d4e4-4c33-8ed9-be70de7faee1'
        };
        
        const { data: flagData, error: flagError } = await supabase
          .from('flag_submissions')
          .insert(minimalFlagData)
          .select()
          .single();
        
        if (flagError) {
          console.log('❌ Cannot create flag submission:', flagError.message);
          
          // Maybe we need the value field
          const dataWithValue = {
            ...minimalFlagData,
            value: 'test_value'
          };
          
          const { data: flagData2, error: flagError2 } = await supabase
            .from('flag_submissions')
            .insert(dataWithValue)
            .select()
            .single();
          
          if (flagError2) {
            console.log('❌ Still cannot create with value:', flagError2.message);
          } else {
            console.log('✅ Flag submission created with value:', flagData2);
            console.log('Available columns:', Object.keys(flagData2));
          }
        } else {
          console.log('✅ Flag submission created minimal:', flagData);
          console.log('Available columns:', Object.keys(flagData));
        }
        
        // Clean up
        await supabase.from('submissions').delete().eq('id', submissionData.id);
        console.log('🧹 Cleaned up test data');
      }
    } else {
      console.log('✅ Table exists, sample data:', existingData);
      if (existingData && existingData.length > 0) {
        console.log('Available columns:', Object.keys(existingData[0]));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createFlagSubmissionsTableManually();
