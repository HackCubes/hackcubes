require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructures() {
  console.log('🔍 Checking database table structures...\n');
  
  const tables = ['submissions', 'enrollments', 'flag_submissions', 'user_flag_submissions'];
  
  for (const table of tables) {
    console.log(`📋 Table: ${table}`);
    try {
      // Try to get one record to see the structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        if (data && data.length > 0) {
          console.log(`   ✅ Columns:`, Object.keys(data[0]).join(', '));
          console.log(`   📊 Sample data:`, data[0]);
        } else {
          console.log(`   ℹ️  Table exists but is empty`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Error accessing table:`, err.message);
    }
    console.log('');
  }
}

checkTableStructures();
