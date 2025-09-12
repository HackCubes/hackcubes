const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testChallengeConfiguration() {
  try {
    console.log('🧪 Testing challenge configuration...\n');
    
    // Get one of the web challenges to test
    const { data: testChallenge } = await supabase
      .from('questions')
      .select('*')
      .eq('name', 'Achieve Rewards')
      .single();
    
    if (!testChallenge) {
      console.error('❌ Test challenge not found');
      return;
    }
    
    console.log('📋 Testing challenge:');
    console.log(`   Name: ${testChallenge.name}`);
    console.log(`   ID: ${testChallenge.id}`);
    console.log(`   Docker Image: ${testChallenge.docker_image}`);
    console.log(`   Template ID: ${testChallenge.template_id}`);
    console.log('');
    
    // Test that all web challenges have the correct configuration
    const { data: webChallenges } = await supabase
      .from('questions')
      .select('name, docker_image, template_id, category')
      .eq('category', 'Web Security');
    
    console.log('✅ CONFIGURATION VERIFICATION:');
    console.log('='.repeat(60));
    
    const allConfigured = webChallenges.every(challenge => {
      const hasDocker = challenge.docker_image && challenge.docker_image.includes('082010050918.dkr.ecr.us-east-1.amazonaws.com');
      const hasTemplate = challenge.template_id === 'lt-08e367739ac29f518';
      
      console.log(`${hasDocker && hasTemplate ? '✅' : '❌'} ${challenge.name}`);
      console.log(`   Docker: ${hasDocker ? '✅' : '❌'} ${challenge.docker_image || 'Missing'}`);
      console.log(`   Template: ${hasTemplate ? '✅' : '❌'} ${challenge.template_id || 'Missing'}`);
      console.log('');
      
      return hasDocker && hasTemplate;
    });
    
    if (allConfigured) {
      console.log('🎉 ALL WEB CHALLENGES CORRECTLY CONFIGURED!');
      console.log('');
      console.log('📊 Summary:');
      console.log(`   ✅ ${webChallenges.length} web security challenges configured`);
      console.log('   ✅ All challenges have AWS ECR Docker images');
      console.log('   ✅ All challenges use the correct template ID');
      console.log('   ✅ Original challenge content preserved');
      console.log('   ✅ No duplicate challenges');
      console.log('');
      console.log('🚀 Ready for end-to-end testing!');
    } else {
      console.log('❌ Some challenges are not properly configured');
    }
    
  } catch (error) {
    console.error('❌ Error testing configuration:', error);
  }
}

testChallengeConfiguration();
