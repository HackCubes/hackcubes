const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log('🔍 Checking database for assessments and enrollments...\n');
  
  try {
    // Check assessments
    console.log('1. Checking assessments...');
    const { data: assessments, error: assessError } = await supabase
      .from('assessments')
      .select('id, name, title')
      .limit(5);
    
    if (assessError) {
      console.error('❌ Error fetching assessments:', assessError);
    } else {
      console.log(`✅ Found ${assessments?.length || 0} assessments:`);
      assessments?.forEach(a => {
        console.log(`   - ${a.id}: ${a.name || a.title}`);
      });
    }
    
    // Check enrollments
    console.log('\n2. Checking enrollments...');
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, assessment_id, candidate_id, status')
      .limit(5);
    
    if (enrollError) {
      console.error('❌ Error fetching enrollments:', enrollError);
    } else {
      console.log(`✅ Found ${enrollments?.length || 0} enrollments:`);
      enrollments?.forEach(e => {
        console.log(`   - ${e.id}: Assessment ${e.assessment_id}, Candidate ${e.candidate_id}, Status: ${e.status}`);
      });
    }
    
    // Check flag submissions
    console.log('\n3. Checking flag submissions...');
    const { data: flagSubs, error: flagError } = await supabase
      .from('flag_submissions')
      .select('id, enrollment_id, is_correct, score')
      .limit(5);
    
    if (flagError) {
      console.error('❌ Error fetching flag submissions:', flagError);
    } else {
      console.log(`✅ Found ${flagSubs?.length || 0} flag submissions:`);
      flagSubs?.forEach(f => {
        console.log(`   - ${f.id}: Enrollment ${f.enrollment_id}, Correct: ${f.is_correct}, Score: ${f.score}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabase();
