const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createAssessmentInvitationsTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Creating assessment_invitations table...');

  try {
    // First, let's check if the table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'assessment_invitations');

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      process.exit(1);
    }

    if (tables && tables.length > 0) {
      console.log('✓ assessment_invitations table already exists!');
      process.exit(0);
    }

    // Table doesn't exist, let's create it using direct SQL
    console.log('Table does not exist, creating...');
    
    // Use multiple small queries
    const queries = [
      `CREATE TABLE assessment_invitations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        invited_by UUID REFERENCES auth.users(id),
        invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed')),
        enrollment_id UUID REFERENCES user_enrollments(id) ON DELETE SET NULL,
        UNIQUE(assessment_id, email)
      )`,
      `ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY`,
      `CREATE POLICY "assessment_invitations_select" ON assessment_invitations FOR SELECT USING (true)`,
      `CREATE POLICY "assessment_invitations_insert" ON assessment_invitations FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "assessment_invitations_update" ON assessment_invitations FOR UPDATE USING (true)`,
      `CREATE POLICY "assessment_invitations_delete" ON assessment_invitations FOR DELETE USING (true)`
    ];

    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error('Error executing query:', query);
        console.error('Error:', error);
        process.exit(1);
      }
    }

    console.log('✓ assessment_invitations table created successfully!');
    console.log('✓ RLS policies applied successfully!');

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }

  process.exit(0);
}

createAssessmentInvitationsTable().catch(console.error);
