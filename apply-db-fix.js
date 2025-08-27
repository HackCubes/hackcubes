const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDatabaseFix() {
  try {
    console.log('Reading database fix SQL...');
    const sqlContent = fs.readFileSync('complete-database-fix.sql', 'utf8');
    
    console.log('Applying database fix...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Error applying database fix:', error);
      
      // Try applying parts of the SQL manually
      console.log('Trying to apply user_flag_submissions table and policies manually...');
      
      // Create user_flag_submissions table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_flag_submissions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
          question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
          flag_id UUID REFERENCES flags(id) ON DELETE CASCADE,
          submitted_answer TEXT NOT NULL,
          is_correct BOOLEAN DEFAULT FALSE,
          points_awarded INTEGER DEFAULT 0,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (createError) {
        console.error('Error creating table:', createError);
      } else {
        console.log('✅ Table created successfully');
      }
      
      // Enable RLS
      const rlsSQL = `
        ALTER TABLE user_flag_submissions ENABLE ROW LEVEL SECURITY;
      `;
      
      const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
      if (rlsError) {
        console.error('Error enabling RLS:', rlsError);
      } else {
        console.log('✅ RLS enabled successfully');
      }
      
      // Create policies
      const policiesSQL = `
        DROP POLICY IF EXISTS "Users can view their own submissions" ON user_flag_submissions;
        CREATE POLICY "Users can view their own submissions" ON user_flag_submissions
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM enrollments e 
              WHERE e.id = user_flag_submissions.enrollment_id 
              AND e.user_id = auth.uid()
            )
          );

        DROP POLICY IF EXISTS "Users can create their own submissions" ON user_flag_submissions;
        CREATE POLICY "Users can create their own submissions" ON user_flag_submissions
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM enrollments e 
              WHERE e.id = user_flag_submissions.enrollment_id 
              AND e.user_id = auth.uid()
            )
          );

        DROP POLICY IF EXISTS "Users can update their own submissions" ON user_flag_submissions;
        CREATE POLICY "Users can update their own submissions" ON user_flag_submissions
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM enrollments e 
              WHERE e.id = user_flag_submissions.enrollment_id 
              AND e.user_id = auth.uid()
            )
          );
      `;
      
      const { error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
      if (policiesError) {
        console.error('Error creating policies:', policiesError);
      } else {
        console.log('✅ RLS policies created successfully');
      }
      
    } else {
      console.log('✅ Database fix applied successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

applyDatabaseFix();
