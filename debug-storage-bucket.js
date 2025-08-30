require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugStorageBucket() {
  console.log('🔍 Debugging storage bucket issues...');
  
  // Create service role client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('\n1. Checking if storage buckets exist...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
    } else {
      console.log('✅ Found buckets:', buckets.map(b => b.name));
      
      const assessmentReportsBucket = buckets.find(b => b.name === 'assessment-reports');
      if (assessmentReportsBucket) {
        console.log('✅ assessment-reports bucket exists:', assessmentReportsBucket);
      } else {
        console.log('❌ assessment-reports bucket NOT found');
      }
    }

    console.log('\n2. Trying to create assessment-reports bucket...');
    const { data: createData, error: createError } = await supabase.storage.createBucket('assessment-reports', {
      public: true,
      allowedMimeTypes: ['application/pdf'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
      } else {
        console.error('❌ Error creating bucket:', createError);
      }
    } else {
      console.log('✅ Bucket created successfully:', createData);
    }

    console.log('\n3. Checking files in the bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('assessment-reports')
      .list('reports', { limit: 100 });

    if (filesError) {
      console.error('❌ Error listing files:', filesError);
    } else {
      console.log('✅ Files in bucket:', files?.length || 0);
      if (files && files.length > 0) {
        console.log('📄 Sample files:', files.slice(0, 3));
      }
    }

    console.log('\n4. Testing specific file access...');
    const testFilePath = 'reports/533d4e96-fe35-4540-9798-162b3f261572/1a8ceff6-8cf8-4cdf-9e42-b7f7b0acd1ce/1756577986374_John_Doe_HCJPT_Certificate.pdf';
    
    const { data: fileExists } = await supabase.storage
      .from('assessment-reports')
      .list('reports/533d4e96-fe35-4540-9798-162b3f261572/1a8ceff6-8cf8-4cdf-9e42-b7f7b0acd1ce');

    console.log('Files in specific path:', fileExists);

    // Try to get public URL
    const { data: publicURL } = supabase.storage
      .from('assessment-reports')
      .getPublicUrl(testFilePath);

    console.log('Public URL:', publicURL.publicUrl);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugStorageBucket();
