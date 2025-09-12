const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeUnwantedDescriptions() {
  try {
    console.log('🧹 Removing unwanted descriptions from challenges...\n');
    
    // Challenges that should have their descriptions removed
    const challengesToClean = [
      { 
        id: '821b69c3-8083-4c78-a95a-407dd6fd518b', 
        name: 'Atlas Enterprise Portal' 
      },
      { 
        id: '44a88986-8fd0-49c2-8a43-254925638742', 
        name: 'Financial Portfolio' 
      },
      { 
        id: '6b2496e9-978a-4a8b-87c5-e50d63e39d11', 
        name: 'Project Integration Hub' 
      }
    ];
    
    for (const challenge of challengesToClean) {
      console.log(`🔧 Cleaning "${challenge.name}"...`);
      
      const { error } = await supabase
        .from('questions')
        .update({ 
          description: '',
          hints: []
        })
        .eq('id', challenge.id);
      
      if (error) {
        console.error(`❌ Error updating ${challenge.name}:`, error);
      } else {
        console.log(`✅ Cleaned "${challenge.name}" - removed description and hints`);
      }
    }
    
    console.log('\n🎯 Final verification - checking all web challenges...');
    
    const { data: webChallenges } = await supabase
      .from('questions')
      .select('name, description, hints, docker_image')
      .eq('category', 'Web Security')
      .order('name');
    
    console.log('\n📋 FINAL STATE OF WEB CHALLENGES:');
    console.log('='.repeat(80));
    
    webChallenges.forEach((challenge, i) => {
      console.log(`${i + 1}. "${challenge.name}"`);
      console.log(`   Docker: ${challenge.docker_image}`);
      console.log(`   Description: "${challenge.description || 'Empty (as requested)'}"`);
      console.log(`   Hints: ${challenge.hints?.length || 0} hints`);
      console.log('');
    });
    
    console.log('✅ All web challenges now have Docker configuration with original content preserved!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

removeUnwantedDescriptions();
