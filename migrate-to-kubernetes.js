#!/usr/bin/env node

/**
 * Migration Script: EC2 to Kubernetes
 * 
 * This script migrates existing challenges from AWS EC2 deployment to Kubernetes.
 * It updates the database to mark challenges as 'kubernetes' deployment type.
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
    // 1. Add deployment_type column if it doesn't exist
    console.log('📋 Step 1: Adding deployment_type column...');
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql_text: `
        ALTER TABLE questions 
        ADD COLUMN IF NOT EXISTS deployment_type VARCHAR(20) DEFAULT 'aws';
        
        COMMENT ON COLUMN questions.deployment_type IS 'Deployment backend: kubernetes, aws, or none';
      `
    });

    if (columnError) {
      console.log('   ⚠️  Column might already exist:', columnError.message);
    } else {
      console.log('   ✅ deployment_type column added successfully');
    }

    // 2. Check current challenge distribution
    console.log('\n📊 Step 2: Analyzing current challenges...');
    
    const { data: currentChallenges, error: fetchError } = await supabase
      .from('questions')
      .select('id, name, template_id, instance_id, docker_image, deployment_type')
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

    // 3. Migrate AWS challenges to Kubernetes
    console.log('\n🔄 Step 3: Migrating AWS challenges to Kubernetes...');
    
    if (awsChallenges.length > 0) {
      console.log('   📋 AWS challenges to migrate:');
      awsChallenges.forEach(challenge => {
        console.log(`      - ${challenge.name} (${challenge.template_id || challenge.instance_id})`);
      });

      const { error: migrateError } = await supabase.rpc('exec_sql', {
        sql_text: `
          UPDATE questions 
          SET deployment_type = 'kubernetes' 
          WHERE template_id IS NOT NULL 
             OR instance_id IS NOT NULL;
        `
      });

      if (migrateError) {
        throw migrateError;
      }

      console.log('   ✅ AWS challenges migrated to Kubernetes');
    } else {
      console.log('   ℹ️  No AWS challenges to migrate');
    }

    // 4. Set appropriate deployment types for remaining challenges
    console.log('\n📝 Step 4: Setting deployment types for other challenges...');
    
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql_text: `
        -- Set to 'kubernetes' for questions that have docker_image but no AWS identifiers
        UPDATE questions 
        SET deployment_type = 'kubernetes' 
        WHERE docker_image IS NOT NULL 
          AND docker_image != '' 
          AND template_id IS NULL 
          AND instance_id IS NULL
          AND deployment_type != 'kubernetes';

        -- Set to 'none' for questions that don't need infrastructure
        UPDATE questions 
        SET deployment_type = 'none' 
        WHERE (docker_image IS NULL OR docker_image = '') 
          AND template_id IS NULL 
          AND instance_id IS NULL
          AND deployment_type != 'none';
      `
    });

    if (updateError) {
      throw updateError;
    }

    console.log('   ✅ Deployment types updated successfully');

    // 5. Create index for performance
    console.log('\n📈 Step 5: Creating performance index...');
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_text: `
        CREATE INDEX IF NOT EXISTS idx_questions_deployment_type ON questions(deployment_type);
      `
    });

    if (indexError) {
      console.log('   ⚠️  Index might already exist:', indexError.message);
    } else {
      console.log('   ✅ Performance index created');
    }

    // 6. Create deployment info view
    console.log('\n📊 Step 6: Creating deployment info view...');
    
    const { error: viewError } = await supabase.rpc('exec_sql', {
      sql_text: `
        CREATE OR REPLACE VIEW challenge_deployment_info AS
        SELECT 
          q.id,
          q.name,
          q.deployment_type,
          q.docker_image,
          q.template_id,
          q.instance_id,
          CASE 
            WHEN q.deployment_type = 'kubernetes' THEN 'Kubernetes Cluster'
            WHEN q.deployment_type = 'aws' THEN 'AWS Lambda'
            ELSE 'No Infrastructure'
          END as deployment_backend,
          CASE 
            WHEN q.deployment_type = 'kubernetes' THEN COALESCE(q.docker_image, 'Auto-mapped from ' || COALESCE(q.template_id, q.instance_id))
            WHEN q.deployment_type = 'aws' THEN q.template_id
            ELSE 'N/A'
          END as deployment_config
        FROM questions q;
      `
    });

    if (viewError) {
      throw viewError;
    }

    console.log('   ✅ Deployment info view created');

    // 7. Final verification
    console.log('\n🔍 Step 7: Verifying migration results...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('challenge_deployment_info')
      .select('deployment_backend, count(*)')
      .then(async () => {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_text: `
            SELECT 
              deployment_type,
              COUNT(*) as count
            FROM questions 
            GROUP BY deployment_type 
            ORDER BY deployment_type;
          `
        });
        return { data, error };
      });

    if (verifyError) {
      throw verifyError;
    }

    console.log('   📊 Final distribution:');
    if (verifyData && Array.isArray(verifyData)) {
      verifyData.forEach(row => {
        console.log(`      - ${row.deployment_type}: ${row.count} challenges`);
      });
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Configure your EKS cluster details in .env.local');
    console.log('   2. Set up kubectl with AWS CLI authentication');
    console.log('   3. Test challenge instance creation with Kubernetes');
    console.log('   4. Update any hardcoded template_id references in your frontend');

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