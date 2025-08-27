// Simple test script to check assessments
require('dotenv').config();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('assessments')
      .select('id, name')
      .limit(1);
      
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('Sample assessment:', data?.[0] || 'No assessments found');
    
    if (data && data.length > 0) {
      const assessmentId = data[0].id;
      console.log(`\n🔗 Test URLs:`);
      console.log(`   Welcome: http://localhost:3000/assessments/${assessmentId}`);
      console.log(`   Questions: http://localhost:3000/assessments/${assessmentId}/questions`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabase();
