-- ========================================================
-- Supabase PostgreSQL Schema for Serverless Email API Server
-- ========================================================

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast authentication lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);

-- 2. Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
    message_id VARCHAR(64) PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_id VARCHAR(128),
    recipient TEXT[] NOT NULL,
    sender VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
    retry_count INT DEFAULT 0,
    error_msg TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for audit log pagination per user
CREATE INDEX IF NOT EXISTS idx_email_logs_user_created ON public.email_logs(user_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Service Role bypasses RLS for API handlers)
CREATE POLICY "Users can view their own api keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own api keys (max 5)" ON public.api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR SELECT USING (auth.uid() = user_id);
