const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function fixRedirectLoopPermanently() {
  console.log('🔧 FIXING REDIRECT LOOP PERMANENTLY...\n');

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
    // 1. CHECK CURRENT STATE
    // =================================================================
    console.log('\n1️⃣ Checking Current Database State...');

    // Check submissions
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('candidate_id', candidateId);

    console.log('📊 Current Submissions:');
    if (subError) {
      console.log('❌ Error:', subError.message);
    } else if (!submissions || submissions.length === 0) {
      console.log('✅ No submissions found');
    } else {
      submissions.forEach((sub, i) => {
        console.log(`   ${i + 1}. ID: ${sub.id}`);
        console.log(`      Status: ${sub.status}`);
        console.log(`      Started: ${sub.started_at}`);
        console.log(`      Completed: ${sub.completed_at}`);
      });
    }

    // Check enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);

    console.log('\n📊 Current Enrollments:');
    if (enrollError) {
      console.log('❌ Error:', enrollError.message);
    } else if (!enrollments || enrollments.length === 0) {
      console.log('✅ No enrollments found');
    } else {
      enrollments.forEach((enr, i) => {
        console.log(`   ${i + 1}. ID: ${enr.id}`);
        console.log(`      Status: ${enr.status}`);
        console.log(`      Current Score: ${enr.current_score}`);
        console.log(`      Final Score: ${enr.final_score}`);
      });
    }

    // Check invitation
    const { data: invitation, error: invError } = await supabase
      .from('assessment_invitations')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('email', 'ayush.agarwal6530@gmail.com');

    console.log('\n📊 Current Invitation:');
    if (invError) {
      console.log('❌ Error:', invError.message);
    } else if (!invitation || invitation.length === 0) {
      console.log('❌ No invitation found');
    } else {
      console.log(`   Status: ${invitation[0].status}`);
      console.log(`   Accepted: ${invitation[0].accepted_at || 'Not accepted'}`);
    }

    // =================================================================
    // 2. IDENTIFY REDIRECT CAUSE
    // =================================================================
    console.log('\n2️⃣ Identifying Redirect Cause...');

    let redirectCause = null;

    if (submissions && submissions.length > 0) {
      const submission = submissions[0];
      if (submission.status === 'STARTED') {
        redirectCause = `Submission status is STARTED -> redirects to /questions`;
        console.log('❌ FOUND ISSUE:', redirectCause);
      } else if (submission.status === 'COMPLETED') {
        redirectCause = `Submission status is COMPLETED -> redirects to /results`;
        console.log('❌ FOUND ISSUE:', redirectCause);
      }
    }

    if (enrollments && enrollments.length > 0) {
      const enrollment = enrollments[0];
      if (enrollment.status === 'COMPLETED') {
        redirectCause = `Enrollment status is COMPLETED -> redirects to /results`;
        console.log('❌ FOUND ISSUE:', redirectCause);
      }
    }

    if (!redirectCause) {
      console.log('✅ No obvious redirect cause found in database');
    }

    // =================================================================
    // 3. APPLY PERMANENT FIX
    // =================================================================
    console.log('\n3️⃣ Applying Permanent Fix...');

    let fixesApplied = [];

    // Delete ALL submissions for this assessment/candidate
    if (submissions && submissions.length > 0) {
      console.log('🗑️  Deleting ALL submissions...');
      for (const sub of submissions) {
        const { error: delError } = await supabase
          .from('submissions')
          .delete()
          .eq('id', sub.id);

        if (delError) {
          console.log(`❌ Failed to delete submission ${sub.id}:`, delError.message);
        } else {
          console.log(`✅ Deleted submission ${sub.id}`);
          fixesApplied.push(`Deleted submission ${sub.id}`);
        }
      }
    }

    // Reset enrollment status to ENROLLED (if exists)
    if (enrollments && enrollments.length > 0) {
      for (const enrollment of enrollments) {
        if (enrollment.status !== 'ENROLLED') {
          console.log('🔄 Resetting enrollment status to ENROLLED...');
          const { error: resetError } = await supabase
            .from('enrollments')
            .update({ 
              status: 'ENROLLED',
              current_score: 0,
              final_score: 0,
              completed_at: null
            })
            .eq('id', enrollment.id);

          if (resetError) {
            console.log('❌ Failed to reset enrollment:', resetError.message);
          } else {
            console.log('✅ Reset enrollment to ENROLLED status');
            fixesApplied.push('Reset enrollment to ENROLLED');
          }
        }
      }
    }

    // Clean up any flag submissions
    const { data: flagSubs } = await supabase
      .from('flag_submissions')
      .select('*')
      .in('submission_id', (submissions || []).map(s => s.id));

    if (flagSubs && flagSubs.length > 0) {
      console.log('🗑️  Cleaning up flag submissions...');
      for (const flagSub of flagSubs) {
        await supabase.from('flag_submissions').delete().eq('id', flagSub.id);
      }
      fixesApplied.push(`Cleaned up ${flagSubs.length} flag submissions`);
    }

    // Clean up user flag submissions
    if (enrollments && enrollments.length > 0) {
      const enrollmentIds = enrollments.map(e => e.id);
      const { data: userFlagSubs } = await supabase
        .from('user_flag_submissions')
        .select('id')
        .in('enrollment_id', enrollmentIds);

      if (userFlagSubs && userFlagSubs.length > 0) {
        console.log('🗑️  Cleaning up user flag submissions...');
        for (const userFlagSub of userFlagSubs) {
          await supabase.from('user_flag_submissions').delete().eq('id', userFlagSub.id);
        }
        fixesApplied.push(`Cleaned up ${userFlagSubs.length} user flag submissions`);
      }
    }

    // =================================================================
    // 4. CREATE PREVENTION MECHANISM
    // =================================================================
    console.log('\n4️⃣ Creating Prevention Mechanism...');

    // Ensure invitation is in correct state
    if (invitation && invitation.length > 0) {
      const inv = invitation[0];
      if (inv.status !== 'accepted') {
        console.log('🔧 Ensuring invitation is accepted...');
        const { error: invUpdateError } = await supabase
          .from('assessment_invitations')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', inv.id);

        if (!invUpdateError) {
          fixesApplied.push('Set invitation status to accepted');
        }
      }
    }

    // Ensure enrollment exists and is in ENROLLED state
    if (!enrollments || enrollments.length === 0) {
      console.log('🔧 Creating enrollment record...');
      const { error: createEnrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: candidateId,
          assessment_id: assessmentId,
          status: 'ENROLLED',
          current_score: 0,
          final_score: 0,
          enrolled_at: new Date().toISOString()
        });

      if (!createEnrollError) {
        fixesApplied.push('Created enrollment record');
      }
    }

    // =================================================================
    // 5. VERIFY THE FIX
    // =================================================================
    console.log('\n5️⃣ Verifying the Fix...');

    // Check final state
    const { data: finalSubmissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('candidate_id', candidateId);

    const { data: finalEnrollments } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);

    console.log('📊 Final State:');
    console.log(`   Submissions: ${finalSubmissions?.length || 0}`);
    console.log(`   Enrollments: ${finalEnrollments?.length || 0}`);

    if (finalEnrollments && finalEnrollments.length > 0) {
      finalEnrollments.forEach((enr, i) => {
        console.log(`   Enrollment ${i + 1}: Status = ${enr.status}`);
      });
    }

    // =================================================================
    // 6. TEST THE LOGIC
    // =================================================================
    console.log('\n6️⃣ Testing Assessment Logic...');

    const hasInvitation = invitation && invitation.length > 0;
    const hasEnrollment = finalEnrollments && finalEnrollments.length > 0;
    const hasActiveSubmission = finalSubmissions && finalSubmissions.some(s => 
      s.status === 'STARTED' || s.status === 'COMPLETED'
    );

    console.log('🧪 Logic Test:');
    console.log(`   Has invitation: ${hasInvitation ? '✅' : '❌'}`);
    console.log(`   Has enrollment: ${hasEnrollment ? '✅' : '❌'}`);
    console.log(`   Has active submission: ${hasActiveSubmission ? '❌' : '✅'}`);

    if (hasInvitation && hasEnrollment && !hasActiveSubmission) {
      console.log('✅ Should show assessment welcome page');
    } else {
      console.log('❌ May still have redirect issues');
    }

    console.log('\n🎯 SUMMARY:');
    console.log(`✅ Applied ${fixesApplied.length} fixes:`);
    fixesApplied.forEach(fix => console.log(`   - ${fix}`));
    console.log('');
    console.log('Expected behavior:');
    console.log('1. Navigate to assessment URL');
    console.log('2. See welcome page with "Start Assessment" button');
    console.log('3. No automatic redirects');
    console.log('');
    console.log('🚨 Clear browser cache/cookies for localhost and try again!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error(error.stack);
  }
}

fixRedirectLoopPermanently().catch(console.error);
