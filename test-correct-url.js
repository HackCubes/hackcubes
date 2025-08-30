require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testCorrectUrl() {
  console.log('🧪 Testing correct file URL construction...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Based on debug output, the correct path is:
  const correctPath = 'reports/533d4e96-fe35-4540-9798-162b3f261572/1756577986374_John_Doe_HCJPT_Certificate.pdf';
  
  console.log('Testing file path:', correctPath);
  
  // Get public URL
  const { data: publicUrl } = supabase.storage
    .from('assessment-reports')
    .getPublicUrl(correctPath);
  
  console.log('Generated URL:', publicUrl.publicUrl);
  
  // Test if URL is accessible
  try {
    const response = await fetch(publicUrl.publicUrl);
    console.log('URL Status:', response.status);
    if (response.status === 200) {
      console.log('✅ File is accessible!');
      console.log('Content-Type:', response.headers.get('content-type'));
      console.log('Content-Length:', response.headers.get('content-length'));
    } else {
      console.log('❌ File not accessible');
    }
  } catch (error) {
    console.error('❌ Error testing URL:', error.message);
  }
}

testCorrectUrl();
