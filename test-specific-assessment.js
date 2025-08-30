require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSpecificAssessment() {
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  const testUserId = 'test-user-123'; // We'll use a test user ID
  
  console.log('🔍 Testing specific assessment:', assessmentId);
  
  try {
    // 1. Check assessment ID (we'll work with it directly)
    console.log('\n1. Using assessment ID:', assessmentId);
    
    // 2. Skip question checking for now, focus on submissions
    
    // 3. Check existing submissions for test user
    console.log('\n2. Checking existing submissions...');
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('user_id', testUserId);
    
    if (submissionsError) {
      console.log('❌ Error checking submissions:', submissionsError.message);
    } else {
      console.log(`📊 Found ${submissions.length} existing submissions`);
      if (submissions.length > 0) {
        console.log('   Submission details:');
        submissions.forEach(sub => {
          console.log(`   - Score: ${sub.total_score}, Status: ${sub.status}, Time: ${sub.submitted_at}`);
        });
      }
    }
    
    // 4. Check enrollments
    console.log('\n3. Checking enrollment...');
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('user_id', testUserId)
      .single();
    
    if (enrollmentError && enrollmentError.code !== 'PGRST116') {
      console.log('❌ Error checking enrollment:', enrollmentError.message);
    } else if (enrollment) {
      console.log('✅ Enrollment found - Score:', enrollment.total_score);
    } else {
      console.log('ℹ️  No enrollment found for test user');
    }
    
    // 5. Test the "Start Fresh" functionality
    console.log('\n4. Testing "Start Fresh" functionality...');
    
    // Clear submissions
    const { error: clearSubmissionsError } = await supabase
      .from('submissions')
      .delete()
      .eq('assessment_id', assessmentId)
      .eq('user_id', testUserId);
    
    if (clearSubmissionsError) {
      console.log('❌ Error clearing submissions:', clearSubmissionsError.message);
    } else {
      console.log('✅ Cleared submissions');
    }
    
    // Clear flag submissions
    const { error: clearFlagError } = await supabase
      .from('flag_submissions')
      .delete()
      .eq('assessment_id', assessmentId)
      .eq('user_id', testUserId);
    
    if (clearFlagError) {
      console.log('❌ Error clearing flag submissions:', clearFlagError.message);
    } else {
      console.log('✅ Cleared flag submissions');
    }
    
    // Reset enrollment score
    const { error: resetEnrollmentError } = await supabase
      .from('enrollments')
      .upsert({
        user_id: testUserId,
        assessment_id: assessmentId,
        total_score: 0,
        status: 'in_progress',
        enrolled_at: new Date().toISOString()
      });
    
    if (resetEnrollmentError) {
      console.log('❌ Error resetting enrollment:', resetEnrollmentError.message);
    } else {
      console.log('✅ Reset enrollment score to 0');
    }
    
    console.log('\n🎯 Assessment is ready for fresh testing!');
    console.log('Now test submitting flags manually on: http://localhost:3001/assessments/' + assessmentId);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSpecificAssessment();
