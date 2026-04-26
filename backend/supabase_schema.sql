-- PermitPilot Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  application_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  intake_data JSONB,
  agent_results JSONB,
  cross_agent_conflicts JSONB,
  checklist JSONB,
  total_estimated_cost NUMERIC,
  overall_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Allow the service role full access (our backend uses service_role key)
CREATE POLICY "Service role has full access" ON applications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow users to manage their own applications (if querying directly from frontend in the future)
CREATE POLICY "Users can manage their own applications" ON applications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create an index on application_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_applications_app_id ON applications(application_id);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);
