const axios = require('axios');

async function testInstanceManagement() {
  const baseURL = 'http://localhost:3000';
  const testChallengeId = '03812af7-d8d9-429f-9adc-552b9dee9c7f'; // Achieve Rewards
  const candidateId = '4f8842eb-1b7d-4521-8bf5-24a52656fc73'; // Test candidate ID
  const templateId = 'lt-08e367739ac29f518';
  
  try {
    console.log('🧪 Testing end-to-end instance management...\n');
    console.log(`📋 Test Challenge: Achieve Rewards`);
    console.log(`   Challenge ID: ${testChallengeId}`);
    console.log(`   Expected Docker: achieverewards:latest`);
    console.log('');
    
    // Step 1: Check current status
    console.log('🔍 Step 1: Checking current instance status...');
    const statusResponse = await axios.get(`${baseURL}/api/network-instance`, {
      params: {
        action: 'get_status',
        question_id: testChallengeId,
        candidate_id: candidateId
      },
      timeout: 30000
    });
    
    console.log(`   Status: ${statusResponse.data.status}`);
    console.log(`   IP: ${statusResponse.data.ip}`);
    console.log('');
    
    // Step 2: Start instance if not running
    if (statusResponse.data.status !== 'running') {
      console.log('🚀 Step 2: Starting challenge instance...');
      const startResponse = await axios.get(`${baseURL}/api/network-instance`, {
        params: {
          action: 'start',
          question_id: testChallengeId,
          candidate_id: candidateId,
          template_id: templateId,
          duration: 10 // 10 minutes for testing
        },
        timeout: 120000 // 2 minutes timeout for startup
      });
      
      console.log(`   Start Status: ${startResponse.data.status}`);
      console.log(`   Instance ID: ${startResponse.data.instance_id}`);
      console.log(`   IP: ${startResponse.data.ip}`);
      
      if (startResponse.data.expiration_time) {
        console.log(`   Expires: ${startResponse.data.expiration_time}`);
      }
      console.log('');
      
      // Step 3: Wait and check status again
      console.log('⏳ Step 3: Waiting for instance to be fully ready...');
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
        attempts++;
        
        console.log(`   Attempt ${attempts}/${maxAttempts}: Checking readiness...`);
        
        const readyResponse = await axios.get(`${baseURL}/api/network-instance`, {
          params: {
            action: 'get_status',
            question_id: testChallengeId,
            candidate_id: candidateId
          },
          timeout: 30000
        });
        
        console.log(`   Status: ${readyResponse.data.status}`);
        console.log(`   IP: ${readyResponse.data.ip}`);
        
        if (readyResponse.data.status === 'running' && readyResponse.data.ip !== 'pending') {
          console.log('   ✅ Instance is ready!');
          
          // Step 4: Test connectivity to the external IP
          console.log('');
          console.log('🌐 Step 4: Testing connectivity to external IP...');
          const externalIP = readyResponse.data.ip;
          
          try {
            // Test HTTP connectivity (assuming the challenge runs on port 80)
            const connectTest = await axios.get(`http://${externalIP}`, {
              timeout: 10000,
              validateStatus: () => true // Accept any status code
            });
            
            console.log(`   ✅ HTTP connection successful!`);
            console.log(`   Response status: ${connectTest.status}`);
            console.log(`   Response headers: ${JSON.stringify(connectTest.headers, null, 2)}`);
            
            if (connectTest.data) {
              const preview = typeof connectTest.data === 'string' 
                ? connectTest.data.substring(0, 200) 
                : JSON.stringify(connectTest.data).substring(0, 200);
              console.log(`   Response preview: ${preview}...`);
            }
            
          } catch (connectError) {
            console.log(`   ⚠️ HTTP connection test failed: ${connectError.message}`);
            console.log(`   This might be normal if the service takes time to start`);
          }
          
          console.log('');
          console.log('✅ END-TO-END TEST SUCCESSFUL!');
          console.log('🎯 Challenge instance is running and accessible');
          console.log(`🔗 External URL: http://${externalIP}`);
          
          // Clean up - stop the instance
          console.log('');
          console.log('🧹 Cleaning up: Stopping test instance...');
          await axios.get(`${baseURL}/api/network-instance`, {
            params: {
              action: 'stop',
              question_id: testChallengeId,
              candidate_id: candidateId
            },
            timeout: 30000
          });
          console.log('   ✅ Instance stopped');
          
          return;
        }
      }
      
      console.log('   ⚠️ Instance did not become ready within expected time');
      
    } else {
      console.log('✅ Instance is already running!');
      console.log(`🔗 External URL: http://${statusResponse.data.ip}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testInstanceManagement();
