const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyChallenges() {
  try {
    console.log('🔍 Checking current challenges in database...\n');
    
    // Get all challenges
    const { data: challenges, error } = await supabase
      .from('challenge_questions')
      .select('id, name, description, challenge_type, deployment_type, docker_image')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching challenges:', error);
      return;
    }
    
    console.log(`📊 Found ${challenges.length} challenges total\n`);
    
    // Group by challenge type
    const webChallenges = challenges.filter(c => c.challenge_type === 'web_security');
    const networkChallenges = challenges.filter(c => c.challenge_type === 'network_security');
    
    console.log('🌐 Web Security Challenges:');
    console.log('='.repeat(50));
    webChallenges.forEach(challenge => {
      console.log(`📋 Name: ${challenge.name}`);
      console.log(`   ID: ${challenge.id}`);
      console.log(`   Type: ${challenge.deployment_type || 'Not set'}`);
      console.log(`   Docker: ${challenge.docker_image || 'Not set'}`);
      console.log(`   Description: ${challenge.description?.substring(0, 100)}...`);
      console.log('');
    });
    
    console.log('🔒 Network Security Challenges:');
    console.log('='.repeat(50));
    networkChallenges.forEach(challenge => {
      console.log(`📋 Name: ${challenge.name}`);
      console.log(`   ID: ${challenge.id}`);
      console.log(`   Type: ${challenge.deployment_type || 'Not set'}`);
      console.log(`   Docker: ${challenge.docker_image || 'Not set'}`);
      console.log(`   Description: ${challenge.description?.substring(0, 100)}...`);
      console.log('');
    });
    
    // Check for specific duplicates
    const duplicateNames = [
      'AchieveRewards',
      'TechCON Conference', 
      'TechCorp Portal'
    ];
    
    console.log('🔎 Checking for duplicates of specific names:');
    console.log('='.repeat(50));
    
    for (const name of duplicateNames) {
      const matches = challenges.filter(c => 
        c.name === name || 
        c.name.includes(name) || 
        name.includes(c.name.replace(' ', ''))
      );
      
      if (matches.length > 0) {
        console.log(`🔍 Challenges matching "${name}":`);
        matches.forEach(match => {
          console.log(`   - "${match.name}" (ID: ${match.id})`);
        });
      } else {
        console.log(`✅ No duplicates found for "${name}"`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
}

verifyChallenges();
