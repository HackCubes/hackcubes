-- Payment and Certification Purchase Tables
-- Add these tables to your Supabase database

-- ============================================================================
-- PAYMENT SYSTEM TABLES
-- ============================================================================

-- Payment orders table
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL,
  razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  certification_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'created', -- created, completed, failed, cancelled
  payment_id VARCHAR(100),
  payment_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes JSONB
);

-- Certification purchases table
CREATE TABLE IF NOT EXISTS certification_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  certification_id VARCHAR(100) NOT NULL,
  order_id VARCHAR(100) NOT NULL,
  payment_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'completed', -- completed, refunded
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  metadata JSONB
);

-- ============================================================================
-- REPORT SUBMISSION SYSTEM TABLES
-- ============================================================================

-- Assessment reports table
CREATE TABLE IF NOT EXISTS assessment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL,
  report_file_url TEXT NOT NULL,
  report_file_name VARCHAR(255) NOT NULL,
  report_file_size BIGINT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, reviewed, passed, failed
  admin_review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  final_score INTEGER,
  pass_threshold INTEGER DEFAULT 60,
  is_passed BOOLEAN,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report review comments table
CREATE TABLE IF NOT EXISTS report_review_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES assessment_reports(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  comment_type VARCHAR(50) DEFAULT 'general', -- general, strengths, weaknesses, suggestions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment timeline tracking
CREATE TABLE IF NOT EXISTS assessment_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- started, assessment_completed, report_submitted, under_review, reviewed, passed, failed
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_email ON payment_orders(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay_id ON payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_certification ON payment_orders(certification_id);

CREATE INDEX IF NOT EXISTS idx_cert_purchases_user_email ON certification_purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_cert_purchases_certification ON certification_purchases(certification_id);
CREATE INDEX IF NOT EXISTS idx_cert_purchases_status ON certification_purchases(status);
CREATE INDEX IF NOT EXISTS idx_cert_purchases_order_id ON certification_purchases(order_id);

-- Report tables indexes
CREATE INDEX IF NOT EXISTS idx_assessment_reports_enrollment_id ON assessment_reports(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_user_id ON assessment_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_status ON assessment_reports(status);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_submitted_at ON assessment_reports(submitted_at);
CREATE INDEX IF NOT EXISTS idx_report_review_comments_report_id ON report_review_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_assessment_timeline_enrollment_id ON assessment_timeline(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_timeline_event_type ON assessment_timeline(event_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_timeline ENABLE ROW LEVEL SECURITY;

-- Payment orders policies
CREATE POLICY "Users can view their own payment orders" ON payment_orders
  FOR SELECT USING (auth.email() = user_email);

CREATE POLICY "Users can insert their own payment orders" ON payment_orders
  FOR INSERT WITH CHECK (auth.email() = user_email);

CREATE POLICY "Service can update payment orders" ON payment_orders
  FOR UPDATE USING (true);

-- Certification purchases policies
CREATE POLICY "Users can view their own purchases" ON certification_purchases
  FOR SELECT USING (auth.email() = user_email);

CREATE POLICY "Service can insert purchases" ON certification_purchases
  FOR INSERT WITH CHECK (true);

-- Assessment reports policies
CREATE POLICY "Users can view own reports" ON assessment_reports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own reports" ON assessment_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reports before review" ON assessment_reports
  FOR UPDATE USING (user_id = auth.uid() AND status = 'submitted');

CREATE POLICY "Admins can view all reports" ON assessment_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all reports" ON assessment_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Report review comments policies
CREATE POLICY "Users can view comments on own reports" ON report_review_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_reports 
      WHERE id = report_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all comments" ON report_review_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Assessment timeline policies
CREATE POLICY "Users can view own timeline" ON assessment_timeline
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create timeline entries" ON assessment_timeline
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all timelines" ON assessment_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- FUNCTIONS FOR AUTOMATED WORKFLOWS
-- ============================================================================

-- Function to update enrollment status after report submission
CREATE OR REPLACE FUNCTION update_enrollment_after_report_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Update enrollment status to indicate report submitted
  UPDATE enrollments 
  SET 
    status = 'REPORT_SUBMITTED',
    updated_at = NOW()
  WHERE id = NEW.enrollment_id;
  
  -- Add timeline entry
  INSERT INTO assessment_timeline (enrollment_id, user_id, assessment_id, event_type, event_data)
  VALUES (
    NEW.enrollment_id, 
    NEW.user_id, 
    NEW.assessment_id, 
    'report_submitted',
    jsonb_build_object(
      'report_id', NEW.id,
      'file_name', NEW.report_file_name,
      'submitted_at', NEW.submitted_at
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update enrollment status after report review
CREATE OR REPLACE FUNCTION update_enrollment_after_report_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to reviewed, passed, or failed
  IF OLD.status != NEW.status AND NEW.status IN ('passed', 'failed', 'reviewed') THEN
    -- Update enrollment status
    UPDATE enrollments 
    SET 
      status = CASE 
        WHEN NEW.is_passed = true THEN 'PASSED'
        WHEN NEW.is_passed = false THEN 'FAILED'
        ELSE 'UNDER_REVIEW'
      END,
      final_score = NEW.final_score,
      updated_at = NOW()
    WHERE id = NEW.enrollment_id;
    
    -- Add timeline entry
    INSERT INTO assessment_timeline (enrollment_id, user_id, assessment_id, event_type, event_data)
    VALUES (
      NEW.enrollment_id, 
      NEW.user_id, 
      NEW.assessment_id, 
      CASE 
        WHEN NEW.is_passed = true THEN 'passed'
        WHEN NEW.is_passed = false THEN 'failed'
        ELSE 'under_review'
      END,
      jsonb_build_object(
        'report_id', NEW.id,
        'final_score', NEW.final_score,
        'reviewed_by', NEW.reviewed_by,
        'reviewed_at', NEW.reviewed_at,
        'admin_notes', NEW.admin_review_notes
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for report submission
CREATE TRIGGER trigger_report_submission
  AFTER INSERT ON assessment_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_after_report_submission();

-- Trigger for report review
CREATE TRIGGER trigger_report_review
  AFTER UPDATE ON assessment_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_after_report_review();

-- ============================================================================
-- UPDATE ENROLLMENTS TABLE TO SUPPORT REPORT PHASE
-- ============================================================================

-- Add report-related columns to enrollments table
DO $$ 
BEGIN
  -- Check if columns exist before adding them
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'assessment_completed_at') THEN
    ALTER TABLE enrollments ADD COLUMN assessment_completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'report_due_at') THEN
    ALTER TABLE enrollments ADD COLUMN report_due_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'final_score') THEN
    ALTER TABLE enrollments ADD COLUMN final_score INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'pass_threshold') THEN
    ALTER TABLE enrollments ADD COLUMN pass_threshold INTEGER DEFAULT 60;
  END IF;
END $$;

CREATE POLICY "Users can update their own payment orders" ON payment_orders
  FOR UPDATE USING (auth.email() = user_email);

-- Certification purchases policies
CREATE POLICY "Users can view their own certification purchases" ON certification_purchases
  FOR SELECT USING (auth.email() = user_email);

CREATE POLICY "Service can insert certification purchases" ON certification_purchases
  FOR INSERT WITH CHECK (true);

-- Admin policies (if needed)
CREATE POLICY "Admins can view all payment orders" ON payment_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can view all certification purchases" ON certification_purchases
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at column to payment_orders if needed
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger to automatically update updated_at
CREATE TRIGGER update_payment_orders_updated_at 
  BEFORE UPDATE ON payment_orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
