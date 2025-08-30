require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixBucketAndTestUrl() {
  console.log('🔧 Fixing bucket configuration and testing URLs...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // First, make sure the bucket is public
    console.log('1. Making bucket public...');
    const { data: updateData, error: updateError } = await supabase.storage.updateBucket('assessment-reports', {
      public: true
    });
    
    if (updateError) {
      console.log('Bucket update result:', updateError.message);
    } else {
      console.log('✅ Bucket made public');
    }

    // Check current bucket configuration
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucket = buckets.find(b => b.name === 'assessment-reports');
    console.log('Current bucket config:', bucket);

    // Test the correct path
    const correctPath = 'reports/533d4e96-fe35-4540-9798-162b3f261572/1756577986374_John_Doe_HCJPT_Certificate.pdf';
    
    console.log('\n2. Testing file access...');
    const { data: publicUrl } = supabase.storage
      .from('assessment-reports')
      .getPublicUrl(correctPath);
    
    console.log('Generated URL:', publicUrl.publicUrl);
    
    // Test if URL is accessible
    const response = await fetch(publicUrl.publicUrl);
    console.log('URL Status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ File is accessible!');
    } else if (response.status === 400) {
      console.log('❌ Status 400 - Might be bucket configuration issue');
      
      // Try with signed URL instead
      console.log('\n3. Trying signed URL...');
      const { data: signedUrl, error: signError } = await supabase.storage
        .from('assessment-reports')
        .createSignedUrl(correctPath, 3600); // 1 hour expiry
      
      if (signError) {
        console.error('Signed URL error:', signError);
      } else {
        console.log('Signed URL:', signedUrl.signedUrl);
        const signedResponse = await fetch(signedUrl.signedUrl);
        console.log('Signed URL Status:', signedResponse.status);
        if (signedResponse.status === 200) {
          console.log('✅ Signed URL works! File exists but bucket is not public');
        }
      }
    } else {
      console.log('❌ Unexpected status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixBucketAndTestUrl();
