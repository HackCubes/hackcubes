require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function exploreExactFileStructure() {
  console.log('🔍 Exploring exact file structure...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // List all files in the bucket to see the full structure
    console.log('1. Listing all files in bucket...');
    
    // List from root
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('assessment-reports')
      .list('', { limit: 100 });
    
    if (rootError) {
      console.error('Root listing error:', rootError);
    } else {
      console.log('Root level contents:', rootFiles.map(f => f.name));
    }

    // List from reports folder
    const { data: reportsFiles, error: reportsError } = await supabase.storage
      .from('assessment-reports')
      .list('reports', { limit: 100 });
    
    if (reportsError) {
      console.error('Reports listing error:', reportsError);
    } else {
      console.log('Reports folder contents:', reportsFiles.map(f => f.name));
    }

    // List from specific assessment folder
    const { data: assessmentFiles, error: assessmentError } = await supabase.storage
      .from('assessment-reports')
      .list('reports/533d4e96-fe35-4540-9798-162b3f261572', { limit: 100 });
    
    if (assessmentError) {
      console.error('Assessment folder listing error:', assessmentError);
    } else {
      console.log('Assessment folder contents:', assessmentFiles);
      
      // Try to access the first file we find
      if (assessmentFiles.length > 0) {
        const firstFile = assessmentFiles[0];
        const fullPath = `reports/533d4e96-fe35-4540-9798-162b3f261572/${firstFile.name}`;
        
        console.log('\n2. Testing access to first file:', fullPath);
        
        const { data: publicUrl } = supabase.storage
          .from('assessment-reports')
          .getPublicUrl(fullPath);
        
        console.log('Public URL:', publicUrl.publicUrl);
        
        const response = await fetch(publicUrl.publicUrl);
        console.log('Status:', response.status);
        
        if (response.status === 200) {
          console.log('✅ SUCCESS! This file path works');
        } else {
          // Try signed URL
          const { data: signedUrl, error: signError } = await supabase.storage
            .from('assessment-reports')
            .createSignedUrl(fullPath, 3600);
          
          if (!signError) {
            console.log('Trying signed URL...');
            const signedResponse = await fetch(signedUrl.signedUrl);
            console.log('Signed URL Status:', signedResponse.status);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

exploreExactFileStructure();
