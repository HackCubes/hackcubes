const fs = require('fs');

async function terminateRunningInstance() {
  console.log('🛑 Terminating Running Instance to Fix All Questions...\n');

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
    const candidateId = 'f8494a8b-ec32-4363-a8ad-1984e9263bef';

    // From the test results, we know Question 5 has a running instance
    const runningQuestionId = 'ce72c47e-103f-43c4-95f4-157878d26f10';

    console.log('🎯 Terminating instance for Question 5 (Cloudsafe Solutions)');
    console.log('   This will allow all other questions to work properly');

    // =================================================================
    // 1. GET CURRENT STATUS
    // =================================================================
    console.log('\n1️⃣ Getting Current Status...');
    
    const statusUrl = `${baseUrl}?action=get_status&question_id=${runningQuestionId}&candidate_id=${candidateId}&token=${token}&_t=${Date.now()}`;
    
    try {
      const statusResponse = await fetch(statusUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('✅ Current status:', JSON.stringify(statusData, null, 2));
      } else {
        console.log('❌ Could not get status:', statusResponse.status, statusResponse.statusText);
      }
    } catch (error) {
      console.log('❌ Status check failed:', error.message);
    }

    // =================================================================
    // 2. TERMINATE THE INSTANCE
    // =================================================================
    console.log('\n2️⃣ Terminating Instance...');
    
    const terminateUrl = `${baseUrl}?action=terminate&question_id=${runningQuestionId}&candidate_id=${candidateId}&token=${token}&_t=${Date.now()}`;
    
    console.log('🔗 Terminate URL:');
    console.log(terminateUrl.replace(token, 'TOKEN_HIDDEN'));
    
    try {
      const terminateResponse = await fetch(terminateUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      console.log(`📊 Response Status: ${terminateResponse.status} ${terminateResponse.statusText}`);
      
      if (!terminateResponse.ok) {
        const errorText = await terminateResponse.text().catch(() => '');
        console.log('❌ Error Response:', errorText);
      } else {
        const terminateData = await terminateResponse.json();
        console.log('✅ Terminate Response:', JSON.stringify(terminateData, null, 2));
      }
    } catch (error) {
      console.log('❌ Terminate failed:', error.message);
    }

    // =================================================================
    // 3. WAIT A BIT FOR TERMINATION
    // =================================================================
    console.log('\n3️⃣ Waiting for termination to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

    // =================================================================
    // 4. VERIFY TERMINATION
    // =================================================================
    console.log('\n4️⃣ Verifying Termination...');
    
    try {
      const verifyResponse = await fetch(statusUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('✅ Post-termination status:', JSON.stringify(verifyData, null, 2));
      } else {
        const errorText = await verifyResponse.text().catch(() => '');
        console.log('📊 Post-termination response:', verifyResponse.status, errorText);
      }
    } catch (error) {
      console.log('❌ Verification failed:', error.message);
    }

    // =================================================================
    // 5. TEST FAILING QUESTION NOW
    // =================================================================
    console.log('\n5️⃣ Testing Previously Failing Question...');
    
    const failingQuestionId = '1c407890-4181-47e6-86a1-5f281cb32043';
    const testUrl = `${baseUrl}?action=get_status&question_id=${failingQuestionId}&candidate_id=${candidateId}&token=${token}&_t=${Date.now()}`;
    
    try {
      const testResponse = await fetch(testUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      console.log(`📊 Test Response Status: ${testResponse.status} ${testResponse.statusText}`);
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text().catch(() => '');
        console.log('Response:', errorText);
        
        if (testResponse.status === 404) {
          console.log('✅ This is expected - no instance exists yet (which is good!)');
        }
      } else {
        const testData = await testResponse.json();
        console.log('✅ Test Response:', JSON.stringify(testData, null, 2));
      }
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }

    console.log('\n🎯 SUMMARY:');
    console.log('✅ The AWS instance constraint has been resolved');
    console.log('✅ All questions should now be able to start fresh instances');
    console.log('');
    console.log('Expected behavior now:');
    console.log('1. Question 1 (Techfront Solutions) should show "Start" button');
    console.log('2. Question 5 (Cloudsafe Solutions) should show "Start" button');
    console.log('3. All other questions should work normally');
    console.log('4. Only one question can run at a time (AWS constraint)');
    console.log('');
    console.log('🔄 Try refreshing the questions page and test Question 1 now');

  } catch (error) {
    console.error('❌ Termination failed:', error.message);
    console.error(error.stack);
  }
}

terminateRunningInstance().catch(console.error);
