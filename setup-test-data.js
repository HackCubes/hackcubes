const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupTestData() {
  // Try to get environment variables
  let supabaseUrl, supabaseServiceKey;
  
  try {
    const fs = require('fs');
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  } catch (e) {
    console.log('Could not read .env.local, trying process.env...');
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Setting up test data...');

  try {
    // 1. Create assessment_invitations table if it doesn't exist
    console.log('1. Creating assessment_invitations table...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS assessment_invitations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        invited_by UUID REFERENCES auth.users(id),
        invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed')),
        enrollment_id UUID REFERENCES user_enrollments(id) ON DELETE SET NULL,
        UNIQUE(assessment_id, email)
      );
      
      ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "invitation_policy" ON assessment_invitations 
        FOR ALL USING (true);
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (createError) {
      console.log('Table might already exist or RPC not available:', createError.message);
    } else {
      console.log('✓ assessment_invitations table created');
    }

    // 2. Get or create a test user
    console.log('2. Getting admin user...');
    const { data: users } = await supabase.auth.admin.listUsers();
    let adminUser = users?.users?.[0];
    
    if (!adminUser) {
      console.log('No users found, creating test admin...');
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: 'admin@hackcubes.com',
        password: 'admin123456',
        email_confirm: true
      });
      
      if (userError) {
        console.error('Error creating user:', userError);
        process.exit(1);
      }
      adminUser = newUser.user;
    }

    console.log('✓ Using admin user:', adminUser.email);

    // 3. Create a test assessment
    console.log('3. Creating test assessment...');
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test CTF Assessment',
        description: 'A test assessment for invitation functionality',
        status: 'ACTIVE',
        created_by: adminUser.id,
        active_from: new Date().toISOString(),
        active_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        duration_in_minutes: 120
      }, { onConflict: 'id' })
      .select()
      .single();

    if (assessmentError) {
      console.error('Error creating assessment:', assessmentError);
      process.exit(1);
    }

    console.log('✓ Test assessment created:', assessment.name);

    // 4. Create a section for the assessment
    console.log('4. Creating test section...');
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        assessment_id: assessment.id,
        name: 'Web Security',
        description: 'Web security challenges',
        order_index: 1
      }, { onConflict: 'id' })
      .select()
      .single();

    if (sectionError) {
      console.error('Error creating section:', sectionError);
      process.exit(1);
    }

    console.log('✓ Test section created:', section.name);

    // 5. Create test challenges
    console.log('5. Creating test challenges...');
    const challenges = [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        section_id: section.id,
        name: 'SQL Injection Basic',
        description: 'Find the SQL injection vulnerability',
        category: 'web',
        difficulty: 'easy',
        score: 100,
        no_of_flags: 1,
        type: 'web',
        tags: ['sql', 'injection', 'web'],
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        section_id: section.id,
        name: 'XSS Challenge',
        description: 'Exploit the XSS vulnerability',
        category: 'web',
        difficulty: 'medium',
        score: 200,
        no_of_flags: 2,
        type: 'web',
        tags: ['xss', 'javascript', 'web'],
        is_active: true
      }
    ];

    for (const challenge of challenges) {
      const { error: challengeError } = await supabase
        .from('questions')
        .upsert(challenge, { onConflict: 'id' });

      if (challengeError) {
        console.error('Error creating challenge:', challengeError);
      } else {
        console.log(`✓ Challenge created: ${challenge.name}`);
      }
    }

    // 6. Create test invitations
    console.log('6. Creating test invitations...');
    const testEmails = [
      'candidate1@example.com',
      'candidate2@example.com',
      'test@example.com'
    ];

    for (const email of testEmails) {
      const { error: inviteError } = await supabase
        .from('assessment_invitations')
        .upsert({
          assessment_id: assessment.id,
          email: email,
          invited_by: adminUser.id,
          status: 'pending'
        }, { onConflict: 'assessment_id,email' });

      if (inviteError) {
        console.error(`Error creating invitation for ${email}:`, inviteError);
      } else {
        console.log(`✓ Invitation created for: ${email}`);
      }
    }

    console.log('\n🎉 Test data setup complete!');
    console.log('\nYou can now:');
    console.log('1. Login as admin@hackcubes.com (password: admin123456)');
    console.log('2. Go to /admin/assessments/550e8400-e29b-41d4-a716-446655440000 to test invitation features');
    console.log('3. Login as test@example.com to test candidate view');
    console.log('4. Go to /challenges to see filtered challenges');

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupTestData().catch(console.error);
