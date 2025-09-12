const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listAllChallenges() {
  try {
    console.log('🔍 Getting all challenges from questions table...\n');
    
    const { data: challenges, error } = await supabase
      .from('questions')
      .select('id, name, description, category, docker_image, template_id, updated_at')
      .order('name');
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`📊 Found ${challenges.length} total challenges\n`);
    
    // Separate by category
    const webChallenges = challenges.filter(c => c.category === 'Web Security');
    const networkChallenges = challenges.filter(c => c.category === 'Network Security');
    
    console.log('🌐 WEB SECURITY CHALLENGES:');
    console.log('='.repeat(80));
    webChallenges.forEach((challenge, i) => {
      console.log(`${i + 1}. Name: "${challenge.name}"`);
      console.log(`   ID: ${challenge.id}`);
      console.log(`   Docker: ${challenge.docker_image || 'NOT SET'}`);
      console.log(`   Template: ${challenge.template_id || 'NOT SET'}`);
      console.log(`   Updated: ${challenge.updated_at}`);
      console.log(`   Description: ${challenge.description || 'No description'}`);
      console.log('');
    });
    
    console.log('🔒 NETWORK SECURITY CHALLENGES:');
    console.log('='.repeat(80));
    networkChallenges.forEach((challenge, i) => {
      console.log(`${i + 1}. Name: "${challenge.name}"`);
      console.log(`   ID: ${challenge.id}`);
      console.log(`   Docker: ${challenge.docker_image || 'NOT SET'}`);
      console.log(`   Template: ${challenge.template_id || 'NOT SET'}`);
      console.log(`   Updated: ${challenge.updated_at}`);
      console.log(`   Description: ${challenge.description || 'No description'}`);
      console.log('');
    });
    
    // Check what we should expect for the 6 web challenges
    console.log('🎯 TARGET WEB CHALLENGES ANALYSIS:');
    console.log('='.repeat(80));
    
    const expectedNames = [
      'Achieve Rewards',
      'TechCon Conference', 
      'TechCorp Corporate Portal'
    ];
    
    expectedNames.forEach(expectedName => {
      const found = webChallenges.filter(c => 
        c.name.toLowerCase().includes(expectedName.toLowerCase()) ||
        expectedName.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (found.length > 0) {
        console.log(`✅ Found matches for "${expectedName}":`);
        found.forEach(match => {
          console.log(`   - "${match.name}" (${match.docker_image ? 'HAS DOCKER' : 'NO DOCKER'})`);
        });
      } else {
        console.log(`❌ No matches found for "${expectedName}"`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listAllChallenges();
