const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the 6 web security challenges from WebChallenges folder
const webChallenges = [
  {
    name: 'AchieveRewards',
    description: 'Race condition vulnerability challenge - exploit timing attacks to gain unauthorized rewards',
    category: 'Web Security',
    difficulty: 'MEDIUM',
    score: 150,
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/achieverewards:latest',
    deployment_type: 'kubernetes',
    ports: [5000],
    tags: ['race-condition', 'timing-attack', 'web', 'flask', 'python'],
    hints: [
      'Look for operations that involve multiple steps',
      'Consider what happens when requests arrive simultaneously',
      'Check the reward redemption process carefully'
    ]
  },
  {
    name: 'Atlas Enterprise Portal',
    description: 'Multi-component web application with frontend and backend vulnerabilities',
    category: 'Web Security',
    difficulty: 'HARD',
    score: 200,
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/atlas-frontend:latest',
    deployment_type: 'kubernetes',
    ports: [5173, 6000],
    tags: ['multi-component', 'frontend', 'backend', 'node.js', 'vite'],
    hints: [
      'This challenge has both frontend and backend components',
      'Check the API endpoints for vulnerabilities',
      'Look for client-side security issues'
    ]
  },
  {
    name: 'Financial Portfolio',
    description: 'IDOR (Insecure Direct Object Reference) vulnerability in financial portfolio application',
    category: 'Web Security',
    difficulty: 'EASY',
    score: 100,
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest',
    deployment_type: 'kubernetes',
    ports: [5000],
    tags: ['idor', 'authorization', 'web', 'flask', 'python'],
    hints: [
      'Check how user data is accessed',
      'Look for predictable ID patterns',
      'Try accessing other users\' data'
    ]
  },
  {
    name: 'Project Integration Hub',
    description: 'SSRF (Server-Side Request Forgery) vulnerability in multi-service architecture',
    category: 'Web Security',
    difficulty: 'HARD',
    score: 250,
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/integration-frontend:latest',
    deployment_type: 'kubernetes',
    ports: [80, 6000, 8080],
    tags: ['ssrf', 'multi-service', 'web', 'integration', 'api'],
    hints: [
      'This is a multi-service application',
      'Look for URL parameters that make external requests',
      'Check for internal service discovery'
    ]
  },
  {
    name: 'TechCON Conference',
    description: 'MongoDB injection vulnerability in conference speaker portal',
    category: 'Web Security',
    difficulty: 'HARD',
    score: 200,
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/conference:latest',
    deployment_type: 'kubernetes',
    ports: [3000],
    tags: ['mongodb-injection', 'nosql', 'node.js', 'database'],
    hints: [
      'Look for search functionality',
      'Try MongoDB-specific injection payloads',
      'Check how search parameters are processed'
    ]
  },
  {
    name: 'TechCorp Portal',
    description: 'Server-Side Template Injection (SSTI) vulnerability in corporate portal',
    category: 'Web Security',
    difficulty: 'MEDIUM',
    score: 175,
    docker_image: '082010050918.dkr.ecr.us-east-1.amazonaws.com/techcorp:latest',
    deployment_type: 'kubernetes',
    ports: [8080],
    tags: ['ssti', 'template-injection', 'go', 'web'],
    hints: [
      'Look for user input that gets processed by templates',
      'Try Go template syntax',
      'Check how search results are rendered'
    ]
  }
];

async function setupWebChallenges() {
  console.log('🚀 Setting up 6 Web Security Challenges for HackCubes...\n');

  try {
    // First, check if we have an assessment and section to add challenges to
    console.log('1️⃣ Checking for existing assessments and sections...');
    
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, name')
      .eq('id', '533d4e96-fe35-4540-9798-162b3f261572');

    if (assessmentError) {
      console.error('❌ Error fetching assessments:', assessmentError.message);
      return;
    }

    if (!assessments || assessments.length === 0) {
      console.log('⚠️ Assessment with ID 533d4e96-fe35-4540-9798-162b3f261572 not found');
      console.log('Creating a new assessment for web security challenges...');
      
      const { data: newAssessment, error: createError } = await supabase
        .from('assessments')
        .insert({
          id: '533d4e96-fe35-4540-9798-162b3f261572',
          name: 'Web Security Challenges',
          description: 'Comprehensive web security challenge assessment',
          category: 'Web Security',
          difficulty: 'MIXED',
          duration_minutes: 180,
          max_attempts: 3,
          is_active: true
        })
        .select();

      if (createError) {
        console.error('❌ Error creating assessment:', createError.message);
        return;
      }
      console.log('✅ Created new assessment:', newAssessment[0].name);
    } else {
      console.log('✅ Found assessment:', assessments[0].name);
    }

    // Check for a web security section
    const { data: sections, error: sectionError } = await supabase
      .from('sections')
      .select('id, name, assessment_id')
      .eq('assessment_id', '533d4e96-fe35-4540-9798-162b3f261572')
      .ilike('name', '%web%');

    let sectionId;
    if (!sections || sections.length === 0) {
      console.log('Creating Web Security section...');
      const { data: newSection, error: createSectionError } = await supabase
        .from('sections')
        .insert({
          assessment_id: '533d4e96-fe35-4540-9798-162b3f261572',
          name: 'Web Security Challenges',
          description: 'Collection of web application security challenges'
        })
        .select();

      if (createSectionError) {
        console.error('❌ Error creating section:', createSectionError.message);
        return;
      }
      sectionId = newSection[0].id;
      console.log('✅ Created section:', newSection[0].name);
    } else {
      sectionId = sections[0].id;
      console.log('✅ Found section:', sections[0].name);
    }

    // 2. Add or update each web challenge
    console.log('\n2️⃣ Adding/updating web security challenges...');
    
    for (const challenge of webChallenges) {
      console.log(`\n   🔧 Processing: ${challenge.name}`);
      
      // Check if challenge already exists
      const { data: existing, error: checkError } = await supabase
        .from('questions')
        .select('id, name')
        .eq('name', challenge.name);

      if (checkError) {
        console.error(`   ❌ Error checking challenge ${challenge.name}:`, checkError.message);
        continue;
      }

      if (existing && existing.length > 0) {
        // Update existing challenge
        const { error: updateError } = await supabase
          .from('questions')
          .update({
            section_id: sectionId,
            description: challenge.description,
            category: challenge.category,
            difficulty: challenge.difficulty,
            score: challenge.score,
            docker_image: challenge.docker_image,
            tags: challenge.tags,
            hints: challenge.hints,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing[0].id);

        if (updateError) {
          console.error(`   ❌ Error updating ${challenge.name}:`, updateError.message);
        } else {
          console.log(`   ✅ Updated: ${challenge.name}`);
        }
      } else {
        // Create new challenge
        const { data: newChallenge, error: insertError } = await supabase
          .from('questions')
          .insert({
            section_id: sectionId,
            name: challenge.name,
            description: challenge.description,
            type: 'CTF',
            category: challenge.category,
            difficulty: challenge.difficulty,
            score: challenge.score,
            no_of_flags: 1,
            docker_image: challenge.docker_image,
            tags: challenge.tags,
            hints: challenge.hints,
            is_active: true
          })
          .select();

        if (insertError) {
          console.error(`   ❌ Error creating ${challenge.name}:`, insertError.message);
        } else {
          console.log(`   ✅ Created: ${challenge.name}`);
          
          // Create a flag for the challenge
          const { error: flagError } = await supabase
            .from('flags')
            .insert({
              question_id: newChallenge[0].id,
              flag_value: `FLAG{${challenge.name.toUpperCase().replace(/\s+/g, '_')}_CHALLENGE_COMPLETE}`,
              flag_type: 'STATIC',
              case_sensitive: false,
              points: challenge.score
            });

          if (flagError) {
            console.error(`   ⚠️ Error creating flag for ${challenge.name}:`, flagError.message);
          } else {
            console.log(`   ✅ Created flag for: ${challenge.name}`);
          }
        }
      }
    }

    // 3. Verify the setup
    console.log('\n3️⃣ Verifying setup...');
    
    const { data: challenges, error: verifyError } = await supabase
      .from('questions')
      .select('id, name, docker_image, score')
      .eq('section_id', sectionId)
      .order('name');

    if (verifyError) {
      console.error('❌ Error verifying setup:', verifyError.message);
      return;
    }

    console.log(`\n✅ Successfully configured ${challenges.length} web security challenges:`);
    challenges.forEach(challenge => {
      console.log(`   📋 ${challenge.name} (kubernetes) - ${challenge.score} points`);
    });

    console.log('\n🎯 Next steps:');
    console.log('   1. Start your development server: npm run dev');
    console.log('   2. Navigate to: http://localhost:3000/assessments/533d4e96-fe35-4540-9798-162b3f261572/questions');
    console.log('   3. Test starting/stopping challenge instances');
    console.log('   4. Verify external IP addresses are provided for each challenge');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupWebChallenges();
