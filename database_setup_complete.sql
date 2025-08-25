-- HackCubes Complete CTF Learning Platform Database Setup
-- Run this in your Supabase SQL Editor to set up all required tables

-- ============================================================================
-- AUTHENTICATION & USER PROFILES
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
  skill_level VARCHAR(20) DEFAULT 'BEGINNER', -- BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
  total_score INTEGER DEFAULT 0,
  total_flags_captured INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  certifications_earned INTEGER DEFAULT 0,
  learning_streak INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CTF CHALLENGES & CATEGORIES
-- ============================================================================

-- Challenge categories
CREATE TABLE IF NOT EXISTS challenge_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  difficulty_level VARCHAR(20) DEFAULT 'MIXED', -- EASY, MEDIUM, HARD, MIXED
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CTF Assessments/Competitions
CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'CTF', -- CTF, LEARNING_PATH, CERTIFICATION
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, ACTIVE, COMPLETED, ARCHIVED
  difficulty VARCHAR(20) DEFAULT 'MEDIUM', -- EASY, MEDIUM, HARD
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

-- Sections within assessments
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

-- CTF Questions/Challenges
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(30) DEFAULT 'CTF', -- CTF, MCQ, SECURE_CODE_REVIEW
  category VARCHAR(100) DEFAULT 'Web Security', -- Web Security, Network Security, Crypto, etc.
  difficulty VARCHAR(20) DEFAULT 'MEDIUM',
  score INTEGER DEFAULT 10,
  no_of_flags INTEGER DEFAULT 1,
  hints TEXT[],
  solution TEXT,
  learning_notes TEXT,
  tags TEXT[],
  instance_id VARCHAR(100), -- For Docker/VM instances
  template_id VARCHAR(100), -- Template for instance creation
  docker_image VARCHAR(200),
  vm_template VARCHAR(200),
  network_config JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question files/attachments
CREATE TABLE IF NOT EXISTS question_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  description TEXT,
  is_downloadable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flags for CTF challenges
CREATE TABLE IF NOT EXISTS flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'USER', -- USER, ROOT, SYSTEM, BONUS
  hash VARCHAR(255) NOT NULL,
  value VARCHAR(500), -- The actual flag value (encrypted)
  score INTEGER DEFAULT 10,
  description TEXT,
  hint TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER PROGRESS & SUBMISSIONS
-- ============================================================================

-- User enrollments in assessments
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ENROLLED', -- ENROLLED, IN_PROGRESS, COMPLETED, EXPIRED
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

-- Flag submissions
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

-- User question progress
CREATE TABLE IF NOT EXISTS user_question_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED
  score_earned INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  flags_captured INTEGER DEFAULT 0,
  total_flags INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  first_attempt_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id, enrollment_id)
);

-- ============================================================================
-- INSTANCES & INFRASTRUCTURE
-- ============================================================================

-- VM/Container instances for challenges
CREATE TABLE IF NOT EXISTS challenge_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  instance_id VARCHAR(255) NOT NULL,
  instance_type VARCHAR(50) DEFAULT 'docker', -- docker, vm, cloud
  status VARCHAR(20) DEFAULT 'STOPPED', -- STARTING, RUNNING, STOPPING, STOPPED, ERROR
  ip_address INET,
  port INTEGER,
  access_url TEXT,
  ssh_credentials JSONB,
  web_credentials JSONB,
  resource_limits JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  stopped_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LEARNING PATHS & CERTIFICATIONS
-- ============================================================================

-- Learning paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) DEFAULT 'BEGINNER',
  estimated_hours INTEGER DEFAULT 10,
  category_id UUID REFERENCES challenge_categories(id),
  is_certification_path BOOLEAN DEFAULT FALSE,
  certification_name VARCHAR(255),
  certification_code VARCHAR(50),
  certification_price DECIMAL(10,2),
  prerequisites TEXT[],
  learning_objectives TEXT[],
  skills_gained TEXT[],
  assessment_ids UUID[],
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User learning path progress
CREATE TABLE IF NOT EXISTS user_learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ENROLLED', -- ENROLLED, IN_PROGRESS, COMPLETED
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_assessment_id UUID REFERENCES assessments(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  certificate_issued_at TIMESTAMP WITH TIME ZONE,
  certificate_id VARCHAR(100),
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, learning_path_id)
);

-- Certificates earned
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  learning_path_id UUID REFERENCES learning_paths(id),
  assessment_id UUID REFERENCES assessments(id),
  certificate_type VARCHAR(50) DEFAULT 'COMPLETION', -- COMPLETION, CERTIFICATION, ACHIEVEMENT
  certificate_name VARCHAR(255) NOT NULL,
  certificate_code VARCHAR(100) UNIQUE,
  issue_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  verification_url TEXT,
  certificate_file_url TEXT,
  score_achieved INTEGER,
  max_score INTEGER,
  percentage_score DECIMAL(5,2),
  is_verified BOOLEAN DEFAULT TRUE,
  blockchain_hash VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LEADERBOARDS & ACHIEVEMENTS
-- ============================================================================

-- User achievements/badges
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  type VARCHAR(50) DEFAULT 'BADGE', -- BADGE, MILESTONE, RANK
  category VARCHAR(100),
  criteria JSONB,
  points INTEGER DEFAULT 0,
  is_rare BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User earned achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_data JSONB,
  UNIQUE(user_id, achievement_id)
);

-- Global leaderboard
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category VARCHAR(100) DEFAULT 'OVERALL', -- OVERALL, WEEKLY, MONTHLY, CTF_SPECIFIC
  assessment_id UUID REFERENCES assessments(id), -- For CTF-specific leaderboards
  rank INTEGER,
  score INTEGER DEFAULT 0,
  flags_captured INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  time_taken_minutes INTEGER DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start DATE,
  period_end DATE,
  UNIQUE(user_id, category, assessment_id, period_start)
);

-- ============================================================================
-- WRITEUPS & COMMUNITY
-- ============================================================================

-- User writeups for challenges
CREATE TABLE IF NOT EXISTS writeups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  methodology TEXT,
  tools_used TEXT[],
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  is_public BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Writeup likes
CREATE TABLE IF NOT EXISTS writeup_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  writeup_id UUID REFERENCES writeups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, writeup_id)
);

-- ============================================================================
-- ORIGINAL WAITLIST & CHALLENGE SYSTEM
-- ============================================================================

-- Keep original waitlist table
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

-- Keep original invite challenge system
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by_email VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS challenge_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET,
  user_agent TEXT,
  challenge_step VARCHAR(50) NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_skill_level ON profiles(skill_level);
CREATE INDEX IF NOT EXISTS idx_profiles_total_score ON profiles(total_score DESC);

CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_difficulty ON assessments(difficulty);
CREATE INDEX IF NOT EXISTS idx_assessments_is_public ON assessments(is_public);
CREATE INDEX IF NOT EXISTS idx_assessments_active_dates ON assessments(active_from, active_to);

CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_assessment_status ON enrollments(assessment_id, status);

CREATE INDEX IF NOT EXISTS idx_flag_submissions_user_question ON flag_submissions(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_flag_submissions_is_correct ON flag_submissions(is_correct);

CREATE INDEX IF NOT EXISTS idx_user_question_progress_status ON user_question_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_question_progress_user ON user_question_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_instances_user_status ON challenge_instances(user_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_instances_expires_at ON challenge_instances(expires_at);

CREATE INDEX IF NOT EXISTS idx_leaderboard_category_rank ON leaderboard_entries(category, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_assessment_rank ON leaderboard_entries(assessment_id, rank);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flag_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE writeups ENABLE ROW LEVEL SECURITY;
ALTER TABLE writeup_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_attempts ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be expanded based on requirements)

-- Profiles - users can read public profiles, insert their own, and update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Assessments - public ones viewable by all, private ones by enrolled users
CREATE POLICY "Public assessments viewable by all" ON assessments
  FOR SELECT USING (is_public = true OR status = 'ACTIVE');

-- Enrollments - users can only see their own
CREATE POLICY "Users can view own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Flag submissions - users can only see their own
CREATE POLICY "Users can view own submissions" ON flag_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" ON flag_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Similar policies for other user-specific tables...
CREATE POLICY "Users can view own progress" ON user_question_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_question_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own instances" ON challenge_instances
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (for admin dashboard)
CREATE POLICY "Admins can manage everything" ON assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to handle new user profile creation
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
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns (drop existing ones first)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sections_updated_at ON sections;
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_challenge_instances_updated_at ON challenge_instances;
CREATE TRIGGER update_challenge_instances_updated_at BEFORE UPDATE ON challenge_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate user total score
CREATE OR REPLACE FUNCTION calculate_user_total_score(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(score_earned), 0)
    FROM flag_submissions
    WHERE user_id = user_uuid AND is_correct = true
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats after flag submission
CREATE OR REPLACE FUNCTION update_user_stats_after_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_correct = true THEN
    UPDATE profiles 
    SET 
      total_score = calculate_user_total_score(NEW.user_id),
      total_flags_captured = total_flags_captured + 1,
      last_active_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_stats_trigger ON flag_submissions;
CREATE TRIGGER update_user_stats_trigger 
  AFTER INSERT ON flag_submissions
  FOR EACH ROW 
  EXECUTE FUNCTION update_user_stats_after_flag();

-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- Insert default challenge categories
INSERT INTO challenge_categories (name, description, icon, color) VALUES
('Web Security', 'Web application security challenges including XSS, SQLi, CSRF, etc.', 'globe', 'blue'),
('Network Security', 'Network penetration testing and infrastructure challenges', 'wifi', 'green'),
('Cryptography', 'Encryption, decryption, and cryptographic protocol challenges', 'lock', 'purple'),
('Binary Exploitation', 'Buffer overflows, reverse engineering, and binary analysis', 'code', 'red'),
('Forensics', 'Digital forensics and incident response challenges', 'search', 'orange'),
('OSINT', 'Open source intelligence and reconnaissance challenges', 'eye', 'cyan'),
('Steganography', 'Hidden message and data concealment challenges', 'image', 'pink'),
('Misc', 'Miscellaneous challenges that don''t fit other categories', 'puzzle-piece', 'gray')
ON CONFLICT (name) DO NOTHING;

-- Insert default achievements
INSERT INTO achievements (name, description, icon, type, category, points) VALUES
('First Blood', 'Submit your first correct flag', 'trophy', 'BADGE', 'MILESTONE', 10),
('Speed Demon', 'Complete a challenge in under 5 minutes', 'zap', 'BADGE', 'SPEED', 25),
('Persistence', 'Complete 10 challenges', 'target', 'MILESTONE', 'PROGRESS', 50),
('Century Club', 'Complete 100 challenges', 'star', 'MILESTONE', 'PROGRESS', 200),
('Web Master', 'Complete 25 web security challenges', 'globe', 'BADGE', 'CATEGORY', 75),
('Crypto King', 'Complete 25 cryptography challenges', 'lock', 'BADGE', 'CATEGORY', 75),
('Network Ninja', 'Complete 25 network security challenges', 'wifi', 'BADGE', 'CATEGORY', 75),
('Binary Beast', 'Complete 25 binary exploitation challenges', 'code', 'BADGE', 'CATEGORY', 75),
('OSINT Expert', 'Complete 25 OSINT challenges', 'eye', 'BADGE', 'CATEGORY', 75),
('CTF Champion', 'Win a CTF competition', 'crown', 'BADGE', 'COMPETITION', 100)
ON CONFLICT (name) DO NOTHING;

-- Keep original waitlist and challenge policies
CREATE POLICY "Allow anonymous inserts" ON waitlist
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated reads" ON waitlist
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow anonymous select for unused codes" ON invite_codes
  FOR SELECT TO anon USING (is_used = FALSE);

CREATE POLICY "Allow anonymous insert" ON invite_codes
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update for marking as used" ON invite_codes
  FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous inserts" ON challenge_attempts
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated reads" ON challenge_attempts
  FOR SELECT TO authenticated USING (true);
