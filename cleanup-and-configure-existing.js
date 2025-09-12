const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupAndConfigureExistingChallenges() {
  console.log('🧹 Cleaning up and configuring existing challenges only...\n');

  try {
    // 1. First, get all challenges to see what we have
    console.log('1️⃣ Checking existing challenges...');
    
    const { data: allChallenges, error: fetchError } = await supabase
      .from('questions')
      .select('id, name, description, docker_image')
      .eq('category', 'Web Security')
      .order('name');

    if (fetchError) {
      console.error('❌ Error fetching challenges:', fetchError.message);
      return;
    }

    console.log(`Found ${allChallenges.length} web security challenges:`);
    allChallenges.forEach(challenge => {
      console.log(`   📋 ${challenge.name} (ID: ${challenge.id.substring(0, 8)}...)`);
    });

    // 2. Define the original challenges and their correct Docker images
    const originalChallenges = [
      {
        originalName: 'Achieve Rewards',
        dockerImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/achieverewards:latest'
      },
      {
        originalName: 'TechCon Conference', 
        dockerImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/conference:latest'
      },
      {
        originalName: 'TechCorp Corporate Portal',
        dockerImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/techcorp:latest'
      },
      {
        originalName: 'Atlas Enterprise Portal',
        dockerImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/atlas-frontend:latest'
      },
      {
        originalName: 'Financial Portfolio',
        dockerImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest'
      },
      {
        originalName: 'Project Integration Hub',
        dockerImage: '082010050918.dkr.ecr.us-east-1.amazonaws.com/integration-frontend:latest'
      }
    ];

    // 3. Remove duplicate challenges that I created
    console.log('\n2️⃣ Removing duplicate challenges...');
    
    const duplicatesToRemove = [
      'AchieveRewards',
      'TechCON Conference', 
      'TechCorp Portal'
    ];

    for (const duplicateName of duplicatesToRemove) {
      const { data: duplicates, error: findError } = await supabase
        .from('questions')
        .select('id, name')
        .eq('name', duplicateName);

      if (!findError && duplicates && duplicates.length > 0) {
        for (const duplicate of duplicates) {
          const { error: deleteError } = await supabase
            .from('questions')
            .delete()
            .eq('id', duplicate.id);

          if (deleteError) {
            console.error(`   ❌ Error deleting ${duplicate.name}:`, deleteError.message);
          } else {
            console.log(`   ✅ Removed duplicate: ${duplicate.name}`);
          }
        }
      }
    }

    // 4. Update existing challenges with Docker images only
    console.log('\n3️⃣ Configuring existing challenges with Docker images...');

    for (const challenge of originalChallenges) {
      const { data: existing, error: findError } = await supabase
        .from('questions')
        .select('id, name, description, hints')
        .eq('name', challenge.originalName)
        .single();

      if (findError) {
        console.log(`   ⚠️ Challenge "${challenge.originalName}" not found, skipping...`);
        continue;
      }

      // Only update the docker_image field, keep everything else unchanged
      const { error: updateError } = await supabase
        .from('questions')
        .update({
          docker_image: challenge.dockerImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`   ❌ Error updating ${challenge.originalName}:`, updateError.message);
      } else {
        console.log(`   ✅ Added Docker image to: ${challenge.originalName}`);
        console.log(`       Image: ${challenge.dockerImage}`);
      }
    }

    // 5. Verify final state
    console.log('\n4️⃣ Verifying final configuration...');
    
    const { data: finalChallenges, error: verifyError } = await supabase
      .from('questions')
      .select('id, name, docker_image')
      .eq('category', 'Web Security')
      .not('docker_image', 'is', null)
      .order('name');

    if (verifyError) {
      console.error('❌ Error verifying configuration:', verifyError.message);
      return;
    }

    console.log(`\n✅ Successfully configured ${finalChallenges.length} existing challenges:`);
    finalChallenges.forEach(challenge => {
      console.log(`   📋 ${challenge.name}`);
      console.log(`       Docker: ${challenge.docker_image.split('/').pop()}\n`);
    });

    console.log('🎯 Configuration complete! Your existing challenges now have:');
    console.log('   ✅ Original names, descriptions, and hints preserved');
    console.log('   ✅ Docker images configured for Kubernetes deployment');
    console.log('   ✅ No duplicate or modified content');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

cleanupAndConfigureExistingChallenges();
