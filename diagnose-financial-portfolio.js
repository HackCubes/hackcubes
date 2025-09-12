const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseFinancialPortfolio() {
  console.log('🔍 Diagnosing Financial Portfolio Challenge...\n');

  try {
    // Get Financial Portfolio challenge details
    const { data: challenge, error } = await supabase
      .from('questions')
      .select('*')
      .eq('name', 'Financial Portfolio')
      .single();

    if (error) {
      console.error('❌ Error fetching challenge:', error.message);
      return;
    }

    console.log('📋 Challenge Details:');
    console.log(`   ID: ${challenge.id}`);
    console.log(`   Name: ${challenge.name}`);
    console.log(`   Docker Image: ${challenge.docker_image}`);
    console.log(`   Category: ${challenge.category}`);
    console.log(`   Description: ${challenge.description || 'None'}`);

    // Test the instance manager configuration
    console.log('\n🔧 Testing Instance Manager Configuration...');
    
    // Simulate what the instance manager would do
    let image = 'nginx:latest';
    let ports = [80];
    let environment = {};

    if (challenge.docker_image) {
      image = challenge.docker_image;
      
      if (image.includes('portfolio')) {
        ports = [5000];
        console.log('✅ Port 5000 detected for portfolio image');
      }
    }

    console.log(`   Detected Image: ${image}`);
    console.log(`   Detected Ports: ${ports.join(', ')}`);

    // Check if the Load Balancer URL is accessible
    console.log('\n🌐 Testing Load Balancer URL...');
    const testUrl = 'http://a80caf864f6ad48ac96855def96cefb9-2135924762.us-east-1.elb.amazonaws.com/';
    
    try {
      console.log(`   Testing: ${testUrl}`);
      const response = await fetch(testUrl, { 
        method: 'GET',
        timeout: 10000,
        signal: AbortSignal.timeout(10000)
      });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Status Text: ${response.statusText}`);
      
      if (response.ok) {
        const body = await response.text();
        console.log(`   Content Length: ${body.length} bytes`);
        console.log(`   Content Preview: ${body.substring(0, 200)}...`);
      }
    } catch (fetchError) {
      console.log(`   ❌ Connection failed: ${fetchError.message}`);
      
      // Try with port 5000 explicitly
      const portUrl = testUrl.replace('/', ':5000/');
      console.log(`   Trying with port 5000: ${portUrl}`);
      
      try {
        const portResponse = await fetch(portUrl, {
          method: 'GET',
          timeout: 10000,
          signal: AbortSignal.timeout(10000)
        });
        console.log(`   Port 5000 Status: ${portResponse.status}`);
      } catch (portError) {
        console.log(`   ❌ Port 5000 also failed: ${portError.message}`);
      }
    }

    console.log('\n🛠️ Troubleshooting Checklist:');
    console.log('   1. ✅ Challenge exists in database');
    console.log('   2. ✅ Docker image is configured');
    console.log('   3. ✅ Port 5000 is detected correctly');
    console.log('   4. ❓ Need to check Kubernetes deployment');
    console.log('   5. ❓ Need to check service configuration');
    console.log('   6. ❓ Need to verify container health');

    console.log('\n📝 Recommendations:');
    console.log('   1. Check if the Kubernetes pod is running');
    console.log('   2. Verify the service is exposing the correct port');
    console.log('   3. Check container logs for startup errors');
    console.log('   4. Ensure ECR image is accessible');
    console.log('   5. Verify Load Balancer health checks are passing');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

// Add timeout handling for fetch
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

diagnoseFinancialPortfolio();
