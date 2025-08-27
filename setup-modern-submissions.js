const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function setupModernSubmissionSystem() {
  console.log('🚀 Setting up modern submission system...');

  try {
    // Get environment variables
    let supabaseUrl, supabaseServiceKey;
    
    try {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });
      
      supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
      supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
    } catch (e) {
      console.log('Could not read .env.local, trying process.env...');
      supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read and execute the SQL file
    console.log('📝 Reading SQL setup file...');
    const sqlContent = fs.readFileSync('modern-submissions-setup.sql', 'utf8');
    
    console.log('🗃️ Creating modern submission tables...');
    
    // Split SQL into individual statements and execute
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.warn('⚠️ SQL Warning:', error.message);
          }
        } catch (e) {
          console.warn('⚠️ Could not execute statement via RPC, might already exist:', e.message);
        }
      }
    }

    // Test the tables
    console.log('🧪 Testing table access...');
    
    const { data: submissionsTest, error: submissionsError } = await supabase
      .from('submissions')
      .select('id')
      .limit(1);
      
    if (submissionsError) {
      console.log('❌ submissions table test failed:', submissionsError.message);
    } else {
      console.log('✅ submissions table accessible');
    }

    const { data: flagSubmissionsTest, error: flagSubmissionsError } = await supabase
      .from('flag_submissions')
      .select('id')
      .limit(1);
      
    if (flagSubmissionsError) {
      console.log('❌ flag_submissions table test failed:', flagSubmissionsError.message);
    } else {
      console.log('✅ flag_submissions table accessible');
    }

    const { data: invitationsTest, error: invitationsError } = await supabase
      .from('assessment_invitations')
      .select('id')
      .limit(1);
      
    if (invitationsError) {
      console.log('❌ assessment_invitations table test failed:', invitationsError.message);
      console.log('ℹ️ You may need to run the assessment-invitations setup first');
    } else {
      console.log('✅ assessment_invitations table accessible');
    }

    console.log('\n🎉 Modern submission system setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. If assessment_invitations table failed, run the invitation setup script');
    console.log('2. Test the assessment flow: create assessment → invite candidates → start assessment');
    console.log('3. The system now supports both modern (submissions) and legacy (enrollments) flows');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupModernSubmissionSystem().catch(console.error);
