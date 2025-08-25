#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🔍 Testing connection to Supabase...');
  
  try {
    // Try to check existing tables
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      console.log('⚠️ Cannot access pg_tables, trying alternative method...');
      
      // Try to check if profiles table exists
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profileError && profileError.code === 'PGRST116') {
        console.log('❌ profiles table does not exist');
        return { connected: true, profilesExist: false };
      } else if (profileError) {
        console.log('⚠️ Connection error:', profileError.message);
        return { connected: false, error: profileError };
      } else {
        console.log('✅ profiles table exists');
        return { connected: true, profilesExist: true };
      }
    } else {
      const tableNames = data.map(t => t.tablename);
      console.log(`✅ Connected! Found ${tableNames.length} tables`);
      return { 
        connected: true, 
        tables: tableNames,
        profilesExist: tableNames.includes('profiles')
      };
    }
  } catch (e) {
    console.error('❌ Connection failed:', e.message);
    return { connected: false, error: e };
  }
}

async function createCriticalFunction() {
  console.log('🔧 Attempting to create profile creation function...');
  
  try {
    // Try to create the function using a workaround
    const functionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, first_name, last_name)
        VALUES (
          NEW.id,
          NEW.email,
          NEW.raw_user_meta_data->>'first_name',
          NEW.raw_user_meta_data->>'last_name'
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // This will likely fail, but let's try
    const { data, error } = await supabase.rpc('exec', { sql: functionSQL });
    
    if (error) {
      console.log('❌ Cannot create function via RPC:', error.message);
      return false;
    } else {
      console.log('✅ Function created successfully');
      return true;
    }
  } catch (e) {
    console.log('❌ Function creation failed:', e.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Direct Supabase Database Interaction Attempt');
  console.log('=================================================\n');
  
  const connectionResult = await testConnection();
  
  if (!connectionResult.connected) {
    console.log('\n❌ Cannot establish connection to Supabase database');
    console.log('📝 You will need to run the SQL manually in Supabase Dashboard');
    return;
  }
  
  if (connectionResult.profilesExist) {
    console.log('\n✅ Great! The profiles table already exists');
    console.log('🎯 Your database setup appears to be complete');
    console.log('\n🧪 Try testing user signup now - it should work!');
    return;
  }
  
  console.log('\n🔧 Profiles table missing - attempting to create...');
  
  // Since direct SQL execution is not available, let's try an alternative
  console.log('⚠️ Direct SQL execution not available via Supabase API');
  console.log('\n📋 Here\'s what needs to be done:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Run the database_setup_complete.sql file');
  console.log('\n🔗 Supabase URL:', supabaseUrl);
  
  // Create a minimal SQL file for just the essential parts
  console.log('\n📝 Creating minimal essential setup...');
  
  const minimalSQL = `
-- Essential tables only for immediate functionality
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  username VARCHAR(50) UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;
  
  require('fs').writeFileSync('minimal-setup.sql', minimalSQL);
  console.log('✅ Created minimal-setup.sql file');
  console.log('\n🚀 Run this smaller SQL file in Supabase Dashboard to fix the immediate issue');
}

main().catch(console.error);
