export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
  interest_level?: 'low' | 'medium' | 'high';
  referral_source?: string;
  created_at: string;
  updated_at: string;
}

export interface WaitlistSignupData {
  email: string;
  name?: string;
  company?: string;
  role?: string;
  interest_level?: 'low' | 'medium' | 'high';
  referral_source?: string;
}