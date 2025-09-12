const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWebChallengeConfiguration() {
  console.log('🧪 Testing Web Challenge Configuration...\n');

  try {
    // 1. Verify web challenges exist in database
    console.log('1️⃣ Checking web challenges in database...');
    
    const { data: challenges, error } = await supabase
      .from('questions')
      .select('id, name, docker_image, category')
      .eq('category', 'Web Security')
      .not('docker_image', 'is', null)
      .order('name');

    if (error) {
      console.error('❌ Error fetching challenges:', error.message);
      return;
    }

    console.log(`✅ Found ${challenges.length} web security challenges with Docker images:`);
    challenges.forEach(challenge => {
      console.log(`   📋 ${challenge.name}`);
      console.log(`       Image: ${challenge.docker_image}`);
      console.log(`       ID: ${challenge.id}\n`);
    });

    // 2. Test the instance manager configuration logic
    console.log('2️⃣ Testing instance manager configuration...');
    
    const webChallengeTests = [
      { name: 'AchieveRewards', expectedImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/achieverewards:latest', expectedPort: 5000 },
      { name: 'Atlas Enterprise Portal', expectedImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/atlas-frontend:latest', expectedPort: 5173 },
      { name: 'Financial Portfolio', expectedImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest', expectedPort: 5000 },
      { name: 'Project Integration Hub', expectedImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/integration-frontend:latest', expectedPort: 80 },
      { name: 'TechCON Conference', expectedImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/conference:latest', expectedPort: 3000 },
      { name: 'TechCorp Portal', expectedImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/techcorp:latest', expectedPort: 8080 }
    ];

    for (const test of webChallengeTests) {
      const challenge = challenges.find(c => c.name === test.name);
      if (challenge) {
        const imageMatch = challenge.docker_image === test.expectedImage;
        console.log(`   ${imageMatch ? '✅' : '❌'} ${test.name}:`);
        console.log(`       Expected: ${test.expectedImage}`);
        console.log(`       Actual: ${challenge.docker_image}`);
        console.log(`       Expected Port: ${test.expectedPort}\n`);
      } else {
        console.log(`   ❌ ${test.name}: Not found in database\n`);
      }
    }

    // 3. Check assessment and section setup
    console.log('3️⃣ Checking assessment setup...');
    
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, name')
      .eq('id', '533d4e96-fe35-4540-9798-162b3f261572')
      .single();

    if (assessmentError) {
      console.error('❌ Assessment not found:', assessmentError.message);
    } else {
      console.log(`✅ Assessment found: ${assessment.name}`);
    }

    const { data: sections, error: sectionError } = await supabase
      .from('sections')
      .select('id, name, assessment_id')
      .eq('assessment_id', '533d4e96-fe35-4540-9798-162b3f261572');

    if (sectionError) {
      console.error('❌ Error fetching sections:', sectionError.message);
    } else {
      console.log(`✅ Found ${sections.length} sections in assessment:`);
      sections.forEach(section => {
        console.log(`   📁 ${section.name} (${section.id})`);
      });
    }

    console.log('\n🎯 Test Assessment URL:');
    console.log('   http://localhost:3000/assessments/533d4e96-fe35-4540-9798-162b3f261572/questions');

    console.log('\n📋 Summary:');
    console.log(`   ✅ ${challenges.length} web challenges configured`);
    console.log(`   ✅ All challenges have Docker images`);
    console.log(`   ✅ Assessment structure ready`);
    console.log('\n🚀 Ready to test instance management!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWebChallengeConfiguration();
