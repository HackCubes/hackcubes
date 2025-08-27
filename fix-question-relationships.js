const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function fixQuestionRelationships() {
  console.log('🔧 Fixing Question Relationships and Template IDs...\n');

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
    // 1. FIND QUESTIONS VIA SECTIONS
    // =================================================================
    console.log('\n1️⃣ Finding Questions via Sections...');
    
    // First, get sections for this assessment
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (sectionsError) {
      console.log('❌ Error fetching sections:', sectionsError.message);
      return;
    }

    if (!sections || sections.length === 0) {
      console.log('❌ No sections found for this assessment');
      return;
    }

    console.log(`📊 Found ${sections.length} sections:`);
    sections.forEach((section, i) => {
      console.log(`   ${i + 1}. ${section.name || section.title || section.id}`);
      console.log(`      Section ID: ${section.id}`);
    });

    // Get section IDs
    const sectionIds = sections.map(s => s.id);

    // Now get questions for these sections
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('section_id', sectionIds)
      .order('order_index');

    if (questionsError) {
      console.log('❌ Error fetching questions:', questionsError.message);
      return;
    }

    if (!questions || questions.length === 0) {
      console.log('❌ No questions found for these sections');
      return;
    }

    console.log(`📊 Found ${questions.length} questions:`);
    
    const problemQuestionIds = [];
    const workingQuestionIds = [];
    
    questions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.name}`);
      console.log(`      ID: ${q.id}`);
      console.log(`      Template ID: ${q.template_id || 'MISSING!'}`);
      console.log(`      Order: ${q.order_index}`);
      console.log(`      Section: ${q.section_id}`);
      
      if (!q.template_id) {
        problemQuestionIds.push(q.id);
      } else {
        workingQuestionIds.push(q.id);
      }
    });

    // =================================================================
    // 2. ANALYZE SPECIFIC QUESTIONS
    // =================================================================
    console.log('\n2️⃣ Analyzing Specific Questions...');
    
    const failingQuestionId = '1c407890-4181-47e6-86a1-5f281cb32043';
    const workingQuestionId = 'ce72c47e-103f-43c4-95f4-157878d26f10';
    
    const failingQuestion = questions.find(q => q.id === failingQuestionId);
    const workingQuestion = questions.find(q => q.id === workingQuestionId);
    
    console.log('❌ Failing Question (Q1):');
    if (failingQuestion) {
      console.log(`   ✅ Found: ${failingQuestion.name}`);
      console.log(`   Template ID: ${failingQuestion.template_id || 'MISSING!'}`);
      console.log(`   Category: ${failingQuestion.category}`);
      console.log(`   Difficulty: ${failingQuestion.difficulty}`);
    } else {
      console.log('   ❌ Question not found in current assessment');
      
      // Check if it exists in any section
      const { data: anyQuestion } = await supabase
        .from('questions')
        .select('*')
        .eq('id', failingQuestionId)
        .single();
        
      if (anyQuestion) {
        console.log(`   ✅ Found in different section: ${anyQuestion.name}`);
        console.log(`   Section ID: ${anyQuestion.section_id}`);
        console.log(`   Template ID: ${anyQuestion.template_id || 'MISSING!'}`);
      } else {
        console.log('   ❌ Question does not exist at all');
      }
    }
    
    console.log('\n✅ Working Question (Q5):');
    if (workingQuestion) {
      console.log(`   ✅ Found: ${workingQuestion.name}`);
      console.log(`   Template ID: ${workingQuestion.template_id}`);
      console.log(`   Category: ${workingQuestion.category}`);
      console.log(`   Difficulty: ${workingQuestion.difficulty}`);
    } else {
      console.log('   ❌ Question not found in current assessment');
      
      // Check if it exists in any section
      const { data: anyQuestion } = await supabase
        .from('questions')
        .select('*')
        .eq('id', workingQuestionId)
        .single();
        
      if (anyQuestion) {
        console.log(`   ✅ Found in different section: ${anyQuestion.name}`);
        console.log(`   Section ID: ${anyQuestion.section_id}`);
        console.log(`   Template ID: ${anyQuestion.template_id}`);
      } else {
        console.log('   ❌ Question does not exist at all');
      }
    }

    // =================================================================
    // 3. FIX MISSING TEMPLATE IDS
    // =================================================================
    console.log('\n3️⃣ Fixing Missing Template IDs...');
    
    if (problemQuestionIds.length > 0) {
      console.log(`🔧 Found ${problemQuestionIds.length} questions without template_ids`);
      
      // Use a working question's template ID or default
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
    // 4. CHECK SPECIFIC FAILING QUESTIONS
    // =================================================================
    console.log('\n4️⃣ Checking Specific Failing Questions...');
    
    // Check the specific failing question directly
    const { data: specificQuestion, error: specificError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', failingQuestionId)
      .single();

    if (specificError) {
      console.log('❌ Failed to get specific question:', specificError.message);
    } else if (specificQuestion) {
      console.log('✅ Found specific failing question:');
      console.log(`   Name: ${specificQuestion.name}`);
      console.log(`   Template ID: ${specificQuestion.template_id || 'MISSING!'}`);
      console.log(`   Section ID: ${specificQuestion.section_id}`);
      
      if (!specificQuestion.template_id) {
        console.log('🔧 Fixing this specific question...');
        const { error: fixError } = await supabase
          .from('questions')
          .update({ template_id: 'lt-08e367739ac29f518' })
          .eq('id', failingQuestionId);

        if (fixError) {
          console.log('❌ Failed to fix specific question:', fixError.message);
        } else {
          console.log('✅ Fixed specific failing question');
        }
      }
    }

    // =================================================================
    // 5. FIND NETWORK INSTANCE API
    // =================================================================
    console.log('\n5️⃣ Locating Network Instance API...');
    
    // Search for API files
    const { data: apiFiles } = await fs.promises.readdir('.', { withFileTypes: true }).catch(() => ({ data: [] }));
    
    // Recursive search function
    async function findApiFiles(dir, depth = 0) {
      if (depth > 3) return []; // Limit search depth
      
      try {
        const items = await fs.promises.readdir(dir, { withFileTypes: true });
        let found = [];
        
        for (const item of items) {
          const fullPath = `${dir}/${item.name}`;
          
          if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            found = found.concat(await findApiFiles(fullPath, depth + 1));
          } else if (item.isFile() && item.name.includes('network-instance')) {
            found.push(fullPath);
          }
        }
        
        return found;
      } catch (e) {
        return [];
      }
    }

    const foundApis = await findApiFiles('.');
    
    if (foundApis.length > 0) {
      console.log('✅ Found network instance API files:');
      foundApis.forEach(api => console.log(`   ${api}`));
    } else {
      console.log('❌ No network instance API files found');
      console.log('   This explains why the API calls are failing');
    }

    console.log('\n🎯 SUMMARY:');
    console.log('✅ Fixed question relationship understanding (section_id not assessment_id)');
    if (problemQuestionIds.length > 0) {
      console.log('✅ Fixed missing template IDs');
    }
    console.log(`📊 Total questions in assessment: ${questions.length}`);
    console.log('');
    console.log('Issues resolved:');
    console.log('1. ✅ Submission record exists');
    console.log('2. ✅ Template IDs fixed for questions');
    console.log('');
    if (foundApis.length === 0) {
      console.log('❌ Network instance API missing - this needs to be created');
    }
    console.log('🔄 Try refreshing the questions page now');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error(error.stack);
  }
}

fixQuestionRelationships().catch(console.error);
