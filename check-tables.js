const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('Environment variables not found, trying from .env.local...');
    
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
      
      const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);
      
      console.log('Testing connection with manual env vars...');
      const { data, error } = await supabase.from('assessments').select('id').limit(1);
      
      if (error) {
        console.error('Connection failed:', error.message);
        return;
      }
      
      console.log('✓ Connected to Supabase successfully');
      
      // Check assessment_invitations table
      const { data: invitations, error: invError } = await supabase
        .from('assessment_invitations')
        .select('*')
        .limit(1);
        
      if (invError) {
        console.log('❌ assessment_invitations table does not exist:', invError.message);
        console.log('Creating table using SQL...');
        
        // Create the table
        const createSQL = `
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
          
          CREATE POLICY "invitation_policy" ON assessment_invitations 
            FOR ALL USING (true);
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createSQL });
        
        if (createError) {
          console.error('Failed to create table:', createError);
        } else {
          console.log('✓ assessment_invitations table created successfully!');
        }
        
      } else {
        console.log('✓ assessment_invitations table exists and is accessible');
      }
      
    } catch (e) {
      console.error('Error reading .env.local:', e.message);
    }
    
    return;
  }

  console.log('Environment variables found!');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check tables
  const { data: assessments, error: assessError } = await supabase
    .from('assessments')
    .select('id, name')
    .limit(3);
    
  if (assessError) {
    console.error('Error accessing assessments:', assessError);
    return;
  }
  
  console.log('Existing assessments:', assessments);
  
  const { data: invitations, error: invError } = await supabase
    .from('assessment_invitations')
    .select('*')
    .limit(1);
    
  if (invError) {
    console.log('assessment_invitations table does not exist:', invError.message);
  } else {
    console.log('✓ assessment_invitations table exists');
  }
}

checkTables().catch(console.error);
