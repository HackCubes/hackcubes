const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInstanceManagement() {
  console.log('🚀 Testing Instance Management API...\n');

  try {
    // Get one of our web challenges to test
    const { data: challenges, error } = await supabase
      .from('questions')
      .select('id, name, docker_image, category')
      .eq('category', 'Web Security')
      .eq('name', 'AchieveRewards')
      .single();

    if (error) {
      console.error('❌ Error fetching challenge:', error.message);
      return;
    }

    console.log(`🎯 Testing with challenge: ${challenges.name}`);
    console.log(`   Docker Image: ${challenges.docker_image}`);
    console.log(`   Challenge ID: ${challenges.id}\n`);

    // Test instance management API
    const testInstanceData = {
      action: 'start',
      questionId: challenges.id,
      candidateId: 'test-candidate-123',
      username: 'testuser',
      question: challenges
    };

    console.log('📡 Making API request to /api/network-instance...');
    
    // Construct query string parameters for GET request
    const params = new URLSearchParams({
      action: 'start',
      question_id: challenges.id,
      candidate_id: 'test-candidate-123',
      username: 'testuser'
    });

    const response = await fetch(`http://localhost:3000/api/network-instance?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    console.log(`🔄 API Response Status: ${response.status}`);
    console.log('📋 API Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.status === 'running') {
      console.log('\n✅ Instance management API is working!');
      if (result.ip) {
        console.log(`🌐 Instance IP: ${result.ip}`);
        console.log(`🏠 Instance ID: ${result.instance_id}`);
        
        // Test challenge access URL
        if (result.ip !== 'pending') {
          const challengeUrl = `http://${result.ip}:5000`;
          console.log(`🔗 Challenge URL: ${challengeUrl}`);
          
          console.log('\n⏳ Waiting 30 seconds for instance to be ready...');
          await new Promise(resolve => setTimeout(resolve, 30000));
          
          try {
            console.log('🧪 Testing challenge accessibility...');
            const challengeResponse = await fetch(challengeUrl, { 
              timeout: 10000,
              signal: AbortSignal.timeout(10000)
            });
            
            if (challengeResponse.ok) {
              console.log('✅ Challenge is accessible!');
            } else {
              console.log(`⚠️ Challenge returned status: ${challengeResponse.status}`);
            }
          } catch (fetchError) {
            console.log(`⚠️ Challenge not yet accessible: ${fetchError.message}`);
            console.log('   This is normal - the container may still be starting');
          }
        }
      }
    } else {
      console.log('❌ Instance management API failed');
      if (result.error) {
        console.log('   Error:', result.error);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Add timeout handling for fetch
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testInstanceManagement();
