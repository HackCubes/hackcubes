const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAdminReports() {
  try {
    console.log('🔍 Debugging admin reports issue...\n');

    // 1. Check if there are any reports in the database
    console.log('1. Checking assessment_reports table...');
    const { data: allReports, error: reportsError } = await supabase
      .from('assessment_reports')
      .select('*');

    if (reportsError) {
      console.error('❌ Error fetching reports:', reportsError);
      return;
    }

    console.log(`✅ Found ${allReports?.length || 0} reports in database`);
    if (allReports && allReports.length > 0) {
      console.log('📋 Sample report:', {
        id: allReports[0].id,
        user_id: allReports[0].user_id,
        assessment_id: allReports[0].assessment_id,
        status: allReports[0].status,
        submitted_at: allReports[0].submitted_at,
        report_file_name: allReports[0].report_file_name
      });
    }

    // 2. Test admin API directly with service role
    console.log('\n2. Testing admin API with service role...');
    const response = await fetch('http://localhost:3001/api/admin/reports?status=all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin API response:', {
        success: data.success,
        reportsCount: data.reports?.length || 0,
        pagination: data.pagination
      });
      
      if (data.reports && data.reports.length > 0) {
        console.log('📋 Sample enriched report:', {
          id: data.reports[0].id,
          user: data.reports[0].user,
          status: data.reports[0].status,
          file_name: data.reports[0].report_file_name
        });
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Admin API error:', response.status, errorText);
    }

    // 3. Check if admin user exists in profiles
    console.log('\n3. Checking admin user in profiles...');
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@hackcubes.com')
      .single();

    if (profileError) {
      console.error('❌ Admin profile error:', profileError);
    } else {
      console.log('✅ Admin profile found:', {
        id: adminProfile.id,
        email: adminProfile.email,
        is_admin: adminProfile.is_admin
      });
    }

    // 4. Test admin API without auth (to see if it's an auth issue)
    console.log('\n4. Testing admin API without authentication...');
    const noAuthResponse = await fetch('http://localhost:3001/api/admin/reports?status=submitted', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (noAuthResponse.ok) {
      const noAuthData = await noAuthResponse.json();
      console.log('✅ No-auth API response:', {
        success: noAuthData.success,
        reportsCount: noAuthData.reports?.length || 0
      });
    } else {
      const noAuthError = await noAuthResponse.text();
      console.log('❌ No-auth API error (expected):', noAuthResponse.status, noAuthError);
    }

    // 5. Check auth.users table
    console.log('\n5. Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth users error:', authError);
    } else {
      console.log(`✅ Found ${authUsers?.users?.length || 0} users in auth.users`);
      const adminUser = authUsers?.users?.find(u => u.email === 'admin@hackcubes.com');
      if (adminUser) {
        console.log('✅ Admin user found in auth.users:', adminUser.id);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugAdminReports();
