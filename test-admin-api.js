// Simple test to call admin API and check response structure
async function testAdminAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/reports?status=all');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.reports && data.reports.length > 0) {
      console.log('\n--- First Report Details ---');
      const firstReport = data.reports[0];
      console.log('Report ID:', firstReport.id);
      console.log('Report File URL:', firstReport.report_file_url);
      console.log('User:', firstReport.user);
      console.log('Status:', firstReport.status);
      
      if (firstReport.report_file_url) {
        console.log('\n✅ File URL constructed successfully!');
        
        // Test if the URL is accessible
        console.log('\nTesting file URL accessibility...');
        const fileResponse = await fetch(firstReport.report_file_url);
        console.log('File URL Status:', fileResponse.status);
        if (fileResponse.status === 200) {
          console.log('✅ File is accessible!');
        } else {
          console.log('❌ File not accessible. Status:', fileResponse.status);
        }
      } else {
        console.log('❌ No file URL found in response');
      }
    }
  } catch (error) {
    console.error('Error testing admin API:', error);
  }
}

testAdminAPI();
