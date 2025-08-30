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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_email ON payment_orders(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay_id ON payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_certification ON payment_orders(certification_id);

CREATE INDEX IF NOT EXISTS idx_cert_purchases_user_email ON certification_purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_cert_purchases_certification ON certification_purchases(certification_id);
CREATE INDEX IF NOT EXISTS idx_cert_purchases_status ON certification_purchases(status);
CREATE INDEX IF NOT EXISTS idx_cert_purchases_order_id ON certification_purchases(order_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on payment tables
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_purchases ENABLE ROW LEVEL SECURITY;

-- Payment orders policies
CREATE POLICY "Users can view their own payment orders" ON payment_orders
  FOR SELECT USING (auth.email() = user_email);

CREATE POLICY "Users can insert their own payment orders" ON payment_orders
  FOR INSERT WITH CHECK (auth.email() = user_email);

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
