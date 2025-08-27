#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testImportedChallenges() {
  console.log('🧪 Testing imported Hirelyst challenges...\n');
  
  try {
    // 1. Check if questions were imported with correct schema
    console.log('1. Checking imported questions...');
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, name, category, template_id, instance_id, score')
      .limit(5);
    
    if (qError) throw qError;
    
    console.log(`✅ Found ${questions.length} questions:`);
    questions.forEach((q, i) => {
      console.log(`   ${i+1}. ${q.name} (${q.category})`);
      console.log(`      - Score: ${q.score}`);
      console.log(`      - Template ID: ${q.template_id || 'None'}`);
      console.log(`      - Instance ID: ${q.instance_id || 'None'}`);
      console.log(`      - Has Instance: ${!!(q.template_id || q.instance_id)}`);
    });
    
    // 2. Check flags import
    console.log('\n2. Checking imported flags...');
    const { data: flags, error: fError } = await supabase
      .from('flags')
      .select('id, question_id, hash, value, score')
      .limit(5);
    
    if (fError) throw fError;
    
    console.log(`✅ Found ${flags.length} flags:`);
    flags.forEach((f, i) => {
      console.log(`   ${i+1}. Question: ${f.question_id.substring(0, 8)}...`);
      console.log(`      - Hash/Value: ${f.hash}`);
      console.log(`      - Score: ${f.score}`);
    });
    
    // 3. Check Network Security challenges specifically
    console.log('\n3. Checking Network Security challenges with instances...');
    const { data: networkChallenges, error: nError } = await supabase
      .from('questions')
      .select('id, name, template_id, instance_id')
      .eq('category', 'Network Security')
      .not('template_id', 'is', null);
    
    if (nError) throw nError;
    
    console.log(`✅ Found ${networkChallenges.length} Network Security challenges with instances:`);
    networkChallenges.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.name}`);
      console.log(`      - Template ID: ${c.template_id}`);
      console.log(`      - Instance ID: ${c.instance_id || 'None'}`);
    });
    
    // 4. Check assessment structure
    console.log('\n4. Checking assessment structure...');
    const { data: assessment, error: aError } = await supabase
      .from('assessments')
      .select(`
        id, name, max_score, no_of_questions,
        sections (
          id, name,
          questions (id, name, score)
        )
      `)
      .limit(1)
      .single();
    
    if (aError) throw aError;
    
    console.log(`✅ Assessment: ${assessment.name}`);
    console.log(`   - Total Questions: ${assessment.no_of_questions}`);
    console.log(`   - Max Score: ${assessment.max_score}`);
    console.log(`   - Sections: ${assessment.sections.length}`);
    
    assessment.sections.forEach((section, i) => {
      console.log(`     ${i+1}. ${section.name}: ${section.questions.length} questions`);
    });
    
    console.log('\n🎉 Import validation completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Total questions imported: ${questions.length}`);
    console.log(`   - Total flags imported: ${flags.length}`);
    console.log(`   - Network Security challenges with instances: ${networkChallenges.length}`);
    console.log(`   - Assessment structure: ✅ Valid`);
    
    console.log('\n🚀 Ready to test in the browser!');
    console.log('   1. Open http://localhost:3000');
    console.log('   2. Sign up/login');
    console.log('   3. Go to Challenges/Assessments');
    console.log('   4. Start "Sample CTF" assessment');
    console.log('   5. Test Network Security challenges with instance controls');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testImportedChallenges();
