-- Essential HackCubes Database Setup
-- Copy and paste this in your Supabase SQL Editor

-- ============================================================================
-- PROFILES TABLE (ESSENTIAL FOR USER MANAGEMENT)
-- ============================================================================

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

-- ============================================================================
-- CHALLENGE CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenge_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  difficulty_level VARCHAR(20) DEFAULT 'MIXED',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO challenge_categories (name, description, icon, color) VALUES
('Web Security', 'Web application security challenges', 'globe', 'blue'),
('Cryptography', 'Encryption and decryption challenges', 'lock', 'purple'),
('Network Security', 'Network and protocol analysis', 'wifi', 'green'),
('Binary Exploitation', 'Binary analysis and exploitation', 'cpu', 'red'),
('Forensics', 'Digital forensics and investigation', 'search', 'yellow'),
('Reverse Engineering', 'Code analysis and reverse engineering', 'tool', 'orange')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ASSESSMENTS (CTF COMPETITIONS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'CTF',
  status VARCHAR(20) DEFAULT 'DRAFT',
  difficulty VARCHAR(20) DEFAULT 'MEDIUM',
  duration_in_minutes INTEGER DEFAULT 120,
  max_score INTEGER DEFAULT 0,
  no_of_questions INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  category_id UUID REFERENCES challenge_categories(id),
  created_by_id UUID REFERENCES profiles(id),
  active_from TIMESTAMP WITH TIME ZONE,
  active_to TIMESTAMP WITH TIME ZONE,
  instructions TEXT,
  rules TEXT,
  prerequisites TEXT[],
  learning_objectives TEXT[],
  tools_required TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for assessments
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public assessments" ON assessments
  FOR SELECT USING (is_public = true);

CREATE POLICY "Authenticated users can create assessments" ON assessments
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- SECTIONS (WITHIN ASSESSMENTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) DEFAULT 'MEDIUM',
  order_index INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  no_of_questions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- QUESTIONS (CTF CHALLENGES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(30) DEFAULT 'CTF',
  category VARCHAR(100) DEFAULT 'Web Security',
  difficulty VARCHAR(20) DEFAULT 'MEDIUM',
  score INTEGER DEFAULT 10,
  no_of_flags INTEGER DEFAULT 1,
  hints TEXT[],
  solution TEXT,
  learning_notes TEXT,
  tags TEXT[],
  instance_id VARCHAR(100),
  template_id VARCHAR(100),
  docker_image VARCHAR(200),
  vm_template VARCHAR(200),
  network_config JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FLAGS (ANSWERS FOR CTF CHALLENGES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'USER',
  hash VARCHAR(255) NOT NULL,
  value VARCHAR(500),
  score INTEGER DEFAULT 10,
  description TEXT,
  hint TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ENROLLED',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  current_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_section_id UUID REFERENCES sections(id),
  current_question_id UUID REFERENCES questions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, assessment_id)
);

-- Enable RLS for enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FLAG SUBMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS flag_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  flag_id UUID REFERENCES flags(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  submitted_flag VARCHAR(500) NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  score_earned INTEGER DEFAULT 0,
  hint_used BOOLEAN DEFAULT FALSE,
  attempt_number INTEGER DEFAULT 1,
  submission_ip INET,
  user_agent TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for flag submissions
ALTER TABLE flag_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions" ON flag_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" ON flag_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to handle user profile creation
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

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
