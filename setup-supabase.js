#!/usr/bin/env node

console.log('🚀 HackCubes Supabase Setup Helper');
console.log('==================================\n');

console.log('Follow these steps to set up Supabase for your HackCubes project:\n');

console.log('📋 STEP 1: Create Supabase Project');
console.log('   1. Go to https://supabase.com');
console.log('   2. Sign in or create an account');
console.log('   3. Click "New Project"');
console.log('   4. Choose your organization');
console.log('   5. Name: "hackcubes" (or any name you prefer)');
console.log('   6. Choose a strong database password');
console.log('   7. Select your preferred region');
console.log('   8. Click "Create new project"');
console.log('   9. Wait 2-3 minutes for project creation\n');

console.log('🔑 STEP 2: Get Your Credentials');
console.log('   1. In your Supabase dashboard, go to Settings → API');
console.log('   2. Copy the following values:');
console.log('      - Project URL (starts with https://)');
console.log('      - anon public key');
console.log('      - service_role secret key');
console.log('   3. Keep these values handy for the next step\n');

console.log('📝 STEP 3: Create Environment File');
console.log('   1. Copy .env.local.template to .env.local');
console.log('   2. Replace the placeholder values with your actual credentials');
console.log('   3. Save the file\n');

console.log('🗄️ STEP 4: Set Up Database');
console.log('   1. In your Supabase dashboard, go to SQL Editor');
console.log('   2. Copy the entire content of database_setup.sql');
console.log('   3. Paste it in the SQL Editor');
console.log('   4. Click "Run" to execute all migrations\n');

console.log('✅ STEP 5: Test Your Setup');
console.log('   1. Restart your development server: npm run dev');
console.log('   2. Visit http://localhost:3000/challenge');
console.log('   3. Open browser console and test the challenge\n');

console.log('🆘 Need Help?');
console.log('   - Check SUPABASE_SETUP_GUIDE.md for detailed instructions');
console.log('   - Check CHALLENGE_SETUP.md for testing the challenge');
console.log('   - Visit https://supabase.com/docs for Supabase documentation\n');

console.log('🔐 Security Reminders:');
console.log('   - Never commit .env.local to git');
console.log('   - Keep your service_role key secret');
console.log('   - The anon key is safe for frontend use');

console.log('\n✨ Happy hacking!');
