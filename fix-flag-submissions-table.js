require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFlagSubmissionsTable() {
  console.log('🔧 Fixing flag_submissions table structure...\n');
  
  try {
    // First, let's see what the current structure looks like
    console.log('1. Current table structure:');
    const { data: existingSubmissions } = await supabase
      .from('flag_submissions')
      .select('*')
      .limit(1);
    
    console.log('Sample submission:', existingSubmissions);
    
    // Add missing columns to flag_submissions table
    console.log('\n2. Adding missing columns...');
    
    const alterQueries = [
      'ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS candidate_id UUID;',
      'ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS submission_id UUID;',
      'ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;',
      'ALTER TABLE flag_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();'
    ];
    
    // We can't execute raw SQL directly, so let's try inserting a test record to see what's missing
    console.log('Testing insertion to identify missing columns...');
    
    // Try to insert with all expected columns
    const testData = {
      question_id: 'f6ce8293-3ea2-4657-8102-32e3e7c78b28',
      flag_id: '1c3807a7-d4e4-4c33-8ed9-be70de7faee1',
      submitted_value: 'test_value',
      candidate_id: '77b7ee7c-828d-42b6-b84e-f919174ce1eb',
      submission_id: '12345678-1234-1234-1234-123456789012',
      is_correct: false,
      score: 0
    };
    
    const { data: testResult, error: testError } = await supabase
      .from('flag_submissions')
      .insert(testData)
      .select()
      .single();
    
    if (testError) {
      console.log('❌ Missing columns detected:', testError.message);
      
      // Let's check what columns do exist
      console.log('\n3. Let me try with minimal data to see what works...');
      
      const minimalData = {
        question_id: 'f6ce8293-3ea2-4657-8102-32e3e7c78b28',
        flag_id: '1c3807a7-d4e4-4c33-8ed9-be70de7faee1',
        submitted_value: 'test_minimal'
      };
      
      const { data: minimalResult, error: minimalError } = await supabase
        .from('flag_submissions')
        .insert(minimalData)
        .select()
        .single();
      
      if (minimalError) {
        console.log('❌ Minimal insertion failed:', minimalError.message);
      } else {
        console.log('✅ Minimal insertion worked:', minimalResult);
        console.log('Available columns:', Object.keys(minimalResult));
        
        // Clean up the test record
        await supabase
          .from('flag_submissions')
          .delete()
          .eq('id', minimalResult.id);
      }
    } else {
      console.log('✅ All columns exist:', testResult);
      
      // Clean up the test record
      await supabase
        .from('flag_submissions')
        .delete()
        .eq('id', testResult.id);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixFlagSubmissionsTable();
