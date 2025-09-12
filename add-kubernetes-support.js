const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addKubernetesSupport() {
  console.log('🔧 Adding Kubernetes deployment support to questions table...\n');

  try {
    // Add deployment_type column
    const addColumnSQL = `
      -- Add deployment_type column if it doesn't exist
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'questions' 
          AND column_name = 'deployment_type'
        ) THEN
          ALTER TABLE questions 
          ADD COLUMN deployment_type VARCHAR(20) DEFAULT 'aws';
          
          COMMENT ON COLUMN questions.deployment_type IS 'Deployment backend: kubernetes, aws, or none';
          
          -- Add index for performance
          CREATE INDEX IF NOT EXISTS idx_questions_deployment_type ON questions(deployment_type);
          
          -- Set existing questions with docker_image to kubernetes
          UPDATE questions 
          SET deployment_type = 'kubernetes' 
          WHERE docker_image IS NOT NULL 
            AND docker_image != '';
            
          -- Set questions with template_id or instance_id to aws  
          UPDATE questions 
          SET deployment_type = 'aws' 
          WHERE template_id IS NOT NULL 
             OR instance_id IS NOT NULL;
             
          -- Set basic questions to none
          UPDATE questions 
          SET deployment_type = 'none' 
          WHERE (docker_image IS NULL OR docker_image = '') 
            AND template_id IS NULL 
            AND instance_id IS NULL;
        END IF;
      END $$;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql_text: addColumnSQL });

    if (error) {
      console.error('❌ Error adding deployment_type column:', error.message);
      return false;
    }

    console.log('✅ Successfully added deployment_type column to questions table');

    // Verify the column was added
    const { data: testData, error: testError } = await supabase
      .from('questions')
      .select('id, name, deployment_type')
      .limit(1);

    if (testError) {
      console.error('❌ Error verifying column:', testError.message);
      return false;
    }

    console.log('✅ Column verification successful');

    // Show distribution
    const { data: distribution, error: distError } = await supabase.rpc('exec_sql', {
      sql_text: `
        SELECT 
          deployment_type,
          COUNT(*) as count
        FROM questions 
        GROUP BY deployment_type
        ORDER BY count DESC;
      `
    });

    if (!distError && distribution && distribution.length > 0) {
      console.log('\n📊 Current deployment type distribution:');
      distribution.forEach(row => {
        console.log(`   ${row.deployment_type}: ${row.count} challenges`);
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Failed to add Kubernetes support:', error.message);
    return false;
  }
}

addKubernetesSupport();
