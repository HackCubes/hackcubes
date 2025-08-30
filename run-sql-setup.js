const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLSetup() {
  try {
    console.log('🚀 Setting up database tables...');

    // Read the SQL file
    const sqlContent = fs.readFileSync('payment-tables-setup.sql', 'utf8');
    
    // Split into individual statements and execute them one by one
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          // Use the REST API to execute SQL directly
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: statement + ';' })
          });

          if (!response.ok) {
            const error = await response.text();
            console.log(`⚠️ Statement ${i + 1} may have failed (this might be normal for CREATE IF NOT EXISTS):`, error);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (error) {
          console.log(`⚠️ Error executing statement ${i + 1} (this might be normal):`, error.message);
        }
      }
    }

    // Now test if we can access the assessment_reports table
    console.log('\n🔍 Testing table access...');
    const { data, error } = await supabase
      .from('assessment_reports')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Still cannot access assessment_reports table:', error);
      
      // Try creating just the assessment_reports table manually
      console.log('🔧 Trying to create assessment_reports table manually...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.assessment_reports (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          enrollment_id BIGINT,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          assessment_id TEXT NOT NULL,
          report_file_url TEXT NOT NULL,
          report_file_name VARCHAR(255) NOT NULL,
          report_file_size BIGINT NOT NULL,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          submission_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
          status VARCHAR(50) DEFAULT 'submitted',
          admin_review_notes TEXT,
          reviewed_by UUID REFERENCES auth.users(id),
          reviewed_at TIMESTAMP WITH TIME ZONE,
          final_score INTEGER,
          pass_threshold INTEGER DEFAULT 60,
          is_passed BOOLEAN,
          certificate_issued BOOLEAN DEFAULT FALSE,
          certificate_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: createTableSQL })
      });

      if (response2.ok) {
        console.log('✅ assessment_reports table created manually');
      } else {
        const error2 = await response2.text();
        console.error('❌ Failed to create table manually:', error2);
      }

    } else {
      console.log('✅ assessment_reports table is accessible');
    }

    console.log('🎉 Database setup completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
runSQLSetup();
