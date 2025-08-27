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
    const submissionId = '84ab4e62-e37b-4a51-9969-b4ca648a2ee2';

    console.log('🎯 Assessment ID:', assessmentId);
    console.log('👤 Candidate ID:', candidateId);
    console.log('📄 Submission ID:', submissionId);

    // =================================================================
    // 1. CHECK SECTIONS AND QUESTIONS
    // =================================================================
    console.log('\n1️⃣ Checking Assessment Structure...');
    
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('id, name, order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index');

    if (sectionsError) {
      console.log('❌ Sections error:', sectionsError.message);
      return;
    }

    console.log('📊 Sections found:', sections?.length || 0);
    sections?.forEach((section, index) => {
      console.log(`   ${index + 1}. ${section.name} (${section.id})`);
    });

    if (!sections || sections.length === 0) {
      console.log('❌ ISSUE: No sections found for this assessment!');
      console.log('💡 The questions page needs sections to display questions');
      return;
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('section_id', sections.map(s => s.id))
      .order('order_index');

    if (questionsError) {
      console.log('❌ Questions error:', questionsError.message);
      return;
    }

    console.log('📊 Questions found:', questions?.length || 0);
    questions?.forEach((question, index) => {
      console.log(`   ${index + 1}. ${question.name} (${question.id})`);
    });

    if (!questions || questions.length === 0) {
      console.log('❌ ISSUE: No questions found for this assessment!');
      console.log('💡 The questions page will be empty');
      return;
    }

    // =================================================================
    // 2. CHECK FLAGS
    // =================================================================
    console.log('\n2️⃣ Checking Flags...');
    
    const { data: flags, error: flagsError } = await supabase
      .from('flags')
      .select('*')
      .in('question_id', questions.map(q => q.id));

    if (flagsError) {
      console.log('❌ Flags error:', flagsError.message);
    } else {
      console.log('📊 Flags found:', flags?.length || 0);
      flags?.forEach((flag, index) => {
        console.log(`   ${index + 1}. Question ${flag.question_id}: ${flag.value}`);
      });
    }

    // =================================================================
    // 3. RESET SUBMISSION TO ALLOW FRESH START
    // =================================================================
    console.log('\n3️⃣ Resetting Submission Status...');
    
    try {
      const { error: resetError } = await supabase
        .from('submissions')
        .update({ 
          status: 'PENDING',
          started_at: null
        })
        .eq('id', submissionId);

      if (resetError) {
        console.log('❌ Failed to reset submission:', resetError.message);
      } else {
        console.log('✅ Submission status reset to PENDING');
      }
    } catch (e) {
      console.log('❌ Exception resetting submission:', e.message);
    }

    // =================================================================
    // 4. TEST ASSESSMENT ACCESS
    // =================================================================
    console.log('\n4️⃣ Testing Assessment Access Flow...');
    
    // Test invitation
    const { data: invitation } = await supabase
      .from('assessment_invitations')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('email', 'ayush.agarwal6530@gmail.com')
      .single();

    if (invitation) {
      console.log('✅ Invitation status:', invitation.status);
    }

    // Test submission after reset
    const { data: submission } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submission) {
      console.log('✅ Submission status after reset:', submission.status);
    }

    // =================================================================
    // 5. CREATE TEST SECTIONS AND QUESTIONS IF MISSING
    // =================================================================
    if (!sections || sections.length === 0) {
      console.log('\n5️⃣ Creating Test Section and Question...');
      
      try {
        // Create a test section
        const { data: newSection, error: sectionCreateError } = await supabase
          .from('sections')
          .insert({
            assessment_id: assessmentId,
            name: 'General Challenges',
            order_index: 1
          })
          .select()
          .single();

        if (sectionCreateError) {
          console.log('❌ Failed to create section:', sectionCreateError.message);
        } else {
          console.log('✅ Test section created:', newSection.id);

          // Create a test question
          const { data: newQuestion, error: questionCreateError } = await supabase
            .from('questions')
            .insert({
              section_id: newSection.id,
              name: 'Sample Challenge',
              description: 'This is a sample challenge to test the assessment flow.',
              type: 'ctf',
              category: 'general',
              difficulty: 'easy',
              score: 100,
              no_of_flags: 1,
              order_index: 1,
              is_active: true
            })
            .select()
            .single();

          if (questionCreateError) {
            console.log('❌ Failed to create question:', questionCreateError.message);
          } else {
            console.log('✅ Test question created:', newQuestion.id);

            // Create a test flag
            const { data: newFlag, error: flagCreateError } = await supabase
              .from('flags')
              .insert({
                question_id: newQuestion.id,
                value: 'test_flag_123',
                is_case_sensitive: false,
                score: 100,
                hint: 'This is a test flag'
              })
              .select()
              .single();

            if (flagCreateError) {
              console.log('❌ Failed to create flag:', flagCreateError.message);
            } else {
              console.log('✅ Test flag created:', newFlag.id);
            }
          }
        }
      } catch (e) {
        console.log('❌ Exception creating test data:', e.message);
      }
    }

    // =================================================================
    // 6. FINAL INSTRUCTIONS
    // =================================================================
    console.log('\n6️⃣ Final Instructions...');
    console.log('🎯 Changes made:');
    console.log('   ✅ Reset submission status to PENDING');
    if (!sections || sections.length === 0) {
      console.log('   ✅ Created test section and question');
    }
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Try accessing the assessment again: http://localhost:3000/assessments/533d4e96-fe35-4540-9798-162b3f261572');
    console.log('2. Click "Start Assessment" - it should now work properly');
    console.log('3. You should be able to navigate to the questions page');
    console.log('');
    console.log('If still having issues, check browser console for JavaScript errors.');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixAssessmentFlow().catch(console.error);
