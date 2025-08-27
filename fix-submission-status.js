const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function fixSubmissionStatusAndTest() {
  console.log('🔧 Fixing Submission Status and Testing Flow...\n');

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
    // 1. RESET SUBMISSION STATUS TO PENDING
    // =================================================================
    console.log('\n1️⃣ Resetting Submission Status...');
    
    const { data: submissions, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('assessment_id', assessmentId);

    if (submissionError) {
      console.log('❌ Error fetching submissions:', submissionError.message);
      return;
    }

    if (!submissions || submissions.length === 0) {
      console.log('ℹ️  No submissions found');
    } else {
      console.log('📊 Found submissions:', submissions.length);
      
      for (const submission of submissions) {
        console.log(`   - ID: ${submission.id}, Status: ${submission.status}`);
        
        if (submission.status === 'STARTED' || submission.status === 'COMPLETED') {
          try {
            const { error: resetError } = await supabase
              .from('submissions')
              .update({ 
                status: 'PENDING',
                started_at: null,
                completed_at: null,
                current_score: 0,
                progress_percentage: 0.0
              })
              .eq('id', submission.id);

            if (resetError) {
              console.log(`❌ Failed to reset submission ${submission.id}:`, resetError.message);
            } else {
              console.log(`✅ Reset submission ${submission.id} to PENDING`);
            }
          } catch (e) {
            console.log(`❌ Exception resetting submission ${submission.id}:`, e.message);
          }
        }
      }
    }

    // =================================================================
    // 2. RESET ENROLLMENT STATUS
    // =================================================================
    console.log('\n2️⃣ Checking and Resetting Enrollment Status...');
    
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);

    if (enrollmentError) {
      console.log('❌ Error fetching enrollments:', enrollmentError.message);
    } else if (!enrollments || enrollments.length === 0) {
      console.log('ℹ️  No enrollments found');
    } else {
      console.log('📊 Found enrollments:', enrollments.length);
      
      for (const enrollment of enrollments) {
        console.log(`   - ID: ${enrollment.id}, Status: ${enrollment.status}`);
        
        if (enrollment.status === 'COMPLETED' || enrollment.status === 'IN_PROGRESS') {
          try {
            const { error: resetError } = await supabase
              .from('enrollments')
              .update({ 
                status: 'ENROLLED',
                current_score: 0,
                final_score: 0
              })
              .eq('id', enrollment.id);

            if (resetError) {
              console.log(`❌ Failed to reset enrollment ${enrollment.id}:`, resetError.message);
            } else {
              console.log(`✅ Reset enrollment ${enrollment.id} to ENROLLED`);
            }
          } catch (e) {
            console.log(`❌ Exception resetting enrollment ${enrollment.id}:`, e.message);
          }
        }
      }
    }

    // =================================================================
    // 3. TEST THE FLOW LOGIC
    // =================================================================
    console.log('\n3️⃣ Testing Assessment Flow Logic...');
    
    // Simulate the logic from index.tsx
    const candidateEmail = 'ayush.agarwal6530@gmail.com';
    
    console.log('🧪 Step 1: Check invitation...');
    const { data: invitationData, error: invitationError } = await supabase
      .from('assessment_invitations')
      .select('id, status, invited_at')
      .eq('assessment_id', assessmentId)
      .eq('email', candidateEmail)
      .single();

    if (invitationError || !invitationData) {
      console.log('❌ No invitation found - would redirect to /challenges');
      
      // Check fallback enrollment
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', candidateId)
        .eq('assessment_id', assessmentId)
        .single();
        
      if (!enrollmentData) {
        console.log('❌ No enrollment found either - would redirect to /challenges');
      } else {
        console.log('✅ Fallback enrollment found:', enrollmentData.status);
      }
    } else {
      console.log('✅ Invitation found:', invitationData.status);
      
      console.log('🧪 Step 2: Check existing submission...');
      const { data: submissionData } = await supabase
        .from('submissions')
        .select('id, status, started_at, expires_at, current_score, progress_percentage')
        .eq('assessment_id', assessmentId)
        .eq('candidate_id', candidateId)
        .single();

      if (submissionData && submissionData.status === 'STARTED') {
        console.log('❌ Submission is STARTED - would redirect to /questions');
      } else if (submissionData && submissionData.status === 'COMPLETED') {
        console.log('❌ Submission is COMPLETED - would redirect to /results');
      } else {
        console.log('✅ Submission is PENDING or not found - would show welcome page');
      }
    }

    // =================================================================
    // 4. VERIFY FINAL STATE
    // =================================================================
    console.log('\n4️⃣ Verifying Final State...');
    
    // Final check of all data
    const { data: finalSubmissions } = await supabase
      .from('submissions')
      .select('id, status, started_at, completed_at')
      .eq('candidate_id', candidateId)
      .eq('assessment_id', assessmentId);

    const { data: finalEnrollments } = await supabase
      .from('enrollments')
      .select('id, status, current_score, final_score')
      .eq('user_id', candidateId)
      .eq('assessment_id', assessmentId);

    console.log('📊 Final Submissions:');
    finalSubmissions?.forEach((sub, index) => {
      console.log(`   ${index + 1}. Status: ${sub.status}, Started: ${sub.started_at || 'None'}`);
    });

    console.log('📊 Final Enrollments:');
    finalEnrollments?.forEach((enr, index) => {
      console.log(`   ${index + 1}. Status: ${enr.status}, Score: ${enr.current_score}`);
    });

    // =================================================================
    // 5. CHECK FOR RESULTS PAGE REDIRECT CAUSE
    // =================================================================
    console.log('\n5️⃣ Analyzing Results Page Redirect...');
    
    // The results redirect happens when enrollment status is COMPLETED
    const hasCompletedEnrollment = finalEnrollments?.some(e => e.status === 'COMPLETED');
    const hasCompletedSubmission = finalSubmissions?.some(s => s.status === 'COMPLETED');
    
    if (hasCompletedEnrollment) {
      console.log('❌ FOUND ISSUE: Enrollment with COMPLETED status still exists');
    } else if (hasCompletedSubmission) {
      console.log('❌ FOUND ISSUE: Submission with COMPLETED status still exists');
    } else {
      console.log('✅ No COMPLETED statuses found - should not redirect to results');
    }

    console.log('\n🎯 SUMMARY:');
    console.log('If you are still getting redirected to /results, it might be:');
    console.log('1. Browser cache - Clear all localhost data');
    console.log('2. JavaScript error - Check browser console');
    console.log('3. Authentication issue - Make sure you\'re logged in as the right user');
    console.log('4. Router state issue - Try opening in incognito mode');
    console.log('');
    console.log('Expected flow now:');
    console.log('✅ Assessment welcome page should load');
    console.log('✅ "Start Assessment" button should be visible');
    console.log('✅ Clicking it should navigate to questions page');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixSubmissionStatusAndTest().catch(console.error);
