const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminReports() {
  try {
    console.log('🔍 Testing admin reports API...');

    // Test direct table access first
    console.log('\n1. Testing direct assessment_reports table access...');
    const { data: reports, error: reportsError } = await supabase
      .from('assessment_reports')
      .select('*')
      .limit(5);

    if (reportsError) {
      console.error('❌ Error accessing assessment_reports table:', reportsError);
    } else {
      console.log(`✅ Found ${reports?.length || 0} reports in the table`);
      if (reports && reports.length > 0) {
        console.log('📋 Sample report:', {
          id: reports[0].id,
          user_id: reports[0].user_id,
          assessment_id: reports[0].assessment_id,
          status: reports[0].status,
          submitted_at: reports[0].submitted_at
        });
      }
    }

    // Test profiles table access
    console.log('\n2. Testing profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError);
      console.log('ℹ️ Profiles table may not exist yet - run the MANUAL_CREATE_TABLES.sql');
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profiles in the table`);
    }

    // Test admin reports API endpoint
    console.log('\n3. Testing admin reports API endpoint...');
    const response = await fetch('http://localhost:3001/api/admin/reports?status=all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin reports API working');
      console.log(`📊 Reports found: ${data.reports?.length || 0}`);
      if (data.reports && data.reports.length > 0) {
        console.log('📋 Sample enriched report:', {
          id: data.reports[0].id,
          user: data.reports[0].user,
          status: data.reports[0].status
        });
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Admin reports API error:', response.status, errorText);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testAdminReports();
