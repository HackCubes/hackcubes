const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debugAssessmentRedirectIssue() {
  console.log('🔍 Debugging Assessment Redirect Issue...\n');

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
    const candidateId = 'f8494a8b-ec32-4363-a8ad-1984e9263bef';

    console.log('🎯 Debugging Assessment ID:', assessmentId);
    console.log('👤 Candidate Email:', candidateEmail);
    console.log('🆔 Candidate ID:', candidateId);

    // =================================================================
    // 1. CHECK ASSESSMENT DATA
    // =================================================================
    console.log('\n1️⃣ Checking Assessment Data...');
    
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError) {
      console.log('❌ Assessment not found:', assessmentError.message);
      return;
    }

    console.log('✅ Assessment found:', assessment.name);
    console.log('📊 Assessment details:');
    console.log('   - Status: Active');
    console.log('   - Duration:', assessment.duration_in_minutes, 'minutes');
    console.log('   - Max Score:', assessment.max_score);
    console.log('   - Active From:', new Date(assessment.active_from).toLocaleString());
    console.log('   - Active To:', new Date(assessment.active_to).toLocaleString());
    
    // Check if assessment is currently active
    const now = new Date();
    const activeFrom = new Date(assessment.active_from);
    const activeTo = new Date(assessment.active_to);
    
    if (now < activeFrom) {
      console.log('⚠️  ISSUE: Assessment has not started yet!');
    } else if (now > activeTo) {
      console.log('⚠️  ISSUE: Assessment has expired!');
    } else {
      console.log('✅ Assessment is currently active');
    }

    // =================================================================
    // 2. CHECK INVITATION DATA
    // =================================================================
    console.log('\n2️⃣ Checking Invitation Data...');
    
    const { data: invitation, error: invitationError } = await supabase
      .from('assessment_invitations')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('email', candidateEmail);

    if (invitationError) {
      console.log('❌ Invitation query error:', invitationError.message);
    } else if (!invitation || invitation.length === 0) {
      console.log('⚠️  ISSUE: No invitation found for this email!');
      console.log('💡 This might cause redirect to /challenges');
    } else {
      console.log('✅ Invitation found:');
      invitation.forEach((inv, index) => {
        console.log(`   ${index + 1}. Status: ${inv.status}, Invited: ${new Date(inv.invited_at).toLocaleString()}`);
      });
    }

    // =================================================================
    // 3. CHECK ENROLLMENT DATA (FALLBACK)
    // =================================================================
    console.log('\n3️⃣ Checking Enrollment Data (Fallback)...');
    
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);

    if (enrollmentError) {
      console.log('❌ Enrollment query error:', enrollmentError.message);
    } else if (!enrollments || enrollments.length === 0) {
      console.log('⚠️  ISSUE: No enrollment found for this user!');
      console.log('💡 User needs either invitation or enrollment to access assessment');
    } else {
      console.log('✅ Enrollment found:');
      enrollments.forEach((enr, index) => {
        console.log(`   ${index + 1}. Status: ${enr.status}, Created: ${new Date(enr.created_at).toLocaleString()}`);
      });
    }

    // =================================================================
    // 4. CHECK SUBMISSION DATA
    // =================================================================
    console.log('\n4️⃣ Checking Submission Data...');
    
    const { data: submissions, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('candidate_id', candidateId);

    if (submissionError) {
      console.log('❌ Submission query error:', submissionError.message);
    } else if (!submissions || submissions.length === 0) {
      console.log('ℹ️  No submissions found (this is normal for new assessment)');
    } else {
      console.log('✅ Submissions found:');
      submissions.forEach((sub, index) => {
        console.log(`   ${index + 1}. Status: ${sub.status}, Started: ${sub.started_at ? new Date(sub.started_at).toLocaleString() : 'Not started'}`);
        
        if (sub.status === 'STARTED') {
          console.log('⚠️  ISSUE: Submission already started - this might cause redirect to questions page');
        }
      });
    }

    // =================================================================
    // 5. CHECK USER AUTHENTICATION
    // =================================================================
    console.log('\n5️⃣ Checking User Authentication...');
    
    // Try to find the user
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', candidateId);

    if (usersError) {
      console.log('❌ User profile query error:', usersError.message);
    } else if (!users || users.length === 0) {
      console.log('⚠️  ISSUE: User profile not found!');
      console.log('💡 User might not be properly authenticated');
    } else {
      console.log('✅ User profile found:', users[0].email || 'No email');
    }

    // =================================================================
    // 6. ANALYZE REDIRECT LOGIC
    // =================================================================
    console.log('\n6️⃣ Analyzing Redirect Logic...');
    
    console.log('🔍 Based on the code logic in index.tsx:');
    
    // Check what would happen in the validateAccess function
    if (!invitation || invitation.length === 0) {
      if (!enrollments || enrollments.length === 0) {
        console.log('❌ REDIRECT CAUSE: No invitation AND no enrollment found');
        console.log('   → Will redirect to /challenges');
        console.log('   → FIX: Create invitation or enrollment for this user');
      } else {
        console.log('✅ Fallback to enrollment system would work');
      }
    } else {
      // Check if submission exists and is started
      if (submissions && submissions.length > 0) {
        const startedSubmission = submissions.find(s => s.status === 'STARTED');
        if (startedSubmission) {
          console.log('❌ REDIRECT CAUSE: Submission already in STARTED status');
          console.log('   → Will redirect to /assessments/{id}/questions');
          console.log('   → This might be the redirect loop you\'re seeing');
        }
      }
    }

    // =================================================================
    // 7. PROVIDE SPECIFIC FIXES
    // =================================================================
    console.log('\n7️⃣ Recommended Fixes...');
    
    if (!invitation || invitation.length === 0) {
      console.log('🔧 FIX 1: Create invitation for user');
      console.log(`   INSERT INTO assessment_invitations (assessment_id, email, status) VALUES ('${assessmentId}', '${candidateEmail}', 'pending');`);
    }
    
    if (!enrollments || enrollments.length === 0) {
      console.log('🔧 FIX 2: Create enrollment for user (fallback)');
      console.log(`   INSERT INTO enrollments (user_id, assessment_id, status, max_possible_score) VALUES ('${candidateId}', '${assessmentId}', 'ENROLLED', ${assessment.max_score});`);
    }
    
    if (submissions && submissions.length > 0) {
      const startedSubmission = submissions.find(s => s.status === 'STARTED');
      if (startedSubmission) {
        console.log('🔧 FIX 3: Reset submission status if stuck');
        console.log(`   UPDATE submissions SET status = 'PENDING' WHERE id = '${startedSubmission.id}';`);
      }
    }

    // =================================================================
    // 8. CREATE INVITATION IF MISSING
    // =================================================================
    if (!invitation || invitation.length === 0) {
      console.log('\n8️⃣ Creating missing invitation...');
      
      try {
        const { data: newInvitation, error: createInvError } = await supabase
          .from('assessment_invitations')
          .insert({
            assessment_id: assessmentId,
            email: candidateEmail,
            status: 'pending',
            invited_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createInvError) {
          console.log('❌ Failed to create invitation:', createInvError.message);
        } else {
          console.log('✅ Invitation created successfully:', newInvitation.id);
        }
      } catch (e) {
        console.log('❌ Exception creating invitation:', e.message);
      }
    }

    console.log('\n🎯 SUMMARY:');
    console.log('After running this debug, try accessing the assessment again.');
    console.log('If still redirecting, check the browser console for JavaScript errors.');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAssessmentRedirectIssue().catch(console.error);
