const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugResultsRedirectLoop() {
  console.log('🔍 Debugging Results Page Redirect Loop...\n');

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
    const candidateEmail = 'ayush.agarwal6530@gmail.com';

    console.log('🎯 Assessment ID:', assessmentId);
    console.log('👤 Candidate ID:', candidateId);

    // =================================================================
    // 1. CHECK CURRENT DATABASE STATE
    // =================================================================
    console.log('\n1️⃣ Checking Current Database State...');
    
    // Check enrollment status
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);

    console.log('📊 Enrollments:');
    if (enrollmentError) {
      console.log('❌ Error:', enrollmentError.message);
    } else {
      enrollments?.forEach((enr, index) => {
        console.log(`   ${index + 1}. Status: ${enr.status}, Score: ${enr.current_score}, Final: ${enr.final_score || 'N/A'}`);
        console.log(`      Created: ${new Date(enr.created_at).toLocaleString()}`);
        
        if (enr.status === 'COMPLETED') {
          console.log('⚠️  ISSUE: Enrollment status is COMPLETED - this causes redirect to results page!');
        }
      });
    }

    // Check submission status
    const { data: submissions, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('assessment_id', assessmentId);

    console.log('\n📊 Submissions:');
    if (submissionError) {
      console.log('❌ Error:', submissionError.message);
    } else {
      submissions?.forEach((sub, index) => {
        console.log(`   ${index + 1}. Status: ${sub.status}, Score: ${sub.current_score}, Progress: ${sub.progress_percentage}%`);
        console.log(`      Started: ${sub.started_at ? new Date(sub.started_at).toLocaleString() : 'Not started'}`);
        console.log(`      Completed: ${sub.completed_at ? new Date(sub.completed_at).toLocaleString() : 'Not completed'}`);
        
        if (sub.status === 'COMPLETED') {
          console.log('⚠️  ISSUE: Submission status is COMPLETED - this causes redirect to results page!');
        }
      });
    }

    // Check invitation status
    const { data: invitation, error: invitationError } = await supabase
      .from('assessment_invitations')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('email', candidateEmail);

    console.log('\n📊 Invitations:');
    if (invitationError) {
      console.log('❌ Error:', invitationError.message);
    } else {
      invitation?.forEach((inv, index) => {
        console.log(`   ${index + 1}. Status: ${inv.status}, Invited: ${new Date(inv.invited_at).toLocaleString()}`);
      });
    }

    // =================================================================
    // 2. ANALYZE REDIRECT LOGIC FROM INDEX.TSX
    // =================================================================
    console.log('\n2️⃣ Analyzing Redirect Logic...');
    
    console.log('🔍 From index.tsx, the redirect to results happens when:');
    console.log('   - enrollment?.status === "COMPLETED"');
    
    // Find completed items
    const completedEnrollments = enrollments?.filter(e => e.status === 'COMPLETED') || [];
    const completedSubmissions = submissions?.filter(s => s.status === 'COMPLETED') || [];
    
    if (completedEnrollments.length > 0) {
      console.log('❌ FOUND ISSUE: Enrollment(s) with COMPLETED status');
      completedEnrollments.forEach((enr, index) => {
        console.log(`   ${index + 1}. Enrollment ${enr.id} - Status: ${enr.status}`);
      });
    }
    
    if (completedSubmissions.length > 0) {
      console.log('❌ FOUND ISSUE: Submission(s) with COMPLETED status');
      completedSubmissions.forEach((sub, index) => {
        console.log(`   ${index + 1}. Submission ${sub.id} - Status: ${sub.status}`);
      });
    }

    // =================================================================
    // 3. CHECK FLAG SUBMISSIONS
    // =================================================================
    console.log('\n3️⃣ Checking Flag Submissions...');
    
    // Check user_flag_submissions
    if (enrollments && enrollments.length > 0) {
      const { data: userFlagSubmissions, error: userFlagError } = await supabase
        .from('user_flag_submissions')
        .select('*')
        .eq('enrollment_id', enrollments[0].id);

      console.log('📊 User Flag Submissions:', userFlagSubmissions?.length || 0);
      if (userFlagSubmissions && userFlagSubmissions.length > 0) {
        console.log('   Sample submissions:', userFlagSubmissions.slice(0, 3).map(s => ({
          question: s.question_id,
          correct: s.is_correct,
          points: s.points_awarded
        })));
      }
    }

    // Check flag_submissions
    if (submissions && submissions.length > 0) {
      const { data: flagSubmissions, error: flagError } = await supabase
        .from('flag_submissions')
        .select('*')
        .eq('submission_id', submissions[0].id);

      console.log('📊 Flag Submissions:', flagSubmissions?.length || 0);
      if (flagSubmissions && flagSubmissions.length > 0) {
        console.log('   Sample submissions:', flagSubmissions.slice(0, 3).map(s => ({
          question: s.question_id,
          correct: s.is_correct,
          score: s.score
        })));
      }
    }

    // =================================================================
    // 4. RESET TO ALLOW FRESH START
    // =================================================================
    console.log('\n4️⃣ Resetting Assessment State...');
    
    let fixesApplied = [];

    // Reset enrollment status
    if (completedEnrollments.length > 0) {
      for (const enrollment of completedEnrollments) {
        try {
          const { error: resetEnrollmentError } = await supabase
            .from('enrollments')
            .update({ 
              status: 'ENROLLED',
              current_score: 0,
              final_score: 0
            })
            .eq('id', enrollment.id);

          if (resetEnrollmentError) {
            console.log(`❌ Failed to reset enrollment ${enrollment.id}:`, resetEnrollmentError.message);
          } else {
            console.log(`✅ Reset enrollment ${enrollment.id} status to ENROLLED`);
            fixesApplied.push(`Enrollment ${enrollment.id} reset`);
          }
        } catch (e) {
          console.log(`❌ Exception resetting enrollment ${enrollment.id}:`, e.message);
        }
      }
    }

    // Reset submission status
    if (completedSubmissions.length > 0) {
      for (const submission of completedSubmissions) {
        try {
          const { error: resetSubmissionError } = await supabase
            .from('submissions')
            .update({ 
              status: 'PENDING',
              current_score: 0,
              progress_percentage: 0.0,
              started_at: null,
              completed_at: null
            })
            .eq('id', submission.id);

          if (resetSubmissionError) {
            console.log(`❌ Failed to reset submission ${submission.id}:`, resetSubmissionError.message);
          } else {
            console.log(`✅ Reset submission ${submission.id} status to PENDING`);
            fixesApplied.push(`Submission ${submission.id} reset`);
          }
        } catch (e) {
          console.log(`❌ Exception resetting submission ${submission.id}:`, e.message);
        }
      }
    }

    // Clear flag submissions to allow fresh start
    if (enrollments && enrollments.length > 0) {
      try {
        const { error: clearUserFlagsError } = await supabase
          .from('user_flag_submissions')
          .delete()
          .eq('enrollment_id', enrollments[0].id);

        if (clearUserFlagsError) {
          console.log('❌ Failed to clear user flag submissions:', clearUserFlagsError.message);
        } else {
          console.log('✅ Cleared user flag submissions');
          fixesApplied.push('User flag submissions cleared');
        }
      } catch (e) {
        console.log('❌ Exception clearing user flag submissions:', e.message);
      }
    }

    if (submissions && submissions.length > 0) {
      try {
        const { error: clearFlagsError } = await supabase
          .from('flag_submissions')
          .delete()
          .eq('submission_id', submissions[0].id);

        if (clearFlagsError) {
          console.log('❌ Failed to clear flag submissions:', clearFlagsError.message);
        } else {
          console.log('✅ Cleared flag submissions');
          fixesApplied.push('Flag submissions cleared');
        }
      } catch (e) {
        console.log('❌ Exception clearing flag submissions:', e.message);
      }
    }

    // =================================================================
    // 5. VERIFY STATE AFTER RESET
    // =================================================================
    console.log('\n5️⃣ Verifying State After Reset...');
    
    // Re-check enrollment
    const { data: enrollmentsAfter } = await supabase
      .from('enrollments')
      .select('id, status, current_score, final_score')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);

    console.log('📊 Enrollments after reset:');
    enrollmentsAfter?.forEach((enr, index) => {
      console.log(`   ${index + 1}. Status: ${enr.status}, Score: ${enr.current_score}, Final: ${enr.final_score}`);
    });

    // Re-check submissions
    const { data: submissionsAfter } = await supabase
      .from('submissions')
      .select('id, status, current_score, progress_percentage')
      .eq('candidate_id', candidateId)
      .eq('assessment_id', assessmentId);

    console.log('📊 Submissions after reset:');
    submissionsAfter?.forEach((sub, index) => {
      console.log(`   ${index + 1}. Status: ${sub.status}, Score: ${sub.current_score}, Progress: ${sub.progress_percentage}%`);
    });

    // =================================================================
    // 6. FINAL INSTRUCTIONS
    // =================================================================
    console.log('\n6️⃣ Final Instructions...');
    console.log('🎯 Fixes Applied:');
    if (fixesApplied.length > 0) {
      fixesApplied.forEach(fix => console.log(`   ✅ ${fix}`));
    } else {
      console.log('   ℹ️  No resets needed - state was already correct');
    }
    
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Clear your browser cache and cookies for localhost');
    console.log('2. Try accessing: http://localhost:3000/assessments/533d4e96-fe35-4540-9798-162b3f261572');
    console.log('3. You should see the assessment welcome page');
    console.log('4. Click "Start Assessment" to begin fresh');
    console.log('');
    console.log('If still redirecting to results, check:');
    console.log('- Browser console for JavaScript errors');
    console.log('- Network tab for failed API calls');
    console.log('- Make sure you\'re logged in as the correct user');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugResultsRedirectLoop().catch(console.error);
