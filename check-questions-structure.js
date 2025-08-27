const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkQuestionsStructure() {
  console.log('🔍 Checking Questions Table Structure...\n');

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
    // 1. CHECK TABLE STRUCTURE
    // =================================================================
    console.log('\n1️⃣ Checking Table Structures...');
    
    // Check questions table structure
    const { data: questionColumns, error: qColError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'questions' ORDER BY ordinal_position;`
      });

    if (qColError) {
      console.log('❌ Error checking questions columns:', qColError.message);
      
      // Try alternative method
      console.log('\n🔄 Trying alternative method...');
      const { data: sampleQuestions, error: sampleError } = await supabase
        .from('questions')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Error getting sample question:', sampleError.message);
      } else if (sampleQuestions && sampleQuestions.length > 0) {
        console.log('✅ Sample question structure:');
        const question = sampleQuestions[0];
        Object.keys(question).forEach(key => {
          console.log(`   ${key}: ${typeof question[key]} = ${question[key]}`);
        });
      }
    } else {
      console.log('📊 Questions table columns:');
      questionColumns?.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type}`);
      });
    }

    // =================================================================
    // 2. GET QUESTIONS WITH CORRECT FIELDS
    // =================================================================
    console.log('\n2️⃣ Getting Questions Data...');
    
    // Try with all available fields
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('assessment_id', assessmentId);

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
      console.log(`   ${i + 1}. Question ID: ${q.id}`);
      console.log(`      Content: ${q.content || q.description || q.name || 'No title field'}`);
      console.log(`      Template ID: ${q.template_id || 'MISSING!'}`);
      console.log(`      Order: ${q.order_index || q.position || 'No order'}`);
      console.log(`      All fields:`, Object.keys(q));
      
      if (!q.template_id) {
        problemQuestionIds.push(q.id);
      } else {
        workingQuestionIds.push(q.id);
      }
    });

    // =================================================================
    // 3. ANALYZE SPECIFIC QUESTIONS
    // =================================================================
    console.log('\n3️⃣ Analyzing Specific Questions...');
    
    const failingQuestionId = '1c407890-4181-47e6-86a1-5f281cb32043';
    const workingQuestionId = 'ce72c47e-103f-43c4-95f4-157878d26f10';
    
    const failingQuestion = questions.find(q => q.id === failingQuestionId);
    const workingQuestion = questions.find(q => q.id === workingQuestionId);
    
    if (failingQuestion) {
      console.log('❌ Failing Question (Q1):');
      console.log(`   ID: ${failingQuestion.id}`);
      console.log(`   Template ID: ${failingQuestion.template_id || 'MISSING!'}`);
      console.log(`   All data:`, failingQuestion);
    }
    
    if (workingQuestion) {
      console.log('✅ Working Question (Q5):');
      console.log(`   ID: ${workingQuestion.id}`);
      console.log(`   Template ID: ${workingQuestion.template_id}`);
      console.log(`   All data:`, workingQuestion);
    }

    // =================================================================
    // 4. FIX MISSING TEMPLATE IDS
    // =================================================================
    console.log('\n4️⃣ Fixing Missing Template IDs...');
    
    if (problemQuestionIds.length > 0) {
      console.log(`🔧 Found ${problemQuestionIds.length} questions without template_ids`);
      
      // Use the working question's template ID as default
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
    // 5. CHECK NETWORK INSTANCE API
    // =================================================================
    console.log('\n5️⃣ Checking Network Instance API...');
    
    // Look for network instance API files
    const possibleApiPaths = [
      'src/pages/api/network-instance.js',
      'pages/api/network-instance.js', 
      'app/api/network-instance/route.js',
      'src/app/api/network-instance/route.js'
    ];

    let apiFound = false;
    for (const apiPath of possibleApiPaths) {
      try {
        const content = fs.readFileSync(apiPath, 'utf8');
        console.log(`✅ Found API at: ${apiPath}`);
        console.log(`   File size: ${content.length} characters`);
        apiFound = true;
        
        // Check if it has the expected actions
        if (content.includes('get_status') && content.includes('start')) {
          console.log('✅ API has get_status and start actions');
        } else {
          console.log('❌ API missing get_status or start actions');
        }
        break;
      } catch (e) {
        // File doesn't exist, continue
      }
    }

    if (!apiFound) {
      console.log('❌ Network instance API not found in any expected location');
      console.log('   Expected paths checked:', possibleApiPaths);
    }

    // =================================================================
    // 6. VERIFY SUBMISSION
    // =================================================================
    console.log('\n6️⃣ Verifying Submission...');
    
    const { data: submission } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('candidate_id', candidateId)
      .single();

    if (submission) {
      console.log('✅ Submission exists:');
      console.log(`   ID: ${submission.id}`);
      console.log(`   Status: ${submission.status}`);
      console.log(`   Started: ${submission.started_at}`);
      console.log(`   Expires: ${submission.expires_at}`);
    } else {
      console.log('❌ No submission found');
    }

    console.log('\n🎯 SUMMARY:');
    console.log('Issues identified:');
    if (problemQuestionIds.length > 0) {
      console.log(`❌ ${problemQuestionIds.length} questions missing template_id`);
    }
    if (!apiFound) {
      console.log('❌ Network instance API not found');
    }
    console.log('');
    console.log('Next steps:');
    console.log('1. Fix missing template IDs (attempted above)');
    console.log('2. Locate and fix network instance API');
    console.log('3. Test the questions again');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    console.error(error.stack);
  }
}

checkQuestionsStructure().catch(console.error);
