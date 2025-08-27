const { createClient } = require('@supabase/supabase-js');

// Test script to validate assessment routing and data access
async function testAssessmentAccess() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🔍 Testing assessment access...');

    // Find an assessment with imported challenges
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, name, status')
      .eq('status', 'ACTIVE')
      .limit(5);

    if (assessmentError) {
      console.error('❌ Error fetching assessments:', assessmentError);
      return;
    }

    if (!assessments || assessments.length === 0) {
      console.log('⚠️  No active assessments found');
      return;
    }

    const testAssessment = assessments[0];
    console.log(`📋 Testing assessment: ${testAssessment.name} (ID: ${testAssessment.id})`);

    // Test the same query that would be made from the frontend
    const { data: assessmentData, error: fetchError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', testAssessment.id)
      .single();

    if (fetchError) {
      console.error(`❌ Error fetching assessment data:`, fetchError);
      return;
    }

    console.log('✅ Assessment data fetched successfully');
    console.log(`   Name: ${assessmentData.name}`);
    console.log(`   Duration: ${assessmentData.duration_in_minutes} minutes`);
    console.log(`   Max Score: ${assessmentData.max_score || 'Not set'}`);

    // Test sections and questions
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('id, name')
      .eq('assessment_id', testAssessment.id);

    if (sectionsError) {
      console.error('❌ Error fetching sections:', sectionsError);
      return;
    }

    console.log(`📝 Found ${sections?.length || 0} sections`);

    if (sections && sections.length > 0) {
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, name, template_id, instance_id')
        .in('section_id', sections.map(s => s.id));

      if (questionsError) {
        console.error('❌ Error fetching questions:', questionsError);
        return;
      }

      console.log(`❓ Found ${questions?.length || 0} questions`);
      
      const instanceQuestions = questions?.filter(q => q.template_id || q.instance_id) || [];
      console.log(`🖥️  ${instanceQuestions.length} questions have instance support`);

      if (instanceQuestions.length > 0) {
        console.log('   Instance questions:');
        instanceQuestions.forEach(q => {
          console.log(`   - ${q.name} (template: ${q.template_id || 'none'}, instance: ${q.instance_id || 'none'})`);
        });
      }
    }

    console.log('\n🎉 Assessment access test completed successfully!');
    console.log(`   The assessment ID ${testAssessment.id} should be accessible at:`);
    console.log(`   http://localhost:3000/assessments/${testAssessment.id}`);
    console.log(`   http://localhost:3000/assessments/${testAssessment.id}/questions`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAssessmentAccess().then(() => {
  console.log('\n✨ Test completed');
}).catch(error => {
  console.error('💥 Test script error:', error);
});
