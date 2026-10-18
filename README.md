# Serverless Email API Server (Vercel & Supabase)

A lightweight, independent serverless Email API Server designed to bridge modern HTTP JSON payloads with traditional SMTP protocols. Deployed on **Vercel** using **Next.js App Router**, **Supabase (PostgreSQL)**, **Upstash QStash**, and **Nodemailer**.

---

## 1. Project Overview & Architecture

Because Vercel is a serverless environment with ephemeral file systems and execution timeouts, background daemon loops are prohibited. This architecture uses **Upstash QStash** as a serverless webhook message queue:

- **HTTP Ingestion (`POST /api/v1/send`)**: Validates the payload and API key, records the email as `queued` in Supabase, and publishes a job to Upstash QStash.
- **Worker Webhook (`POST /api/internal/process-email`)**: Triggered securely by QStash, this endpoint executes the SMTP transmission via `nodemailer` and updates Supabase (`sent` or `failed`). QStash automatically handles up to 3 retries on failure.

---

## 2. Environment & DB Setup

### Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

QSTASH_TOKEN="your-qstash-token"
QSTASH_CURRENT_SIGNING_KEY="your-qstash-signing-key"

SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@yourdomain.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM_DEFAULT="noreply@yourdomain.com"

NEXT_PUBLIC_APP_URL="https://your-vercel-app.vercel.app"
```

### Supabase SQL Schema (`supabase/schema.sql`)
Run the schema in your Supabase SQL Editor to provision `api_keys` and `email_logs` tables with Row Level Security (RLS).

---

## 3. Verification cURL Commands

### 1. Generate an API Key (via Dashboard or API)
```bash
curl -X POST https://your-vercel-app.vercel.app/api/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"userId": "usr_demo_123", "name": "Production Key"}'
```

### 2. Send an Email (`POST /api/v1/send`)
```bash
curl -X POST https://your-vercel-app.vercel.app/api/v1/send \
  -H "Authorization: Bearer ak_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "from": "noreply@yourdomain.com",
    "subject": "Hello via Vercel Serverless API",
    "text": "This email was queued via QStash and delivered via Nodemailer."
  }'
```

### 3. Check Message Status (`GET /api/v1/messages/:id`)
```bash
curl -X GET https://your-vercel-app.vercel.app/api/v1/messages/msg_1234567890 \
  -H "Authorization: Bearer ak_live_..."
```

---

## License
MIT License. Free for commercial and open-source use.
