const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function executeDatabaseFixAndTest() {
  console.log('🔧 Executing Database Fix and Testing...\n');

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

    const supabase = createClient(supabaseUrl, supabaseKey);

    // =================================================================
    // 1. TRY TO EXECUTE DATABASE FIXES VIA RPC
    // =================================================================
    console.log('1️⃣ Attempting to execute database fixes...\n');
    
    const fixes = [
      {
        name: 'Add final_score to enrollments',
        sql: `
          DO $$ 
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                             WHERE table_name = 'enrollments' AND column_name = 'final_score') THEN
                  ALTER TABLE enrollments ADD COLUMN final_score INTEGER DEFAULT 0;
              END IF;
          END $$;
        `
      },
      {
        name: 'Add progress_percentage to submissions',
        sql: `
          DO $$ 
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                             WHERE table_name = 'submissions' AND column_name = 'progress_percentage') THEN
                  ALTER TABLE submissions ADD COLUMN progress_percentage DECIMAL(5,2) DEFAULT 0.0;
              END IF;
          END $$;
        `
      },
      {
        name: 'Create user_flag_submissions table',
        sql: `
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
        `
      },
      {
        name: 'Add submission_id to flag_submissions',
        sql: `
          DO $$ 
          BEGIN
              IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flag_submissions') THEN
                  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                 WHERE table_name = 'flag_submissions' AND column_name = 'submission_id') THEN
                      ALTER TABLE flag_submissions ADD COLUMN submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE;
                  END IF;
              END IF;
          END $$;
        `
      }
    ];

    for (const fix of fixes) {
      console.log(`🔧 Attempting: ${fix.name}`);
      try {
        // Try using RPC to execute SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: fix.sql });
        
        if (error) {
          console.log(`❌ RPC exec_sql failed for ${fix.name}:`, error.message);
          
          // Try alternative approach - create a function and call it
          try {
            const functionName = `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const createFunctionSQL = `
              CREATE OR REPLACE FUNCTION ${functionName}()
              RETURNS void AS $$
              ${fix.sql}
              $$ LANGUAGE sql;
            `;
            
            // This will also likely fail, but let's try
            const { error: funcError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
            if (!funcError) {
              const { error: callError } = await supabase.rpc(functionName);
              if (!callError) {
                console.log(`✅ ${fix.name} - Applied via function`);
              } else {
                console.log(`❌ ${fix.name} - Function call failed:`, callError.message);
              }
            } else {
              console.log(`❌ ${fix.name} - Function creation failed:`, funcError.message);
            }
          } catch (altError) {
            console.log(`❌ ${fix.name} - Alternative approach failed:`, altError.message);
          }
        } else {
          console.log(`✅ ${fix.name} - Applied successfully`);
        }
      } catch (e) {
        console.log(`❌ ${fix.name} - Exception:`, e.message);
      }
    }

    // =================================================================
    // 2. TEST CURRENT DATABASE STATE
    // =================================================================
    console.log('\n2️⃣ Testing current database state...\n');
    
    const tests = [
      {
        name: 'enrollments.final_score',
        test: async () => {
          const { data, error } = await supabase
            .from('enrollments')
            .select('id, final_score')
            .limit(1);
          return { success: !error, error: error?.message, data };
        }
      },
      {
        name: 'submissions.progress_percentage',
        test: async () => {
          const { data, error } = await supabase
            .from('submissions')
            .select('id, progress_percentage')
            .limit(1);
          return { success: !error, error: error?.message, data };
        }
      },
      {
        name: 'flag_submissions.submission_id',
        test: async () => {
          const { data, error } = await supabase
            .from('flag_submissions')
            .select('id, submission_id')
            .limit(1);
          return { success: !error, error: error?.message, data };
        }
      },
      {
        name: 'user_flag_submissions table',
        test: async () => {
          const { data, error } = await supabase
            .from('user_flag_submissions')
            .select('id')
            .limit(1);
          return { success: !error, error: error?.message, data };
        }
      }
    ];

    for (const test of tests) {
      console.log(`🧪 Testing: ${test.name}`);
      try {
        const result = await test.test();
        if (result.success) {
          console.log(`✅ ${test.name} - Working`);
        } else {
          console.log(`❌ ${test.name} - Failed: ${result.error}`);
        }
      } catch (e) {
        console.log(`❌ ${test.name} - Exception: ${e.message}`);
      }
    }

    // =================================================================
    // 3. SIMULATE THE FAILING API CALLS
    // =================================================================
    console.log('\n3️⃣ Simulating failing API calls...\n');
    
    // Get a real assessment and user for testing
    const { data: testAssessment } = await supabase
      .from('assessments')
      .select('id, name')
      .limit(1)
      .single();

    if (testAssessment) {
      console.log(`🎯 Using test assessment: ${testAssessment.name}`);
      
      // Test 1: Create a test enrollment
      console.log('🧪 Testing enrollment creation...');
      try {
        const testEnrollment = {
          user_id: '00000000-0000-0000-0000-000000000000',
          assessment_id: testAssessment.id,
          status: 'ENROLLED',
          max_possible_score: 100,
          current_score: 0,
          final_score: 0
        };

        const { data: newEnrollment, error: enrollError } = await supabase
          .from('enrollments')
          .insert(testEnrollment)
          .select()
          .single();

        if (enrollError) {
          console.log('❌ Enrollment creation failed:', enrollError.message);
        } else {
          console.log('✅ Enrollment created:', newEnrollment.id);
          
          // Test 2: Create a test submission
          console.log('🧪 Testing submission creation...');
          try {
            const testSubmission = {
              assessment_id: testAssessment.id,
              candidate_id: '00000000-0000-0000-0000-000000000000',
              status: 'STARTED',
              type: 'CTF',
              progress_percentage: 0.0,
              total_score: 0,
              current_score: 0
            };

            const { data: newSubmission, error: submissionError } = await supabase
              .from('submissions')
              .insert(testSubmission)
              .select()
              .single();

            if (submissionError) {
              console.log('❌ Submission creation failed:', submissionError.message);
            } else {
              console.log('✅ Submission created:', newSubmission.id);
              
              // Test 3: Test flag_submissions with submission_id
              console.log('🧪 Testing flag_submissions query...');
              const { data: flagSubs, error: flagError } = await supabase
                .from('flag_submissions')
                .select('*')
                .eq('submission_id', newSubmission.id);

              if (flagError) {
                console.log('❌ Flag_submissions query failed:', flagError.message);
              } else {
                console.log('✅ Flag_submissions query successful');
              }

              // Test 4: Test user_flag_submissions
              console.log('🧪 Testing user_flag_submissions query...');
              const { data: userFlagSubs, error: userFlagError } = await supabase
                .from('user_flag_submissions')
                .select('*')
                .eq('enrollment_id', newEnrollment.id);

              if (userFlagError) {
                console.log('❌ User_flag_submissions query failed:', userFlagError.message);
              } else {
                console.log('✅ User_flag_submissions query successful');
              }

              // Cleanup
              await supabase.from('submissions').delete().eq('id', newSubmission.id);
              console.log('🧹 Test submission cleaned up');
            }
          } catch (e) {
            console.log('❌ Submission test exception:', e.message);
          }

          // Cleanup enrollment
          await supabase.from('enrollments').delete().eq('id', newEnrollment.id);
          console.log('🧹 Test enrollment cleaned up');
        }
      } catch (e) {
        console.log('❌ Enrollment test exception:', e.message);
      }
    } else {
      console.log('❌ No test assessment found');
    }

    // =================================================================
    // 4. PROVIDE MANUAL SQL TO RUN
    // =================================================================
    console.log('\n4️⃣ Manual SQL to run in Supabase SQL Editor:\n');
    console.log('=' * 60);
    console.log(fs.readFileSync('complete-database-fix.sql', 'utf8'));
    console.log('=' * 60);

  } catch (error) {
    console.error('❌ Database fix and test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the fix and test
executeDatabaseFixAndTest().catch(console.error);
