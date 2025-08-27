// Test Network Instance API
const fs = require('fs');

async function testNetworkAPI() {
  console.log('🧪 Testing Network Instance API...');

  try {
    // Read environment variables
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    const baseUrl = envVars.NETWORK_LAMBDA_URL;
    const token = envVars.AWS_LAMBDA_TOKEN;

    if (!baseUrl || !token) {
      console.error('❌ Missing NETWORK_LAMBDA_URL or AWS_LAMBDA_TOKEN');
      return;
    }

    console.log('🔗 Network Lambda URL:', baseUrl);
    console.log('🔑 Token available:', !!token);

    // Test get_status call
    const testUrl = `${baseUrl}?action=get_status&question_id=test-question&candidate_id=test-candidate&token=${encodeURIComponent(token)}&_t=${Date.now()}`;
    
    console.log('📡 Making test request...');
    
    const response = await fetch(testUrl, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);

    if (response.ok) {
      console.log('✅ Network API is working correctly');
    } else {
      console.log('❌ Network API returned error status');
    }

  } catch (error) {
    console.error('❌ Error testing Network API:', error.message);
  }
}

testNetworkAPI().catch(console.error);
