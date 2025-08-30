const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBucket() {
  try {
    console.log('🚀 Setting up Supabase Storage bucket for assessment reports...');

    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const bucketExists = existingBuckets.some(bucket => bucket.name === 'assessment-reports');
    
    if (bucketExists) {
      console.log('✅ Bucket "assessment-reports" already exists');
    } else {
      // Create the bucket
      const { data: createData, error: createError } = await supabase.storage.createBucket('assessment-reports', {
        public: false, // Make it private by default
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 52428800, // 50MB in bytes
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }

      console.log('✅ Successfully created bucket "assessment-reports"');
    }

    // Set up RLS policies for the bucket
    console.log('🔐 Setting up storage policies...');

    // Create policy to allow authenticated users to upload their own reports
    const uploadPolicy = `
      CREATE POLICY "Users can upload their own reports" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'assessment-reports' AND
        (storage.foldername(name))[1] = 'reports' AND
        auth.uid()::text = (storage.foldername(name))[3]
      );
    `;

    // Create policy to allow users to read their own reports
    const readPolicy = `
      CREATE POLICY "Users can read their own reports" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'assessment-reports' AND
        (storage.foldername(name))[1] = 'reports' AND
        auth.uid()::text = (storage.foldername(name))[3]
      );
    `;

    // Create policy for admins to read all reports
    const adminReadPolicy = `
      CREATE POLICY "Admins can read all reports" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'assessment-reports' AND
        (auth.jwt() ->> 'role') = 'admin'
      );
    `;

    try {
      // Execute policies (they might already exist, so we'll catch errors)
      await supabase.rpc('exec_sql', { sql: uploadPolicy });
      console.log('✅ Upload policy created');
    } catch (error) {
      console.log('ℹ️ Upload policy might already exist');
    }

    try {
      await supabase.rpc('exec_sql', { sql: readPolicy });
      console.log('✅ Read policy created');
    } catch (error) {
      console.log('ℹ️ Read policy might already exist');
    }

    try {
      await supabase.rpc('exec_sql', { sql: adminReadPolicy });
      console.log('✅ Admin read policy created');
    } catch (error) {
      console.log('ℹ️ Admin read policy might already exist');
    }

    console.log('🎉 Storage bucket setup complete!');
    console.log('\nBucket details:');
    console.log('- Name: assessment-reports');
    console.log('- Access: Private (authenticated users only)');
    console.log('- File types: PDF only');
    console.log('- Size limit: 50MB');
    console.log('- Structure: reports/{assessmentId}/{enrollmentId}/{timestamp}_{filename}.pdf');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
setupStorageBucket();
