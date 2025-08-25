#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
});

async function executeSQLFile() {
  try {
    console.log('🚀 Starting database setup...');
    console.log(`📡 Connected to: ${supabaseUrl}`);
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database_setup_complete.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error('database_setup_complete.sql file not found');
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📖 Read SQL file (${sql.length} characters)`);
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.match(/^\s*$/));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`[${i + 1}/${statements.length}] Executing statement...`);
          
          // Use the raw SQL execution
          const { data, error } = await supabase.rpc('exec', { sql: statement + ';' });
          
          if (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate key') ||
                error.code === '42P07' || // relation already exists
                error.code === '42710') { // trigger already exists
              console.log(`⚠️  [${i + 1}] Skipped (already exists): ${error.message.substring(0, 100)}...`);
            } else {
              console.error(`❌ [${i + 1}] Error: ${error.message}`);
              errors.push({ statement: i + 1, error: error.message });
              errorCount++;
            }
          } else {
            successCount++;
            console.log(`✅ [${i + 1}] Success`);
          }
        } catch (e) {
          console.error(`❌ [${i + 1}] Exception: ${e.message}`);
          errors.push({ statement: i + 1, error: e.message });
          errorCount++;
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(err => {
        console.log(`   ${err.statement}: ${err.error.substring(0, 150)}...`);
      });
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (tablesError) {
        console.error('❌ Error checking tables:', tablesError);
      } else {
        const tableNames = tables.map(t => t.table_name).filter(name => 
          !name.startsWith('_') // Filter out system tables
        ).sort();
        
        console.log(`📋 Found ${tableNames.length} tables:`);
        console.log(tableNames.join(', '));
        
        // Check for key tables
        const requiredTables = ['profiles', 'assessments', 'sections', 'questions', 'flags', 'enrollments'];
        const missingTables = requiredTables.filter(table => !tableNames.includes(table));
        
        if (missingTables.length === 0) {
          console.log('✅ All required tables found!');
        } else {
          console.warn('⚠️  Missing required tables:', missingTables.join(', '));
        }
      }
    } catch (e) {
      console.error('❌ Error verifying tables:', e.message);
    }
    
    console.log('\n🎉 Database setup completed!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Alternative method using direct query if rpc doesn't work
async function executeSQLDirectly() {
  console.log('🔄 Trying direct SQL execution method...');
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (testError) {
      throw new Error(`Connection test failed: ${testError.message}`);
    }
    
    console.log('✅ Connection verified');
    
    // For now, we'll just verify what tables already exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('❌ Error checking existing tables:', tablesError);
    } else {
      const tableNames = tables.map(t => t.table_name).filter(name => 
        !name.startsWith('_')
      ).sort();
      
      console.log(`📋 Current tables (${tableNames.length}):`);
      console.log(tableNames.join(', '));
      
      const requiredTables = ['profiles', 'assessments', 'sections', 'questions', 'flags', 'enrollments'];
      const missingTables = requiredTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length === 0) {
        console.log('✅ All required tables already exist!');
        console.log('🎯 Your database setup is complete!');
      } else {
        console.log('❌ Missing required tables:', missingTables.join(', '));
        console.log('📝 Please run the SQL manually in Supabase Dashboard');
      }
    }
    
  } catch (error) {
    console.error('❌ Direct method failed:', error.message);
    console.log('\n📖 Manual Setup Required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of database_setup_complete.sql');
    console.log('4. Run the SQL');
  }
}

// Run the setup
console.log('🎯 HackCubes Database Setup');
console.log('============================\n');

executeSQLFile().catch((error) => {
  console.log('\n🔄 Primary method failed, trying alternative...');
  console.log('Error:', error.message);
  executeSQLDirectly();
});
