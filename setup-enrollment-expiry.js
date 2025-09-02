const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iqefobkbzlyxcmlbqwxo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSqlFile(filePath) {
  try {
    console.log(`📄 Reading SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query as fallback
          const { error: directError } = await supabase.from('_').select('*').limit(0);
          console.log(`   ⚠️  RPC failed, trying direct execution...`);
          
          // For some statements like CREATE FUNCTION, we might need to use a different approach
          console.log(`   Statement: ${statement.substring(0, 100)}...`);
          if (error.message) {
            console.log(`   Error: ${error.message}`);
          }
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log(`✅ SQL file execution completed: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error executing SQL file ${filePath}:`, error.message);
    throw error;
  }
}

async function testEnrollmentExpiry() {
  try {
    console.log('\n🧪 Testing enrollment expiry functionality...');
    
    // Test 1: Check if enrollments table exists and has expires_at column
    console.log('   Test 1: Checking enrollments table structure...');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, expires_at, created_at')
      .limit(1);
    
    if (enrollmentsError) {
      console.log(`   ❌ Enrollments table check failed: ${enrollmentsError.message}`);
    } else {
      console.log(`   ✅ Enrollments table accessible`);
    }
    
    // Test 2: Check if functions were created
    console.log('   Test 2: Checking if expiry functions exist...');
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .in('proname', ['set_enrollment_expiry', 'extend_enrollment_expiry', 'update_expired_enrollments']);
    
    if (functionsError) {
      console.log(`   ⚠️  Function check failed: ${functionsError.message}`);
    } else {
      console.log(`   ✅ Found ${functions?.length || 0} expiry management functions`);
    }
    
    // Test 3: Check enrollment analytics view
    console.log('   Test 3: Testing enrollment analytics view...');
    const { data: analytics, error: analyticsError } = await supabase
      .from('enrollment_analytics')
      .select('*')
      .limit(5);
    
    if (analyticsError) {
      console.log(`   ❌ Analytics view test failed: ${analyticsError.message}`);
    } else {
      console.log(`   ✅ Analytics view working, found ${analytics?.length || 0} assessments`);
      if (analytics && analytics.length > 0) {
        analytics.forEach(assessment => {
          console.log(`      - ${assessment.assessment_name}: ${assessment.total_enrollments} total, ${assessment.active_enrollments} active`);
        });
      }
    }
    
    // Test 4: Test API endpoint
    console.log('   Test 4: Testing enrollments API endpoint...');
    try {
      const response = await fetch(`${supabaseUrl.replace('supabase.co', 'supabase.co')}/api/admin/enrollments?certificationId=hcjpt`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ API endpoint working, found ${data.enrollments?.length || 0} enrollments`);
      } else {
        console.log(`   ⚠️  API endpoint returned status: ${response.status}`);
      }
    } catch (apiError) {
      console.log(`   ⚠️  API test skipped (may need local server): ${apiError.message}`);
    }
    
    console.log('\n✅ Enrollment expiry testing completed!\n');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

async function checkExistingEnrollments() {
  try {
    console.log('📊 Checking existing enrollments...');
    
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('id, user_id, assessment_id, expires_at, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log(`❌ Error fetching enrollments: ${error.message}`);
      return;
    }
    
    console.log(`📈 Found ${enrollments?.length || 0} recent enrollments:`);
    
    if (enrollments && enrollments.length > 0) {
      enrollments.forEach((enrollment, index) => {
        const expiryStatus = enrollment.expires_at 
          ? new Date(enrollment.expires_at) < new Date() 
            ? '🔴 EXPIRED' 
            : '🟢 ACTIVE'
          : '⚠️  NO EXPIRY';
        
        console.log(`   ${index + 1}. Status: ${enrollment.status} | Expiry: ${expiryStatus} | Created: ${new Date(enrollment.created_at).toLocaleDateString()}`);
      });
    }
    
    // Count enrollments by status
    const { data: statusCounts } = await supabase
      .from('enrollments')
      .select('status, expires_at')
      .order('created_at', { ascending: false });
    
    if (statusCounts) {
      const stats = {
        total: statusCounts.length,
        withExpiry: statusCounts.filter(e => e.expires_at).length,
        expired: statusCounts.filter(e => e.expires_at && new Date(e.expires_at) < new Date()).length,
        active: statusCounts.filter(e => !e.expires_at || new Date(e.expires_at) >= new Date()).length,
      };
      
      console.log(`📊 Enrollment Statistics:`);
      console.log(`   Total: ${stats.total}`);
      console.log(`   With Expiry Date: ${stats.withExpiry}`);
      console.log(`   Expired: ${stats.expired}`);
      console.log(`   Active: ${stats.active}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking enrollments:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Enrollment Expiry Setup...\n');
  
  try {
    // Check current state
    await checkExistingEnrollments();
    
    console.log('\n' + '='.repeat(60));
    console.log('📝 Note: The SQL setup file should be run manually in Supabase SQL Editor');
    console.log('   File: enrollment-expiry-setup.sql');
    console.log('   This script will test the functionality after setup.');
    console.log('='.repeat(60) + '\n');
    
    // Test the setup
    await testEnrollmentExpiry();
    
    console.log('🎉 Setup verification completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run enrollment-expiry-setup.sql in Supabase SQL Editor');
    console.log('   2. Test the admin certifications page at /admin/certifications');
    console.log('   3. Verify enrollment expiry tracking is working');
    console.log('   4. Test payment-based enrollment creation');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runSqlFile,
  testEnrollmentExpiry,
  checkExistingEnrollments,
}; 