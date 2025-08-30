require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function findActualFiles() {
  console.log('🔍 Finding actual PDF files in the UUID folder...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // List files in the UUID subfolder
    const uuidFolder = 'reports/533d4e96-fe35-4540-9798-162b3f261572/1a8ceff6-8cf8-4cdf-9e42-b7f7b0acd1ce';
    
    console.log('Listing files in:', uuidFolder);
    
    const { data: files, error } = await supabase.storage
      .from('assessment-reports')
      .list(uuidFolder, { limit: 100 });
    
    if (error) {
      console.error('Error listing files:', error);
    } else {
      console.log('Files found:', files);
      
      if (files.length > 0) {
        // Test the first PDF file
        const firstFile = files.find(f => f.name.endsWith('.pdf'));
        if (firstFile) {
          const fullPath = `${uuidFolder}/${firstFile.name}`;
          console.log('\nTesting PDF file:', fullPath);
          
          const { data: publicUrl } = supabase.storage
            .from('assessment-reports')
            .getPublicUrl(fullPath);
          
          console.log('Public URL:', publicUrl.publicUrl);
          
          const response = await fetch(publicUrl.publicUrl);
          console.log('Status:', response.status);
          
          if (response.status === 200) {
            console.log('✅ SUCCESS! Found working file path');
            console.log('Content-Type:', response.headers.get('content-type'));
          } else {
            console.log('❌ Still not working, status:', response.status);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findActualFiles();
