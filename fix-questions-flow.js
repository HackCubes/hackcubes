const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function fixAssessmentFlow() {
  console.log('🔧 Fixing Assessment Flow Issues...\n');

  try {
    // Read environment variables
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
    const candidateId = 'f8494a8b-ec32-4363-a8ad-1984e9263bef';

    console.log('🎯 Assessment ID:', assessmentId);
    console.log('👤 Candidate ID:', candidateId);

    // =================================================================
    // 1. CREATE NEW SUBMISSION RECORD
    // =================================================================
    console.log('\n1️⃣ Creating New Submission Record...');
    
    // First check if submission already exists
    const { data: existingSubmissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('candidate_id', candidateId);

    if (existingSubmissions && existingSubmissions.length > 0) {
      console.log('✅ Submission already exists:', existingSubmissions[0].id);
      console.log('   Status:', existingSubmissions[0].status);
    } else {
      // Create new submission
      const submissionData = {
        assessment_id: assessmentId,
        candidate_id: candidateId,
        status: 'STARTED',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        current_score: 0,
        progress_percentage: 0.0
      };

      const { data: newSubmission, error: submissionError } = await supabase
        .from('submissions')
        .insert(submissionData)
        .select()
        .single();

      if (submissionError) {
        console.log('❌ Failed to create submission:', submissionError.message);
        return;
      } else {
        console.log('✅ Created new submission:', newSubmission.id);
      }
    }

    // =================================================================
    // 2. CHECK QUESTIONS AND TEMPLATES
    // =================================================================
    console.log('\n2️⃣ Checking Questions and Templates...');
    
    // Get all questions for this assessment
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, title, template_id, order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index');

    if (questionsError) {
      console.log('❌ Error fetching questions:', questionsError.message);
      return;
    }

    if (!questions || questions.length === 0) {
      console.log('❌ No questions found for this assessment');
      return;
    }

    console.log(`📊 Found ${questions.length} questions:`);
    
    const problemQuestionIds = [];
    const workingQuestionIds = [];
    
    questions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.title}`);
      console.log(`      ID: ${q.id}`);
      console.log(`      Template ID: ${q.template_id || 'MISSING!'}`);
      
      if (!q.template_id) {
        problemQuestionIds.push(q.id);
      } else {
        workingQuestionIds.push(q.id);
      }
    });

    // =================================================================
    // 3. ANALYZE THE WORKING QUESTION
    // =================================================================
    console.log('\n3️⃣ Analyzing Working Question (Question 5)...');
    
    const workingQuestionId = 'ce72c47e-103f-43c4-95f4-157878d26f10';
    const workingQuestion = questions.find(q => q.id === workingQuestionId);
    
    if (workingQuestion) {
      console.log('✅ Working question found:');
      console.log(`   Title: ${workingQuestion.title}`);
      console.log(`   Template ID: ${workingQuestion.template_id}`);
      console.log(`   Order: ${workingQuestion.order_index}`);
    }

    // =================================================================
    // 4. ANALYZE FAILING QUESTION
    // =================================================================
    console.log('\n4️⃣ Analyzing Failing Question (Question 1)...');
    
    const failingQuestionId = '1c407890-4181-47e6-86a1-5f281cb32043';
    const failingQuestion = questions.find(q => q.id === failingQuestionId);
    
    if (failingQuestion) {
      console.log('❌ Failing question found:');
      console.log(`   Title: ${failingQuestion.title}`);
      console.log(`   Template ID: ${failingQuestion.template_id || 'MISSING!'}`);
      console.log(`   Order: ${failingQuestion.order_index}`);
      
      if (!failingQuestion.template_id) {
        console.log('🔧 ISSUE: Missing template_id - this is why the API fails');
      }
    }

    // =================================================================
    // 5. FIX MISSING TEMPLATE IDS
    // =================================================================
    console.log('\n5️⃣ Fixing Missing Template IDs...');
    
    if (problemQuestionIds.length > 0) {
      console.log(`🔧 Found ${problemQuestionIds.length} questions without template_ids`);
      
      // For now, let's use a default template ID (we can get this from working question)
      const defaultTemplateId = workingQuestion?.template_id || 'lt-08e367739ac29f518';
      
      console.log(`   Using default template ID: ${defaultTemplateId}`);
      
      for (const questionId of problemQuestionIds) {
        const { error: updateError } = await supabase
          .from('questions')
          .update({ template_id: defaultTemplateId })
          .eq('id', questionId);

        if (updateError) {
          console.log(`❌ Failed to update question ${questionId}:`, updateError.message);
        } else {
          console.log(`✅ Updated question ${questionId} with template ID`);
        }
      }
    } else {
      console.log('✅ All questions have template IDs');
    }

    // =================================================================
    // 6. VERIFY FIXES
    // =================================================================
    console.log('\n6️⃣ Verifying Fixes...');
    
    // Check questions again
    const { data: updatedQuestions } = await supabase
      .from('questions')
      .select('id, title, template_id, order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index');

    console.log('📊 Updated questions:');
    updatedQuestions?.forEach((q, i) => {
      const status = q.template_id ? '✅' : '❌';
      console.log(`   ${status} ${i + 1}. ${q.title} (${q.template_id || 'NO TEMPLATE'})`);
    });

    // Check submission
    const { data: finalSubmission } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('candidate_id', candidateId)
      .single();

    if (finalSubmission) {
      console.log('\n📊 Current submission:');
      console.log(`   ID: ${finalSubmission.id}`);
      console.log(`   Status: ${finalSubmission.status}`);
      console.log(`   Started: ${finalSubmission.started_at}`);
      console.log(`   Expires: ${finalSubmission.expires_at}`);
    }

    console.log('\n🎯 SUMMARY:');
    console.log('✅ Created/verified submission record');
    if (problemQuestionIds.length > 0) {
      console.log('✅ Fixed missing template IDs for questions');
    }
    console.log('');
    console.log('Expected behavior now:');
    console.log('1. Submission API should work (returns submission data)');
    console.log('2. Network instance APIs should work for all questions');
    console.log('3. All questions should be startable');
    console.log('');
    console.log('🔄 Try refreshing the questions page and test again');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error(error.stack);
  }
}

fixAssessmentFlow().catch(console.error);
