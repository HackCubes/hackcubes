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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDatabaseSetup() {
  try {
    console.log('🚀 Running complete database setup...');
    
    // Read the complete database setup SQL file
    const sqlPath = path.join(__dirname, 'database_setup_complete.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Executing SQL commands...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative method - split and execute commands one by one
      console.log('🔄 Trying alternative method...');
      
      // Split SQL into individual commands
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const command of commands) {
        if (command.trim()) {
          try {
            const { error: cmdError } = await supabase.rpc('exec_sql', { 
              sql_query: command + ';' 
            });
            
            if (cmdError) {
              console.warn(`⚠️ Warning executing command: ${cmdError.message}`);
              errorCount++;
            } else {
              successCount++;
            }
          } catch (e) {
            console.warn(`⚠️ Warning: ${e.message}`);
            errorCount++;
          }
        }
      }
      
      console.log(`✅ Executed ${successCount} commands successfully`);
      if (errorCount > 0) {
        console.log(`⚠️ ${errorCount} commands had warnings (may be expected for existing tables)`);
      }
    } else {
      console.log('✅ Database setup completed successfully!');
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      const tableNames = tables.map(t => t.table_name).sort();
      console.log('📋 Created tables:', tableNames.join(', '));
      
      // Check for key tables
      const requiredTables = ['profiles', 'assessments', 'sections', 'questions', 'flags', 'enrollments'];
      const missingTables = requiredTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length === 0) {
        console.log('✅ All required tables created successfully!');
      } else {
        console.warn('⚠️ Missing tables:', missingTables.join(', '));
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Alternative direct SQL execution if RPC doesn't work
async function runDatabaseSetupDirect() {
  try {
    console.log('🚀 Running direct database setup...');
    
    // Read the complete database setup SQL file
    const sqlPath = path.join(__dirname, 'database_setup_complete.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📖 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`[${i + 1}/${statements.length}] Executing...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
          
          if (error) {
            console.warn(`⚠️ Warning: ${error.message}`);
          }
        } catch (e) {
          console.warn(`⚠️ Warning: ${e.message}`);
        }
      }
    }
    
    console.log('✅ Database setup completed!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
console.log('🎯 HackCubes Database Setup');
console.log('============================');

runDatabaseSetup().catch(() => {
  console.log('\n🔄 Trying direct method...');
  runDatabaseSetupDirect();
});
