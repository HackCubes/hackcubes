const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function findEnrollments() {
  console.log('🔍 Finding enrollments for assessment...\n');
  
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  
  try {
    // Get all enrollments for this assessment
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('assessment_id', assessmentId);
    
    if (error) {
      console.error('❌ Error fetching enrollments:', error);
      return;
    }
    
    if (!enrollments || enrollments.length === 0) {
      console.log('❌ No enrollments found for this assessment');
      return;
    }
    
    console.log(`✅ Found ${enrollments.length} enrollment(s):`);
    enrollments.forEach((enrollment, index) => {
      console.log(`\n${index + 1}. Enrollment ID: ${enrollment.id}`);
      console.log(`   Candidate ID: ${enrollment.candidate_id}`);
      console.log(`   Status: ${enrollment.status}`);
      console.log(`   Current Score: ${enrollment.current_score}`);
      console.log(`   Final Score: ${enrollment.final_score}`);
      console.log(`   Started At: ${enrollment.started_at}`);
      console.log(`   Completed At: ${enrollment.completed_at}`);
    });
    
    // Check flag submissions for each enrollment
    for (const enrollment of enrollments) {
      console.log(`\n🏁 Flag submissions for enrollment ${enrollment.id}:`);
      
      const { data: flagSubs } = await supabase
        .from('flag_submissions')
        .select('*')
        .eq('enrollment_id', enrollment.id);
      
      console.log(`   Modern flag submissions: ${flagSubs?.length || 0}`);
      
      const { data: userFlagSubs } = await supabase
        .from('user_flag_submissions')
        .select('*')
        .eq('enrollment_id', enrollment.id);
      
      console.log(`   Legacy flag submissions: ${userFlagSubs?.length || 0}`);
      
      // Check modern submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('candidate_id', enrollment.candidate_id);
      
      console.log(`   Modern submissions: ${submissions?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findEnrollments();
