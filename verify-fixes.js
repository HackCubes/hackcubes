const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function verifyDatabaseFixes() {
  console.log('✅ Verifying Database Fixes After Manual SQL Execution...\n');

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

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔗 Connected to Supabase');

    // =================================================================
    // 1. VERIFY ALL COLUMN FIXES
    // =================================================================
    console.log('\n1️⃣ Verifying Column Fixes...\n');
    
    const columnTests = [
      {
        name: 'enrollments.final_score',
        query: () => supabase.from('enrollments').select('id, final_score').limit(1)
      },
      {
        name: 'submissions.progress_percentage',
        query: () => supabase.from('submissions').select('id, progress_percentage').limit(1)
      },
      {
        name: 'flag_submissions.submission_id',
        query: () => supabase.from('flag_submissions').select('id, submission_id').limit(1)
      },
      {
        name: 'flag_submissions.value',
        query: () => supabase.from('flag_submissions').select('id, value').limit(1)
      },
      {
        name: 'user_flag_submissions table',
        query: () => supabase.from('user_flag_submissions').select('id').limit(1)
      }
    ];

    let allFixed = true;

    for (const test of columnTests) {
      try {
        const { data, error } = await test.query();
        if (error) {
          console.log(`❌ ${test.name} - STILL BROKEN: ${error.message}`);
          allFixed = false;
        } else {
          console.log(`✅ ${test.name} - FIXED`);
        }
      } catch (e) {
        console.log(`❌ ${test.name} - EXCEPTION: ${e.message}`);
        allFixed = false;
      }
    }

    if (!allFixed) {
      console.log('\n⚠️  Some fixes are still missing. Please run the SQL script again.');
      return;
    }

    // =================================================================
    // 2. TEST THE ORIGINALLY FAILING API CALLS
    // =================================================================
    console.log('\n2️⃣ Testing Originally Failing API Calls...\n');

    // Get a real assessment for testing
    const { data: testAssessment } = await supabase
      .from('assessments')
      .select('id, name, duration_in_minutes, max_score')
      .limit(1)
      .single();

    if (!testAssessment) {
      console.log('❌ No test assessment found');
      return;
    }

    console.log(`🎯 Using assessment: ${testAssessment.name} (${testAssessment.id})`);

    // Test 1: Create enrollment with final_score
    console.log('\n🧪 Test 1: Creating enrollment with final_score...');
    try {
      const { data: newEnrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          assessment_id: testAssessment.id,
          status: 'ENROLLED',
          max_possible_score: testAssessment.max_score,
          current_score: 0,
          final_score: 0
        })
        .select()
        .single();

      if (enrollError) {
        console.log('❌ Enrollment creation failed:', enrollError.message);
        return;
      }
      
      console.log('✅ Enrollment created successfully');

      // Test 2: Create submission with progress_percentage
      console.log('\n🧪 Test 2: Creating submission with progress_percentage...');
      try {
        const { data: newSubmission, error: submissionError } = await supabase
          .from('submissions')
          .insert({
            assessment_id: testAssessment.id,
            candidate_id: '00000000-0000-0000-0000-000000000000',
            status: 'STARTED',
            type: 'CTF',
            progress_percentage: 0.0,
            total_score: 0,
            current_score: 0
          })
          .select()
          .single();

        if (submissionError) {
          console.log('❌ Submission creation failed:', submissionError.message);
        } else {
          console.log('✅ Submission created successfully');

          // Test 3: Query flag_submissions with submission_id
          console.log('\n🧪 Test 3: Querying flag_submissions with submission_id...');
          const { data: flagSubs, error: flagError } = await supabase
            .from('flag_submissions')
            .select('*')
            .eq('submission_id', newSubmission.id);

          if (flagError) {
            console.log('❌ Flag_submissions query failed:', flagError.message);
          } else {
            console.log('✅ Flag_submissions query successful');
          }

          // Test 4: Query user_flag_submissions
          console.log('\n🧪 Test 4: Querying user_flag_submissions...');
          const { data: userFlagSubs, error: userFlagError } = await supabase
            .from('user_flag_submissions')
            .select('*')
            .eq('enrollment_id', newEnrollment.id);

          if (userFlagError) {
            console.log('❌ User_flag_submissions query failed:', userFlagError.message);
          } else {
            console.log('✅ User_flag_submissions query successful');
          }

          // Cleanup
          await supabase.from('submissions').delete().eq('id', newSubmission.id);
        }
      } catch (e) {
        console.log('❌ Submission test exception:', e.message);
      }

      // Cleanup enrollment
      await supabase.from('enrollments').delete().eq('id', newEnrollment.id);
      
    } catch (e) {
      console.log('❌ Enrollment test exception:', e.message);
    }

    // =================================================================
    // 3. SIMULATION OF ASSESSMENT FLOW
    // =================================================================
    console.log('\n3️⃣ Simulating Complete Assessment Flow...\n');

    // Get the specific assessment from your error
    const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
    const candidateId = 'f8494a8b-ec32-4363-a8ad-1984e9263bef';

    console.log(`🎯 Testing with your specific assessment: ${assessmentId}`);

    // Test enrollments query (the original failing one)
    console.log('\n🧪 Testing original failing enrollments query...');
    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id, final_score, current_score, status')
        .eq('id', '84ab4e62-e37b-4a51-9969-b4ca648a2ee2');

      if (enrollmentError) {
        console.log('❌ Original enrollments query still failing:', enrollmentError.message);
      } else {
        console.log('✅ Original enrollments query now works:', enrollmentData);
      }
    } catch (e) {
      console.log('❌ Enrollments query exception:', e.message);
    }

    // Test submissions query
    console.log('\n🧪 Testing submissions query with progress_percentage...');
    try {
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('id, status, started_at, expires_at, current_score, progress_percentage')
        .eq('assessment_id', assessmentId)
        .eq('candidate_id', candidateId);

      if (submissionError) {
        console.log('❌ Submissions query failed:', submissionError.message);
      } else {
        console.log('✅ Submissions query successful:', submissionData?.length || 0, 'records');
      }
    } catch (e) {
      console.log('❌ Submissions query exception:', e.message);
    }

    console.log('\n🎉 VERIFICATION COMPLETE!');
    console.log('If all tests above show ✅, your database is fixed and the assessment flow should work.');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run verification
verifyDatabaseFixes().catch(console.error);
