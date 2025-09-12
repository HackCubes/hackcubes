#!/usr/bin/env node

/**
 * Simple Migration Script: EC2 to Kubernetes
 * 
 * This script migrates existing challenges from AWS EC2 deployment to Kubernetes.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateToKubernetes() {
  console.log('🚀 Starting migration from EC2 to Kubernetes...\n');

  try {
    // 1. Check current challenges
    console.log('📊 Step 1: Analyzing current challenges...');
    
    const { data: currentChallenges, error: fetchError } = await supabase
      .from('questions')
      .select('id, name, template_id, instance_id, docker_image')
      .order('name');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`   📋 Found ${currentChallenges.length} total challenges`);
    
    const awsChallenges = currentChallenges.filter(q => q.template_id || q.instance_id);
    const dockerChallenges = currentChallenges.filter(q => q.docker_image && !q.template_id && !q.instance_id);
    const basicChallenges = currentChallenges.filter(q => !q.template_id && !q.instance_id && !q.docker_image);

    console.log(`   🔧 AWS challenges (template_id/instance_id): ${awsChallenges.length}`);
    console.log(`   🐳 Docker challenges: ${dockerChallenges.length}`);
    console.log(`   📝 Basic challenges (no infrastructure): ${basicChallenges.length}`);

    if (awsChallenges.length > 0) {
      console.log('\n   📋 AWS challenges to migrate:');
      awsChallenges.forEach(challenge => {
        console.log(`      - ${challenge.name} (${challenge.template_id || challenge.instance_id})`);
      });
    }

    // 2. Add deployment_type column if it doesn't exist
    console.log('\n📋 Step 2: Adding deployment_type column...');
    
    try {
      // Try to add the column - will fail if it already exists, which is fine
      await supabase.rpc('exec', { 
        sql: 'ALTER TABLE questions ADD COLUMN deployment_type VARCHAR(20) DEFAULT \'aws\';' 
      });
      console.log('   ✅ deployment_type column added successfully');
    } catch (error) {
      // Column likely already exists
      console.log('   ℹ️  deployment_type column likely already exists');
    }

    // 3. Update challenges directly using Supabase client
    console.log('\n🔄 Step 3: Updating deployment types...');

    // Update AWS challenges to Kubernetes
    if (awsChallenges.length > 0) {
      for (const challenge of awsChallenges) {
        const { error } = await supabase
          .from('questions')
          .update({ deployment_type: 'kubernetes' })
          .eq('id', challenge.id);
        
        if (error) {
          console.error(`   ❌ Error updating ${challenge.name}:`, error);
        } else {
          console.log(`   ✅ Migrated: ${challenge.name}`);
        }
      }
    }

    // Update Docker challenges to Kubernetes
    if (dockerChallenges.length > 0) {
      for (const challenge of dockerChallenges) {
        const { error } = await supabase
          .from('questions')
          .update({ deployment_type: 'kubernetes' })
          .eq('id', challenge.id);
        
        if (error) {
          console.error(`   ❌ Error updating ${challenge.name}:`, error);
        }
      }
      console.log(`   ✅ Updated ${dockerChallenges.length} Docker challenges to Kubernetes`);
    }

    // Update basic challenges to 'none'
    if (basicChallenges.length > 0) {
      for (const challenge of basicChallenges) {
        const { error } = await supabase
          .from('questions')
          .update({ deployment_type: 'none' })
          .eq('id', challenge.id);
        
        if (error) {
          console.error(`   ❌ Error updating ${challenge.name}:`, error);
        }
      }
      console.log(`   ✅ Updated ${basicChallenges.length} basic challenges to 'none'`);
    }

    // 4. Verify results
    console.log('\n🔍 Step 4: Verifying migration results...');
    
    const { data: updatedChallenges, error: verifyError } = await supabase
      .from('questions')
      .select('deployment_type')
      .order('deployment_type');

    if (verifyError) {
      console.error('Error verifying results:', verifyError);
    } else {
      const summary = updatedChallenges.reduce((acc, challenge) => {
        acc[challenge.deployment_type || 'undefined'] = (acc[challenge.deployment_type || 'undefined'] || 0) + 1;
        return acc;
      }, {});

      console.log('   📊 Final distribution:');
      Object.entries(summary).forEach(([type, count]) => {
        console.log(`      - ${type}: ${count} challenges`);
      });
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Configure your EKS cluster details in .env.local');
    console.log('   2. Set up kubectl with AWS CLI authentication');
    console.log('   3. Test challenge instance creation with Kubernetes');
    console.log('   4. Follow the EKS_SETUP_GUIDE.md for detailed configuration');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your Supabase connection');
    console.log('   2. Ensure you have admin privileges');
    console.log('   3. Verify your .env.local configuration');
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateToKubernetes();
}

module.exports = { migrateToKubernetes }; 