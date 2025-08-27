const fs = require('fs');

async function testNetworkLambda() {
  console.log('🧪 Testing Network Lambda Directly...\n');

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
      console.log('❌ Missing environment variables');
      console.log('   NETWORK_LAMBDA_URL:', baseUrl ? 'Present' : 'Missing');
      console.log('   AWS_LAMBDA_TOKEN:', token ? 'Present' : 'Missing');
      return;
    }

    console.log('✅ Environment variables found');
    console.log('   Lambda URL:', baseUrl);
    console.log('   Token:', token.substring(0, 20) + '...');

    // Test parameters
    const failingQuestionId = '1c407890-4181-47e6-86a1-5f281cb32043';
    const workingQuestionId = 'ce72c47e-103f-43c4-95f4-157878d26f10';
    const candidateId = 'f8494a8b-ec32-4363-a8ad-1984e9263bef';

    // =================================================================
    // 1. TEST FAILING QUESTION (Q1)
    // =================================================================
    console.log('\n1️⃣ Testing Failing Question (Techfront Solutions)...');
    
    const failingUrl = `${baseUrl}?action=get_status&question_id=${failingQuestionId}&candidate_id=${candidateId}&token=${token}&_t=${Date.now()}`;
    
    console.log('🔗 Request URL (failing):');
    console.log(failingUrl.replace(token, 'TOKEN_HIDDEN'));
    
    try {
      const response1 = await fetch(failingUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      console.log(`📊 Response Status: ${response1.status} ${response1.statusText}`);
      
      if (!response1.ok) {
        const errorText = await response1.text().catch(() => '');
        console.log('❌ Error Response:', errorText);
      } else {
        const data1 = await response1.json();
        console.log('✅ Success Response:', JSON.stringify(data1, null, 2));
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }

    // =================================================================
    // 2. TEST WORKING QUESTION (Q5)
    // =================================================================
    console.log('\n2️⃣ Testing Working Question (Cloudsafe Solutions)...');
    
    const workingUrl = `${baseUrl}?action=get_status&question_id=${workingQuestionId}&candidate_id=${candidateId}&token=${token}&_t=${Date.now()}`;
    
    console.log('🔗 Request URL (working):');
    console.log(workingUrl.replace(token, 'TOKEN_HIDDEN'));
    
    try {
      const response2 = await fetch(workingUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      console.log(`📊 Response Status: ${response2.status} ${response2.statusText}`);
      
      if (!response2.ok) {
        const errorText = await response2.text().catch(() => '');
        console.log('❌ Error Response:', errorText);
      } else {
        const data2 = await response2.json();
        console.log('✅ Success Response:', JSON.stringify(data2, null, 2));
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }

    // =================================================================
    // 3. TEST START ACTION ON WORKING QUESTION
    // =================================================================
    console.log('\n3️⃣ Testing Start Action on Working Question...');
    
    const startUrl = `${baseUrl}?action=start&question_id=${workingQuestionId}&candidate_id=${candidateId}&template_id=lt-08e367739ac29f518&duration=88&token=${token}&_t=${Date.now()}`;
    
    console.log('🔗 Start Request URL:');
    console.log(startUrl.replace(token, 'TOKEN_HIDDEN'));
    
    try {
      const response3 = await fetch(startUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      console.log(`📊 Response Status: ${response3.status} ${response3.statusText}`);
      
      if (!response3.ok) {
        const errorText = await response3.text().catch(() => '');
        console.log('❌ Error Response:', errorText);
      } else {
        const data3 = await response3.json();
        console.log('✅ Success Response:', JSON.stringify(data3, null, 2));
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }

    // =================================================================
    // 4. TEST START ACTION ON FAILING QUESTION
    // =================================================================
    console.log('\n4️⃣ Testing Start Action on Failing Question...');
    
    const startFailingUrl = `${baseUrl}?action=start&question_id=${failingQuestionId}&candidate_id=${candidateId}&template_id=lt-0cb8327cecfab4c8f&duration=88&token=${token}&_t=${Date.now()}`;
    
    console.log('🔗 Start Request URL:');
    console.log(startFailingUrl.replace(token, 'TOKEN_HIDDEN'));
    
    try {
      const response4 = await fetch(startFailingUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      console.log(`📊 Response Status: ${response4.status} ${response4.statusText}`);
      
      if (!response4.ok) {
        const errorText = await response4.text().catch(() => '');
        console.log('❌ Error Response:', errorText);
      } else {
        const data4 = await response4.json();
        console.log('✅ Success Response:', JSON.stringify(data4, null, 2));
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }

    console.log('\n🎯 ANALYSIS:');
    console.log('Compare the responses above to understand:');
    console.log('1. Whether the Lambda is responding at all');
    console.log('2. If specific template IDs are causing issues');
    console.log('3. Whether the token is working correctly');
    console.log('4. If there are differences between working/failing questions');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testNetworkLambda().catch(console.error);
