const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iqefobkbzlyxcmlbqwxo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table '${tableName}' error:`, error.message);
      return false;
    }
    
    console.log(`✅ Table '${tableName}' exists and is accessible`);
    return true;
  } catch (error) {
    console.log(`❌ Table '${tableName}' check failed:`, error.message);
    return false;
  }
}

async function checkTableStructure(tableName) {
  try {
    console.log(`\n🔍 Checking structure of '${tableName}' table:`);
    
    // Try to get a few records to see the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);
    
    if (error) {
      console.log(`   Error: ${error.message}`);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`   📊 Sample data (${data.length} records):`);
      console.log(`   Columns:`, Object.keys(data[0]));
      
      // Show first record
      console.log(`   Sample record:`, JSON.stringify(data[0], null, 2));
    } else {
      console.log(`   📊 Table exists but is empty`);
      
      // Try to get column information by doing a select with limit 0
      const { error: structError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (!structError) {
        console.log(`   ✅ Table structure is valid (empty table)`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Structure check failed: ${error.message}`);
  }
}

async function createMissingTables() {
  console.log('\n🛠️  Creating missing tables...');
  
  // Create assessment_invitations table if it doesn't exist
  try {
    const { error } = await supabase
      .from('assessment_invitations')
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log('📝 Creating assessment_invitations table...');
      
      // Use raw SQL to create the table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS assessment_invitations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          assessment_id UUID NOT NULL,
          email VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          accepted_at TIMESTAMP WITH TIME ZONE,
          invited_by_id UUID,
          notes TEXT,
          UNIQUE(assessment_id, email)
        );
        
        -- Enable RLS
        ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for admins
        CREATE POLICY "Admins can manage invitations" ON assessment_invitations
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.id = auth.uid() 
              AND profiles.is_admin = true
            )
          );
        
        -- Index for performance
        CREATE INDEX IF NOT EXISTS idx_assessment_invitations_assessment_email 
          ON assessment_invitations(assessment_id, email);
        CREATE INDEX IF NOT EXISTS idx_assessment_invitations_status 
          ON assessment_invitations(status);
      `;
      
      // Execute SQL - Note: This might need to be run manually in Supabase SQL editor
      console.log('SQL to create assessment_invitations table:');
      console.log(createTableSQL);
      
    }
  } catch (error) {
    console.log('Error checking assessment_invitations:', error.message);
  }
}

async function seedTestData() {
  console.log('\n🌱 Adding test data...');
  
  const HJCPT_ASSESSMENT_ID = '533d4e96-fe35-4540-9798-162b3f261572';
  
  try {
    // Check if we have any test users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(3);
    
    if (profiles && profiles.length > 0) {
      console.log(`   Found ${profiles.length} user profiles`);
      
      // Create test invitations for existing users
      const testInvitations = profiles.slice(0, 2).map(profile => ({
        assessment_id: HJCPT_ASSESSMENT_ID,
        email: profile.email,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      }));
      
      const { data: invitations, error: inviteError } = await supabase
        .from('assessment_invitations')
        .upsert(testInvitations, { onConflict: 'assessment_id,email' })
        .select();
      
      if (inviteError) {
        console.log('   ❌ Error creating test invitations:', inviteError.message);
      } else {
        console.log(`   ✅ Created ${invitations?.length || 0} test invitations`);
      }
      
      // Create test enrollments
      const testEnrollments = profiles.slice(0, 2).map(profile => ({
        user_id: profile.id,
        assessment_id: HJCPT_ASSESSMENT_ID,
        status: 'ENROLLED',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      }));
      
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .upsert(testEnrollments, { onConflict: 'user_id,assessment_id' })
        .select();
      
      if (enrollError) {
        console.log('   ❌ Error creating test enrollments:', enrollError.message);
      } else {
        console.log(`   ✅ Created ${enrollments?.length || 0} test enrollments`);
      }
    }
    
  } catch (error) {
    console.log('   ❌ Error seeding test data:', error.message);
  }
}

async function testAPIEndpoint() {
  console.log('\n🧪 Testing API endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/enrollments?certificationId=hcjpt');
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API working successfully');
      console.log('   📊 Response:', {
        enrollments: data.enrollments?.length || 0,
        stats: data.stats
      });
    } else {
      const errorData = await response.text();
      console.log('   ❌ API error:', response.status, errorData);
    }
  } catch (error) {
    console.log('   ⚠️  API test failed (server may not be running):', error.message);
  }
}

async function main() {
  console.log('🔍 Checking Database Structure for Enrollment Management\n');
  
  // Check if required tables exist
  const tablesToCheck = [
    'profiles',
    'assessments', 
    'enrollments',
    'assessment_invitations',
    'certification_purchases'
  ];
  
  console.log('📋 Checking table existence:');
  for (const table of tablesToCheck) {
    await checkTableExists(table);
  }
  
  // Check structure of key tables
  console.log('\n📊 Checking table structures:');
  for (const table of tablesToCheck) {
    await checkTableStructure(table);
  }
  
  // Create missing tables if needed
  await createMissingTables();
  
  // Add test data
  await seedTestData();
  
  // Test the API
  await testAPIEndpoint();
  
  console.log('\n✅ Database structure check completed!');
  console.log('\n📋 Next steps:');
  console.log('1. If assessment_invitations table was missing, run the SQL manually in Supabase');
  console.log('2. Test the API endpoint again');
  console.log('3. Check the admin enrollments page');
}

if (require.main === module) {
  main();
} 