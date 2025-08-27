const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function performComprehensiveDatabaseTest() {
  console.log('🔬 Comprehensive Database Testing & Debugging...\n');

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

    console.log('🔗 Connecting to Supabase...');
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Service Key available:', !!supabaseKey);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // =================================================================
    // 1. TEST AUTHENTICATION
    // =================================================================
    console.log('\n1️⃣ Testing Authentication...');
    try {
      // Get current user (should be null for service role)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Current auth user:', user ? user.id : 'None (Service Role)');
      
      // Test if we can access auth.users table
      const { data: users, error: usersError } = await supabase
        .from('auth.users')
        .select('id, email')
        .limit(3);
      
      if (usersError) {
        console.log('⚠️  Cannot access auth.users directly:', usersError.message);
      } else {
        console.log('✅ Auth users accessible:', users?.length || 0, 'users found');
      }
    } catch (e) {
      console.log('❌ Auth test failed:', e.message);
    }

    // =================================================================
    // 2. TEST ASSESSMENTS TABLE
    // =================================================================
    console.log('\n2️⃣ Testing Assessments Table...');
    try {
      const { data: assessments, error: assessError } = await supabase
        .from('assessments')
        .select('id, name, duration_in_minutes, max_score')
        .limit(5);
      
      if (assessError) {
        console.log('❌ Assessments error:', assessError.message);
      } else {
        console.log('✅ Assessments accessible:', assessments?.length || 0, 'found');
        if (assessments && assessments.length > 0) {
          console.log('📊 Sample assessment:', assessments[0]);
        }
      }
    } catch (e) {
      console.log('❌ Assessments test failed:', e.message);
    }

    // =================================================================
    // 3. TEST ENROLLMENTS TABLE WITH FINAL_SCORE
    // =================================================================
    console.log('\n3️⃣ Testing Enrollments Table...');
    try {
      // First check table structure
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, user_id, assessment_id, status, final_score, current_score')
        .limit(5);
      
      if (enrollError) {
        console.log('❌ Enrollments error:', enrollError.message);
        
        // Try without final_score column
        const { data: enrollmentsWithoutFinalScore, error: enrollError2 } = await supabase
          .from('enrollments')
          .select('id, user_id, assessment_id, status, current_score')
          .limit(5);
        
        if (enrollError2) {
          console.log('❌ Enrollments still failing:', enrollError2.message);
        } else {
          console.log('⚠️  Enrollments accessible but missing final_score column');
          console.log('📊 Sample enrollment:', enrollmentsWithoutFinalScore?.[0]);
        }
      } else {
        console.log('✅ Enrollments accessible with final_score:', enrollments?.length || 0, 'found');
        if (enrollments && enrollments.length > 0) {
          console.log('📊 Sample enrollment:', enrollments[0]);
        }
      }
    } catch (e) {
      console.log('❌ Enrollments test failed:', e.message);
    }

    // =================================================================
    // 4. TEST SUBMISSIONS TABLE WITH PROGRESS_PERCENTAGE
    // =================================================================
    console.log('\n4️⃣ Testing Submissions Table...');
    try {
      // Check if table exists and test structure
      const { data: submissions, error: submissionError } = await supabase
        .from('submissions')
        .select('id, assessment_id, candidate_id, status, progress_percentage, current_score')
        .limit(5);
      
      if (submissionError) {
        console.log('❌ Submissions error:', submissionError.message);
        
        // Try without progress_percentage
        const { data: submissionsWithoutProgress, error: submissionError2 } = await supabase
          .from('submissions')
          .select('id, assessment_id, candidate_id, status, current_score')
          .limit(5);
        
        if (submissionError2) {
          console.log('❌ Submissions table not accessible:', submissionError2.message);
        } else {
          console.log('⚠️  Submissions accessible but missing progress_percentage column');
          console.log('📊 Sample submission:', submissionsWithoutProgress?.[0]);
        }
      } else {
        console.log('✅ Submissions accessible with progress_percentage:', submissions?.length || 0, 'found');
        if (submissions && submissions.length > 0) {
          console.log('📊 Sample submission:', submissions[0]);
        }
      }
    } catch (e) {
      console.log('❌ Submissions test failed:', e.message);
    }

    // =================================================================
    // 5. TEST FLAG_SUBMISSIONS TABLE WITH SUBMISSION_ID
    // =================================================================
    console.log('\n5️⃣ Testing Flag_Submissions Table...');
    try {
      const { data: flagSubmissions, error: flagError } = await supabase
        .from('flag_submissions')
        .select('id, submission_id, question_id, flag_id, value, is_correct')
        .limit(5);
      
      if (flagError) {
        console.log('❌ Flag_submissions error:', flagError.message);
        
        // Try without submission_id
        const { data: flagSubmissionsWithoutSubmissionId, error: flagError2 } = await supabase
          .from('flag_submissions')
          .select('id, question_id, flag_id, value, is_correct')
          .limit(5);
        
        if (flagError2) {
          console.log('❌ Flag_submissions table not accessible:', flagError2.message);
        } else {
          console.log('⚠️  Flag_submissions accessible but missing submission_id column');
          console.log('📊 Sample flag submission:', flagSubmissionsWithoutSubmissionId?.[0]);
        }
      } else {
        console.log('✅ Flag_submissions accessible with submission_id:', flagSubmissions?.length || 0, 'found');
        if (flagSubmissions && flagSubmissions.length > 0) {
          console.log('📊 Sample flag submission:', flagSubmissions[0]);
        }
      }
    } catch (e) {
      console.log('❌ Flag_submissions test failed:', e.message);
    }

    // =================================================================
    // 6. TEST USER_FLAG_SUBMISSIONS TABLE
    // =================================================================
    console.log('\n6️⃣ Testing User_Flag_Submissions Table...');
    try {
      const { data: userFlagSubmissions, error: userFlagError } = await supabase
        .from('user_flag_submissions')
        .select('id, enrollment_id, question_id, flag_id, submitted_answer, is_correct')
        .limit(5);
      
      if (userFlagError) {
        console.log('❌ User_flag_submissions error:', userFlagError.message);
      } else {
        console.log('✅ User_flag_submissions accessible:', userFlagSubmissions?.length || 0, 'found');
        if (userFlagSubmissions && userFlagSubmissions.length > 0) {
          console.log('📊 Sample user flag submission:', userFlagSubmissions[0]);
        }
      }
    } catch (e) {
      console.log('❌ User_flag_submissions test failed:', e.message);
    }

    // =================================================================
    // 7. TEST ASSESSMENT_INVITATIONS TABLE
    // =================================================================
    console.log('\n7️⃣ Testing Assessment_Invitations Table...');
    try {
      const { data: invitations, error: invitationError } = await supabase
        .from('assessment_invitations')
        .select('id, assessment_id, email, status, invited_at')
        .limit(5);
      
      if (invitationError) {
        console.log('❌ Assessment_invitations error:', invitationError.message);
      } else {
        console.log('✅ Assessment_invitations accessible:', invitations?.length || 0, 'found');
        if (invitations && invitations.length > 0) {
          console.log('📊 Sample invitation:', invitations[0]);
        }
      }
    } catch (e) {
      console.log('❌ Assessment_invitations test failed:', e.message);
    }

    // =================================================================
    // 8. CREATE TEST DATA AND PERFORM OPERATIONS
    // =================================================================
    console.log('\n8️⃣ Testing Data Operations...');
    
    // Get a real assessment ID for testing
    const { data: testAssessment } = await supabase
      .from('assessments')
      .select('id, name')
      .limit(1)
      .single();

    if (testAssessment) {
      console.log('🎯 Using test assessment:', testAssessment.name, '(', testAssessment.id, ')');
      
      // Test creating a submission
      try {
        const testSubmission = {
          assessment_id: testAssessment.id,
          candidate_id: '00000000-0000-0000-0000-000000000000', // dummy user ID
          status: 'PENDING',
          type: 'CTF',
          progress_percentage: 0.0,
          total_score: 0,
          current_score: 0
        };

        console.log('🧪 Testing submission creation...');
        const { data: newSubmission, error: createError } = await supabase
          .from('submissions')
          .insert(testSubmission)
          .select()
          .single();

        if (createError) {
          console.log('❌ Submission creation failed:', createError.message);
        } else {
          console.log('✅ Submission created successfully:', newSubmission.id);
          
          // Clean up test data
          await supabase
            .from('submissions')
            .delete()
            .eq('id', newSubmission.id);
          console.log('🧹 Test submission cleaned up');
        }
      } catch (e) {
        console.log('❌ Submission test failed:', e.message);
      }
    }

    // =================================================================
    // 9. CHECK SPECIFIC FAILING API ENDPOINTS
    // =================================================================
    console.log('\n9️⃣ Testing Specific Failing Endpoints...');
    
    // Test the specific enrollment ID from your error
    const testEnrollmentId = '84ab4e62-e37b-4a51-9969-b4ca648a2ee2';
    console.log('🔍 Testing enrollment ID:', testEnrollmentId);
    
    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', testEnrollmentId)
        .single();
      
      if (enrollmentError) {
        console.log('❌ Specific enrollment error:', enrollmentError.message);
      } else {
        console.log('✅ Specific enrollment found:', enrollmentData);
      }
    } catch (e) {
      console.log('❌ Specific enrollment test failed:', e.message);
    }

    // Test flag_submissions with submission_id
    try {
      const { data: flagSubData, error: flagSubError } = await supabase
        .from('flag_submissions')
        .select('*')
        .eq('submission_id', testEnrollmentId);
      
      if (flagSubError) {
        console.log('❌ Flag_submissions with submission_id error:', flagSubError.message);
      } else {
        console.log('✅ Flag_submissions query successful:', flagSubData?.length || 0, 'records');
      }
    } catch (e) {
      console.log('❌ Flag_submissions test failed:', e.message);
    }

    // =================================================================
    // 10. SUMMARY AND RECOMMENDATIONS
    // =================================================================
    console.log('\n🔍 SUMMARY & RECOMMENDATIONS:');
    console.log('=' * 50);
    console.log('1. Run the complete-database-fix.sql file in Supabase SQL Editor');
    console.log('2. Check that all missing columns are added');
    console.log('3. Verify RLS policies are correctly set');
    console.log('4. Test the assessment flow again');
    console.log('=' * 50);

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the comprehensive test
performComprehensiveDatabaseTest().catch(console.error);
