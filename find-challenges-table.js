const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findChallengesTable() {
  try {
    console.log('🔍 Looking for challenges table...\n');
    
    // Try different possible table names
    const possibleTables = [
      'challenges',
      'challenge_questions', 
      'questions',
      'challenge_templates',
      'web_challenges',
      'security_challenges'
    ];
    
    for (const tableName of possibleTables) {
      try {
        console.log(`📋 Trying table: ${tableName}`);
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          console.log(`✅ Found table: ${tableName}`);
          console.log(`   Columns:`, Object.keys(data[0] || {}));
          
          // Get count
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          console.log(`   Records: ${count}\n`);
          
          // If this looks like a challenges table, show some data
          if (count > 0) {
            const { data: sample } = await supabase
              .from(tableName)
              .select('*')
              .limit(5);
            
            console.log('📊 Sample data:');
            sample.forEach((record, i) => {
              console.log(`${i + 1}. ${JSON.stringify(record, null, 2)}`);
            });
          }
        } else {
          console.log(`❌ Table ${tableName} not found or error:`, error?.message);
        }
      } catch (err) {
        console.log(`❌ Error with ${tableName}:`, err.message);
      }
    }
    
    // Also try to get schema information
    console.log('\n🔧 Attempting to get schema info...');
    try {
      const { data: schemas } = await supabase
        .rpc('get_schema_tables');
      console.log('Schema tables:', schemas);
    } catch (err) {
      console.log('Schema query failed:', err.message);
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
  }
}

findChallengesTable();
