require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testAssessmentFlow() {
  let supabaseUrl, supabaseServiceKey;
  
  try {
    const fs = require('fs');
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  } catch (e) {
    console.log('Could not read .env.local, trying process.env...');
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🧪 Testing Assessment Flow...\n');

  try {
    // 1. Check if test assessment exists
    console.log('1. Checking test assessment...');
    const testAssessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
    
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', testAssessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.log('❌ Test assessment not found, creating one...');
      
      // Get a user to be the creator
      const { data: users } = await supabase.auth.admin.listUsers();
      const adminUser = users?.users?.[0];
      
      if (!adminUser) {
        console.log('❌ No users found, please create a user first');
        return;
      }

      const { data: newAssessment, error: createError } = await supabase
        .from('assessments')
        .upsert({
          id: testAssessmentId,
          name: 'Test CTF Assessment',
          description: 'A test assessment for flow validation',
          status: 'ACTIVE',
          created_by: adminUser.id,
          active_from: new Date().toISOString(),
          active_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration_in_minutes: 120,
          max_score: 500,
          no_of_questions: 3
        }, { onConflict: 'id' })
        .select()
        .single();

      if (createError) {
        console.log('❌ Could not create test assessment:', createError.message);
        return;
      }
      
      console.log('✅ Test assessment created');
    } else {
      console.log('✅ Test assessment exists:', assessment.name);
    }

    // 2. Check if we have a test user
    console.log('\n2. Checking test user...');
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users?.users?.[0];
    
    if (!testUser) {
      console.log('❌ No test user found, creating one...');
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: 'test@hackcubes.com',
        password: 'test123456',
        email_confirm: true
      });
      
      if (userError) {
        console.log('❌ Could not create test user:', userError.message);
        return;
      }
      console.log('✅ Test user created:', newUser.user.email);
    } else {
      console.log('✅ Test user exists:', testUser.email);
    }

    // 3. Test enrollment creation
    console.log('\n3. Testing enrollment creation...');
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .upsert({
        user_id: testUser.id,
        assessment_id: testAssessmentId,
        status: 'ENROLLED',
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        max_possible_score: 500
      }, { onConflict: 'user_id,assessment_id' })
      .select()
      .single();

    if (enrollmentError) {
      console.log('❌ Enrollment creation failed:', enrollmentError.message);
      return;
    }
    
    console.log('✅ Enrollment created/updated:', enrollment.id);

    // 4. Test starting assessment (update enrollment)
    console.log('\n4. Testing assessment start...');
    const { error: startError } = await supabase
      .from('enrollments')
      .update({
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);

    if (startError) {
      console.log('❌ Could not start assessment:', startError.message);
      return;
    }
    
    console.log('✅ Assessment started successfully');

    // 5. Check if we have questions/sections
    console.log('\n5. Checking questions and sections...');
    const { data: sections } = await supabase
      .from('sections')
      .select('*')
      .eq('assessment_id', testAssessmentId);

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .in('section_id', (sections || []).map(s => s.id));

    console.log(`📊 Found ${sections?.length || 0} sections and ${questions?.length || 0} questions`);

    if (!sections?.length) {
      console.log('⚠️  No sections found. Creating test section...');
      const { data: newSection } = await supabase
        .from('sections')
        .insert({
          assessment_id: testAssessmentId,
          name: 'Web Security',
          description: 'Test section',
          order_index: 1
        })
        .select()
        .single();

      if (newSection) {
        console.log('✅ Test section created');
        
        // Create test questions
        const testQuestions = [
          {
            section_id: newSection.id,
            name: 'Test Challenge 1',
            description: 'This is a test challenge',
            category: 'web',
            difficulty: 'easy',
            score: 100,
            no_of_flags: 1,
            type: 'web',
            is_active: true,
            order_index: 1
          },
          {
            section_id: newSection.id,
            name: 'Test Challenge 2',
            description: 'Another test challenge',
            category: 'crypto',
            difficulty: 'medium',
            score: 200,
            no_of_flags: 1,
            type: 'crypto',
            is_active: true,
            order_index: 2
          }
        ];

        for (const question of testQuestions) {
          const { error: questionError } = await supabase
            .from('questions')
            .insert(question);
            
          if (!questionError) {
            console.log(`✅ Created question: ${question.name}`);
          }
        }
      }
    }

    console.log('\n🎉 Assessment flow test completed!');
    console.log('\n📋 Test Summary:');
    console.log(`✅ Assessment: ${testAssessmentId}`);
    console.log(`✅ User: ${testUser.email}`);
    console.log(`✅ Enrollment: ${enrollment.id}`);
    console.log('\n🌐 Test URLs:');
    console.log(`📝 Assessment Welcome: http://localhost:3002/assessments/${testAssessmentId}`);
    console.log(`❓ Questions Page: http://localhost:3002/assessments/${testAssessmentId}/questions`);
    console.log('\n💡 You can now test the flow by:');
    console.log('1. Sign in as the test user');
    console.log('2. Navigate to the assessment welcome page');
    console.log('3. Click "Start Assessment"');
    console.log('4. Verify it redirects to questions page');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAssessmentFlow().catch(console.error);
