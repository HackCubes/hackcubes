require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAvailableData() {
  console.log('🔍 Checking available data...\n');
  
  try {
    // Check all questions
    console.log('1. All questions:');
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .limit(10);
    console.log('Questions:', questions);
    
    // Check all flags
    console.log('\n2. All flags:');
    const { data: flags } = await supabase
      .from('flags')
      .select('*')
      .limit(10);
    console.log('Flags:', flags);
    
    // Check challenges
    console.log('\n3. All challenges:');
    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .limit(5);
    console.log('Challenges:', challenges);
    
    // Check assessments
    console.log('\n4. All assessments:');
    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .limit(5);
    console.log('Assessments:', assessments);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAvailableData();
