const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugRedirectLoop() {
  console.log('🔍 COMPREHENSIVE REDIRECT LOOP DEBUGGING...\n');

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
    const candidateEmail = 'ayush.agarwal6530@gmail.com';

    console.log('🎯 Assessment ID:', assessmentId);
    console.log('📧 Candidate Email:', candidateEmail);

    // =================================================================
    // 1. GET CANDIDATE ID FROM AUTH
    // =================================================================
    console.log('\n1️⃣ Finding Candidate ID...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    let candidateId = null;
    if (authUsers && authUsers.users) {
      const candidate = authUsers.users.find(user => user.email === candidateEmail);
      if (candidate) {
        candidateId = candidate.id;
        console.log('✅ Found candidate ID:', candidateId);
      } else {
        console.log('❌ Candidate not found in auth users');
        return;
      }
    } else {
      console.log('❌ Error fetching auth users:', authError?.message);
      return;
    }

    // =================================================================
    // 2. CHECK ALL RELATED TABLES
    // =================================================================
    console.log('\n2️⃣ Checking All Database Tables...');

    // Assessment Invitations
    console.log('\n📧 Assessment Invitations:');
    const { data: invitations, error: invError } = await supabase
      .from('assessment_invitations')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('email', candidateEmail);

    if (invError) {
      console.log('❌ Error:', invError.message);
    } else if (!invitations || invitations.length === 0) {
      console.log('❌ No invitations found');
    } else {
      invitations.forEach((inv, i) => {
        console.log(`   ${i + 1}. ID: ${inv.id}`);
        console.log(`      Status: ${inv.status}`);
        console.log(`      Invited: ${inv.invited_at}`);
        console.log(`      Accepted: ${inv.accepted_at || 'Not accepted'}`);
      });
    }

    // Enrollments
    console.log('\n📚 Enrollments:');
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);

    if (enrollError) {
      console.log('❌ Error:', enrollError.message);
    } else if (!enrollments || enrollments.length === 0) {
      console.log('❌ No enrollments found');
    } else {
      enrollments.forEach((enr, i) => {
        console.log(`   ${i + 1}. ID: ${enr.id}`);
        console.log(`      Status: ${enr.status}`);
        console.log(`      Current Score: ${enr.current_score}`);
        console.log(`      Final Score: ${enr.final_score || 'None'}`);
        console.log(`      Created: ${enr.created_at}`);
        console.log(`      Updated: ${enr.updated_at}`);
      });
    }

    // Submissions
    console.log('\n📝 Submissions:');
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('assessment_id', assessmentId);

    if (subError) {
      console.log('❌ Error:', subError.message);
    } else if (!submissions || submissions.length === 0) {
      console.log('❌ No submissions found');
    } else {
      submissions.forEach((sub, i) => {
        console.log(`   ${i + 1}. ID: ${sub.id}`);
        console.log(`      Status: ${sub.status}`);
        console.log(`      Started: ${sub.started_at || 'Not started'}`);
        console.log(`      Completed: ${sub.completed_at || 'Not completed'}`);
        console.log(`      Expires: ${sub.expires_at || 'No expiry'}`);
        console.log(`      Progress: ${sub.progress_percentage || 0}%`);
        console.log(`      Score: ${sub.current_score || 0}`);
      });
    }

    // Flag Submissions (check by submission_id instead)
    console.log('\n🚩 Flag Submissions:');
    let flagSubs = [];
    if (submissions && submissions.length > 0) {
      const submissionIds = submissions.map(s => s.id);
      const { data: flagSubsData, error: flagError } = await supabase
        .from('flag_submissions')
        .select('*')
        .in('submission_id', submissionIds);

      if (flagError) {
        console.log('❌ Error:', flagError.message);
      } else {
        flagSubs = flagSubsData || [];
        if (flagSubs.length === 0) {
          console.log('✅ No flag submissions found');
        } else {
          console.log(`📊 Found ${flagSubs.length} flag submissions`);
          flagSubs.forEach((flag, i) => {
            console.log(`   ${i + 1}. Flag ID: ${flag.flag_id}, Submission ID: ${flag.submission_id || 'None'}`);
          });
        }
      }
    } else {
      console.log('✅ No submissions to check flag submissions for');
    }

    // User Flag Submissions (legacy)
    console.log('\n👤 User Flag Submissions (Legacy):');
    let userFlagSubs = [];
    if (enrollments && enrollments.length > 0) {
      const enrollmentIds = enrollments.map(e => e.id);
      const { data: userFlagSubsData, error: userFlagError } = await supabase
        .from('user_flag_submissions')
        .select('*')
        .in('enrollment_id', enrollmentIds);

      if (userFlagError) {
        console.log('❌ Error:', userFlagError.message);
      } else {
        userFlagSubs = userFlagSubsData || [];
        if (userFlagSubs.length === 0) {
          console.log('✅ No user flag submissions found');
        } else {
          console.log(`📊 Found ${userFlagSubs.length} user flag submissions`);
        }
      }
    } else {
      console.log('✅ No enrollments to check user flag submissions for');
    }

    // =================================================================
    // 3. SIMULATE THE EXACT FLOW FROM INDEX.TSX
    // =================================================================
    console.log('\n3️⃣ Simulating Assessment Flow Logic...');

    // Step 1: Check invitation
    const invitation = invitations && invitations.length > 0 ? invitations[0] : null;
    
    if (!invitation) {
      console.log('❌ REDIRECT CAUSE: No invitation found → would redirect to /challenges');
      
      // Fallback: check enrollment
      const enrollment = enrollments && enrollments.length > 0 ? enrollments[0] : null;
      if (!enrollment) {
        console.log('❌ REDIRECT CAUSE: No enrollment found either → would redirect to /challenges');
        return;
      } else {
        console.log('✅ Fallback enrollment found, continuing...');
      }
    } else {
      console.log('✅ Invitation found, continuing...');
    }

    // Step 2: Check submission status
    const submission = submissions && submissions.length > 0 ? submissions[0] : null;
    
    if (submission) {
      console.log(`\n🔍 Submission Status Analysis:`);
      console.log(`   Current Status: "${submission.status}"`);
      console.log(`   Started At: ${submission.started_at}`);
      console.log(`   Completed At: ${submission.completed_at}`);
      
      if (submission.status === 'STARTED') {
        console.log('❌ REDIRECT CAUSE: Submission status is STARTED → would redirect to /questions');
      } else if (submission.status === 'COMPLETED') {
        console.log('❌ REDIRECT CAUSE: Submission status is COMPLETED → would redirect to /results');
      } else {
        console.log('✅ Submission status is PENDING → would show welcome page');
      }
    } else {
      console.log('✅ No submission found → would show welcome page');
    }

    // Step 3: Check enrollment status for results redirect
    const enrollment = enrollments && enrollments.length > 0 ? enrollments[0] : null;
    
    if (enrollment && enrollment.status === 'COMPLETED') {
      console.log('❌ REDIRECT CAUSE: Enrollment status is COMPLETED → would redirect to /results');
    }

    // =================================================================
    // 4. DELETE ALL PROBLEMATIC DATA
    // =================================================================
    console.log('\n4️⃣ PERMANENTLY FIXING THE ISSUE...');

    let fixApplied = false;

    // Delete all submissions
    if (submissions && submissions.length > 0) {
      console.log('🗑️  Deleting all submissions...');
      for (const sub of submissions) {
        const { error: delError } = await supabase
          .from('submissions')
          .delete()
          .eq('id', sub.id);
        
        if (delError) {
          console.log(`❌ Failed to delete submission ${sub.id}:`, delError.message);
        } else {
          console.log(`✅ Deleted submission ${sub.id}`);
          fixApplied = true;
        }
      }
    }

    // Delete all flag submissions
    if (flagSubs && flagSubs.length > 0) {
      console.log('🗑️  Deleting all flag submissions...');
      for (const flagSub of flagSubs) {
        const { error: delFlagError } = await supabase
          .from('flag_submissions')
          .delete()
          .eq('id', flagSub.id);
        
        if (delFlagError) {
          console.log(`❌ Failed to delete flag submission ${flagSub.id}:`, delFlagError.message);
        } else {
          console.log(`✅ Deleted flag submission ${flagSub.id}`);
          fixApplied = true;
        }
      }
    }

    // Reset enrollment status
    if (enrollment && enrollment.status !== 'ENROLLED') {
      console.log('🔄 Resetting enrollment status...');
      const { error: resetError } = await supabase
        .from('enrollments')
        .update({ 
          status: 'ENROLLED',
          current_score: 0,
          final_score: 0
        })
        .eq('id', enrollment.id);

      if (resetError) {
        console.log('❌ Failed to reset enrollment:', resetError.message);
      } else {
        console.log('✅ Reset enrollment to ENROLLED status');
        fixApplied = true;
      }
    }

    // Delete user flag submissions
    if (userFlagSubs && userFlagSubs.length > 0) {
      console.log('🗑️  Deleting user flag submissions...');
      
      // Get enrollment IDs for this user
      const enrollmentIds = enrollments.map(e => e.id);
      
      for (const enrollmentId of enrollmentIds) {
        const { error: delUserFlagError } = await supabase
          .from('user_flag_submissions')
          .delete()
          .eq('enrollment_id', enrollmentId);
        
        if (delUserFlagError) {
          console.log(`❌ Failed to delete user flag submissions for enrollment ${enrollmentId}:`, delUserFlagError.message);
        } else {
          console.log(`✅ Deleted user flag submissions for enrollment ${enrollmentId}`);
          fixApplied = true;
        }
      }
    }

    // =================================================================
    // 5. VERIFY THE FIX
    // =================================================================
    console.log('\n5️⃣ Verifying the Fix...');

    // Check submissions again
    const { data: finalSubmissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('assessment_id', assessmentId);

    // Check enrollments again
    const { data: finalEnrollments } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);

    console.log(`📊 Final State:`);
    console.log(`   Submissions: ${finalSubmissions?.length || 0}`);
    console.log(`   Enrollments: ${finalEnrollments?.length || 0}`);
    
    if (finalEnrollments && finalEnrollments.length > 0) {
      finalEnrollments.forEach((enr, i) => {
        console.log(`   Enrollment ${i + 1}: Status = ${enr.status}`);
      });
    }

    // =================================================================
    // 6. FINAL ASSESSMENT
    // =================================================================
    console.log('\n🎯 FINAL ASSESSMENT:');
    
    if (fixApplied) {
      console.log('✅ FIXES APPLIED SUCCESSFULLY!');
      console.log('');
      console.log('Expected behavior now:');
      console.log('1. Navigate to the assessment URL');
      console.log('2. See the assessment welcome page');
      console.log('3. Click "Start Assessment" to begin');
      console.log('');
      console.log('🚨 IMPORTANT: Clear your browser cache/cookies for localhost');
      console.log('   Or try opening in incognito mode');
    } else {
      console.log('ℹ️  No problematic data found to fix');
      console.log('');
      console.log('If still redirecting, check:');
      console.log('1. Browser cache - Clear all localhost data');
      console.log('2. Authentication - Make sure you are logged in correctly');
      console.log('3. JavaScript errors in browser console');
      console.log('4. Try incognito mode');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
  }
}

debugRedirectLoop().catch(console.error);
