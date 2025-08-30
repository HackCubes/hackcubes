require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDB() {
  const assessmentId = '533d4e96-fe35-4540-9798-162b3f261572';
  const candidateId = '77b7ee7c-828d-42b6-b84e-f919174ce1eb';

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', candidateId);
  console.log('Enrollments:', enrollments);

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('candidate_id', candidateId);
  console.log('Submissions:', submissions);

  if (submissions && submissions.length > 0) {
    const { data: flagSubmissions } = await supabase
      .from('flag_submissions')
      .select('*')
      .eq('submission_id', submissions[0].id);
    console.log('Flag Submissions:', flagSubmissions);
  }

  const { data: userFlagSubmissions } = await supabase
    .from('user_flag_submissions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', candidateId);
  console.log('User Flag Submissions:', userFlagSubmissions);
}

checkDB(); 