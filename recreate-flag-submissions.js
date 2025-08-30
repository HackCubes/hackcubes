require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function recreateFlagSubmissionsTable() {
  console.log('🔧 Recreating flag_submissions table with correct schema...\n');
  
  try {
    // Read the SQL setup file
    const sql = fs.readFileSync('modern-submissions-setup.sql', 'utf8');
    console.log('📝 SQL file read successfully');
    
    // Execute the SQL in chunks
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      console.log(`\n${i + 1}. Executing: ${statement.substring(0, 50)}...`);
      
      try {
        // For table creation and alterations, we'll try individual queries
        if (statement.includes('CREATE TABLE') && statement.includes('flag_submissions')) {
          console.log('🗃️ Creating flag_submissions table...');
          
          // First drop the table if it exists to recreate with correct schema
          try {
            await supabase.rpc('exec_sql', { sql: 'DROP TABLE IF EXISTS flag_submissions CASCADE;' });
            console.log('✅ Dropped existing flag_submissions table');
          } catch (e) {
            console.log('ℹ️ No existing table to drop');
          }
        }
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.log(`❌ Error: ${error.message}`);
          if (error.message.includes('already exists')) {
            console.log('ℹ️ Skipping - already exists');
          }
        } else {
          console.log('✅ Success');
        }
      } catch (e) {
        console.log(`❌ Exception: ${e.message}`);
      }
    }
    
    // Test the new table
    console.log('\n🧪 Testing new table structure...');
    const testFlag = {
      submission_id: '12345678-1234-1234-1234-123456789012',
      question_id: 'f6ce8293-3ea2-4657-8102-32e3e7c78b28',
      flag_id: '1c3807a7-d4e4-4c33-8ed9-be70de7faee1',
      value: 'g0l4ng_1s_aw3s0m3_but_t3mplat3s_c4n_b3_l3th4l!',
      flag_type: 'USER'
    };
    
    const { data: testResult, error: testError } = await supabase
      .from('flag_submissions')
      .insert(testFlag)
      .select()
      .single();
    
    if (testError) {
      console.log('❌ Test insertion failed:', testError.message);
    } else {
      console.log('✅ Test insertion successful!');
      console.log('Is correct:', testResult.is_correct);
      console.log('Score:', testResult.score);
      console.log('Available columns:', Object.keys(testResult));
      
      // Clean up test record
      await supabase
        .from('flag_submissions')
        .delete()
        .eq('id', testResult.id);
      console.log('🧹 Test record cleaned up');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

recreateFlagSubmissionsTable();
