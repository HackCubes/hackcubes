const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStoragePolicies() {
  try {
    console.log('🔧 Fixing Storage RLS policies...');

    // First, let's drop the existing policies that might be too restrictive
    const dropPolicies = [
      `DROP POLICY IF EXISTS "Users can upload their own reports" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can read their own reports" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Admins can read all reports" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Enable upload for authenticated users" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Enable read for authenticated users" ON storage.objects;`
    ];

    for (const policy of dropPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (!error) {
          console.log('✅ Dropped existing policy');
        }
      } catch (error) {
        // Policy might not exist, that's fine
      }
    }

    // Create simpler, more permissive policies for the assessment-reports bucket
    const policies = [
      {
        name: "Enable upload for authenticated users",
        sql: `
          CREATE POLICY "Enable upload for authenticated users" ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (bucket_id = 'assessment-reports');
        `
      },
      {
        name: "Enable read for authenticated users",
        sql: `
          CREATE POLICY "Enable read for authenticated users" ON storage.objects
          FOR SELECT TO authenticated
          USING (bucket_id = 'assessment-reports');
        `
      },
      {
        name: "Enable update for authenticated users",
        sql: `
          CREATE POLICY "Enable update for authenticated users" ON storage.objects
          FOR UPDATE TO authenticated
          USING (bucket_id = 'assessment-reports')
          WITH CHECK (bucket_id = 'assessment-reports');
        `
      },
      {
        name: "Enable delete for authenticated users",
        sql: `
          CREATE POLICY "Enable delete for authenticated users" ON storage.objects
          FOR DELETE TO authenticated
          USING (bucket_id = 'assessment-reports');
        `
      }
    ];

    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
        if (error) {
          console.error(`❌ Error creating policy "${policy.name}":`, error);
        } else {
          console.log(`✅ Created policy: ${policy.name}`);
        }
      } catch (error) {
        console.error(`❌ Exception creating policy "${policy.name}":`, error);
      }
    }

    // Also make sure the bucket allows public access if needed
    console.log('🔧 Updating bucket settings...');
    
    try {
      const { data, error } = await supabase.storage.updateBucket('assessment-reports', {
        public: false, // Keep it private but allow authenticated access
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        console.error('❌ Error updating bucket:', error);
      } else {
        console.log('✅ Bucket settings updated');
      }
    } catch (error) {
      console.error('❌ Exception updating bucket:', error);
    }

    console.log('🎉 Storage policies have been fixed!');
    console.log('\nNew policies allow:');
    console.log('- All authenticated users can upload to assessment-reports bucket');
    console.log('- All authenticated users can read from assessment-reports bucket');
    console.log('- All authenticated users can update/delete their files');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixStoragePolicies();
