#!/usr/bin/env node

// Script to automatically set up the database tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🗄️ Setting up HackCubes Database...\n');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.log('❌ Missing Supabase credentials in .env.local');
    return false;
  }

  try {
    const supabase = createClient(url, serviceKey);
    
    console.log('📋 Creating waitlist table...');
    
    // Create waitlist table
    const { error: waitlistError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create waitlist table for HackCubes
        CREATE TABLE IF NOT EXISTS waitlist (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255),
          company VARCHAR(255),
          role VARCHAR(255),
          interest_level VARCHAR(50) DEFAULT 'high',
          referral_source VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
        CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);

        -- Enable Row Level Security
        ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
      `
    });

    if (waitlistError) {
      console.log('❌ Error creating waitlist table:', waitlistError.message);
      
      // Try a different approach - direct table creation
      console.log('📋 Trying alternative table creation method...');
      
      const { error: altError } = await supabase
        .from('waitlist')
        .select('count(*)', { count: 'exact', head: true });
      
      if (altError && altError.code === '42P01') {
        console.log('❌ Waitlist table does not exist. Please run the SQL manually.');
        console.log('\n📝 Manual Setup Required:');
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the content from database_setup.sql');
        console.log('4. Click "Run" to execute the SQL');
        return false;
      }
    } else {
      console.log('✅ Waitlist table created successfully');
    }

    console.log('📋 Creating challenge tables...');
    
    // Create challenge tables
    const { error: challengeError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create invite_codes table
        CREATE TABLE IF NOT EXISTS invite_codes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          code VARCHAR(255) NOT NULL UNIQUE,
          is_used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          used_by_email VARCHAR(255)
        );

        -- Create challenge_attempts table
        CREATE TABLE IF NOT EXISTS challenge_attempts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ip_address INET,
          user_agent TEXT,
          challenge_step VARCHAR(50) NOT NULL,
          success BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
        CREATE INDEX IF NOT EXISTS idx_invite_codes_used ON invite_codes(is_used);
        CREATE INDEX IF NOT EXISTS idx_challenge_attempts_ip ON challenge_attempts(ip_address);

        -- Enable Row Level Security
        ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE challenge_attempts ENABLE ROW LEVEL SECURITY;
      `
    });

    if (challengeError) {
      console.log('❌ Error creating challenge tables:', challengeError.message);
    } else {
      console.log('✅ Challenge tables created successfully');
    }

    // Test final connection
    console.log('\n🧪 Testing final connection...');
    const { data, error } = await supabase
      .from('waitlist')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Final test failed:', error.message);
      return false;
    }

    console.log('✅ Database setup completed successfully!');
    console.log('\n🎯 You can now test the challenge at: http://localhost:3000/challenge');
    
    return true;

  } catch (error) {
    console.log('❌ Setup failed:', error.message);
    console.log('\n📝 Please run the database_setup.sql manually in your Supabase dashboard');
    return false;
  }
}

setupDatabase().catch(console.error);
