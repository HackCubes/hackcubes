require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkReportFields() {
  console.log('🔍 Checking all fields in assessment_reports table...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get the full report record with all fields
    const { data: reports, error } = await supabase
      .from('assessment_reports')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
    } else if (reports && reports.length > 0) {
      console.log('Full report record:');
      console.log(JSON.stringify(reports[0], null, 2));
      
      // Check if enrollment_id matches the UUID folder
      const report = reports[0];
      const uuidFolder = '1a8ceff6-8cf8-4cdf-9e42-b7f7b0acd1ce';
      
      console.log('\nComparing IDs:');
      console.log('UUID folder:', uuidFolder);
      console.log('User ID:', report.user_id);
      console.log('Enrollment ID:', report.enrollment_id);
      
      if (report.enrollment_id === uuidFolder) {
        console.log('✅ UUID folder matches enrollment_id!');
      } else if (report.user_id === uuidFolder) {
        console.log('✅ UUID folder matches user_id!');
      } else {
        console.log('❌ UUID folder doesn\'t match any ID');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkReportFields();
