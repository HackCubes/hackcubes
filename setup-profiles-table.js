#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProfilesTable() {
  console.log('📝 Creating profiles table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: `
      -- Users table (extends Supabase auth.users)
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        username VARCHAR(50) UNIQUE,
        avatar_url TEXT,
        bio TEXT,
        location VARCHAR(100),
        website VARCHAR(200),
        github_username VARCHAR(100),
        linkedin_username VARCHAR(100),
        twitter_username VARCHAR(100),
        is_admin BOOLEAN DEFAULT FALSE,
        is_verified BOOLEAN DEFAULT FALSE,
        skill_level VARCHAR(20) DEFAULT 'BEGINNER',
        total_score INTEGER DEFAULT 0,
        total_flags_captured INTEGER DEFAULT 0,
        challenges_completed INTEGER DEFAULT 0,
        certifications_earned INTEGER DEFAULT 0,
        learning_streak INTEGER DEFAULT 0,
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable Row Level Security
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

      -- Create policies for profiles
      CREATE POLICY "Users can view their own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);

      CREATE POLICY "Users can update their own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);

      CREATE POLICY "Users can insert their own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    `
  });

  if (error) {
    console.error('❌ Error creating profiles table:', error);
    throw error;
  }
  
  console.log('✅ Profiles table created successfully!');
}

async function verifyTables() {
  console.log('🔍 Verifying table creation...');
  
  try {
    // Check if profiles table exists by trying to select from it
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('❌ Profiles table does not exist');
      return false;
    } else if (error) {
      console.warn('⚠️ Warning checking profiles table:', error.message);
      return false;
    } else {
      console.log('✅ Profiles table exists and is accessible');
      return true;
    }
  } catch (e) {
    console.error('❌ Error verifying tables:', e);
    return false;
  }
}

async function main() {
  try {
    console.log('🎯 HackCubes Essential Database Setup');
    console.log('=====================================');
    
    // First check if profiles table already exists
    const exists = await verifyTables();
    
    if (!exists) {
      await createProfilesTable();
      
      // Verify again
      const verified = await verifyTables();
      if (!verified) {
        throw new Error('Failed to create profiles table');
      }
    } else {
      console.log('ℹ️ Profiles table already exists');
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now sign up and create user profiles.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📝 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the database_setup_complete.sql file');
    process.exit(1);
  }
}

main();
