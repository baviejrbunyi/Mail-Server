-- ========================================================
-- Supabase PostgreSQL Schema & Seed Data
-- Serverless Email API Server (Vercel & Supabase)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old tables if re-initializing cleanly (Optional, run if you want a fresh start)
-- DROP TABLE IF EXISTS public.email_logs CASCADE;
-- DROP TABLE IF EXISTS public.api_keys CASCADE;

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT, -- TEXT allows both Supabase Auth UUIDs and demo strings without cast errors
    api_key VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);

-- 2. Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
    message_id VARCHAR(64) PRIMARY KEY,
    user_id TEXT,
    client_id VARCHAR(128),
    recipient TEXT[] NOT NULL,
    sender VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    text_body TEXT,
    html_body TEXT,
    status VARCHAR(32) DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
    retry_count INT DEFAULT 0,
    error_msg TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for status and audit logs
CREATE INDEX IF NOT EXISTS idx_email_logs_user_created ON public.email_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- 3. Row Level Security: Allow read & write for API routes (anon, authenticated, service_role)
-- Disabling RLS prevents permission errors when inserting via anon or service keys
ALTER TABLE public.api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs DISABLE ROW LEVEL SECURITY;

-- If you prefer RLS enabled, run these permissive policies instead:
-- ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all on api_keys" ON public.api_keys FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all on email_logs" ON public.email_logs FOR ALL USING (true) WITH CHECK (true);

-- 4. Initial Seed Data
INSERT INTO public.api_keys (id, user_id, api_key, key_prefix, name, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'ak_live_demo123456789abcdef0123456789abcdef',
    'ak_live_demo...',
    'Production Starter Key',
    'ACTIVE'
) ON CONFLICT (api_key) DO UPDATE SET status = 'ACTIVE';

-- Seed initial test records
INSERT INTO public.email_logs (message_id, user_id, client_id, recipient, sender, subject, status, retry_count, created_at, updated_at)
VALUES 
(
    'msg_seed_sample_01',
    '00000000-0000-0000-0000-000000000001',
    'ak_live_demo...',
    ARRAY['user@example.com'],
    'noreply@yourdomain.com',
    'Welcome to Serverless Email API',
    'sent',
    0,
    timezone('utc'::text, now()) - INTERVAL '2 hours',
    timezone('utc'::text, now()) - INTERVAL '2 hours'
),
(
    'msg_seed_sample_02',
    '00000000-0000-0000-0000-000000000001',
    'ak_live_demo...',
    ARRAY['alerts@example.com'],
    'monitor@yourdomain.com',
    'Daily Delivery Health Report',
    'sent',
    0,
    timezone('utc'::text, now()) - INTERVAL '15 minutes',
    timezone('utc'::text, now()) - INTERVAL '15 minutes'
) ON CONFLICT (message_id) DO NOTHING;
