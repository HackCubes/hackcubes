const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAssessmentReportsTable() {
  try {
    console.log('🔍 Checking assessment_reports table structure...');

    // Check if the table exists by trying to select from it
    const { data, error } = await supabase
      .from('assessment_reports')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing assessment_reports table:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      if (error.code === '42P01') {
        console.log('📝 Table does not exist. Let me create it...');
        
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.assessment_reports (
            id BIGSERIAL PRIMARY KEY,
            enrollment_id BIGINT REFERENCES public.enrollments(id),
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            assessment_id BIGINT NOT NULL,
            report_file_url TEXT NOT NULL,
            report_file_name TEXT NOT NULL,
            report_file_size BIGINT NOT NULL,
            submitted_at TIMESTAMPTZ DEFAULT NOW(),
            submission_deadline TIMESTAMPTZ NOT NULL,
            status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'reviewed', 'approved', 'rejected')),
            final_score DECIMAL(5,2),
            is_passed BOOLEAN,
            admin_review_notes TEXT,
            reviewed_at TIMESTAMPTZ,
            certificate_issued BOOLEAN DEFAULT FALSE,
            certificate_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_assessment_reports_user_id ON public.assessment_reports(user_id);
          CREATE INDEX IF NOT EXISTS idx_assessment_reports_assessment_id ON public.assessment_reports(assessment_id);
          CREATE INDEX IF NOT EXISTS idx_assessment_reports_enrollment_id ON public.assessment_reports(enrollment_id);
          CREATE INDEX IF NOT EXISTS idx_assessment_reports_status ON public.assessment_reports(status);

          -- Enable RLS
          ALTER TABLE public.assessment_reports ENABLE ROW LEVEL SECURITY;

          -- Create RLS policies
          CREATE POLICY "Users can view their own reports" ON public.assessment_reports
            FOR SELECT USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own reports" ON public.assessment_reports
            FOR INSERT WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can update their own reports" ON public.assessment_reports
            FOR UPDATE USING (auth.uid() = user_id);
        `;

        // Execute the SQL to create table
        const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });
        
        if (createError) {
          console.error('❌ Error creating table:', createError);
        } else {
          console.log('✅ assessment_reports table created successfully');
        }
      }
    } else {
      console.log('✅ assessment_reports table exists');
      console.log('📊 Sample data count:', data.length);
      if (data.length > 0) {
        console.log('📋 Sample record structure:', Object.keys(data[0]));
      }
    }

    // Also check for the table structure using information_schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'assessment_reports' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (!columnsError && columns) {
      console.log('\n📋 Table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAssessmentReportsTable();
