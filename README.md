# Serverless Email API Server (Vercel & Supabase)

A lightweight, independent serverless Email API Server designed to bridge modern HTTP JSON payloads with traditional SMTP protocols. Deployed on **Vercel** using **Next.js App Router**, **Supabase (PostgreSQL)**, **Upstash QStash**, and **Nodemailer**.

---

## 1. Project Overview & Architecture

Because Vercel is a serverless environment with ephemeral file systems and execution timeouts, background daemon loops are prohibited. This architecture uses **Upstash QStash** as a serverless webhook message queue:

- **HTTP Ingestion (`POST /api/v1/send`)**: Validates the payload and API key, records the email as `queued` in Supabase, and publishes a job to Upstash QStash.
- **Worker Webhook (`POST /api/internal/process-email`)**: Triggered securely by QStash, this endpoint executes the SMTP transmission via `nodemailer` and updates Supabase (`sent` or `failed`). QStash automatically handles up to 3 retries on failure.

---

## 2. Step-by-Step Setup Guide

### Step 1: Clone & Install Dependencies
```bash
git clone <repository-url>
cd email-api-server
npm install
```

### Step 2: Supabase Setup (Database & Auth)
1. Create a free project on [Supabase](https://supabase.com/).
2. Go to the **SQL Editor** in your Supabase dashboard and execute the SQL script from `supabase/schema.sql` to create the `api_keys` and `email_logs` tables.
3. Retrieve your **Supabase URL**, **Anon Key**, and **Service Role Key** from **Project Settings -> API**.

### Step 3: Upstash QStash Setup (Queue & Webhooks)
1. Create a free account on [Upstash Console](https://console.upstash.com/).
2. Navigate to the **QStash** tab to get your:
   - `QSTASH_TOKEN`
   - `QSTASH_CURRENT_SIGNING_KEY` (used for secure webhook signature verification).

### Step 4: SMTP Relay Setup
Choose an email provider (Mailgun, SendGrid, Resend, or Gmail App Password) to get your SMTP credentials:
- `SMTP_HOST`: e.g., `smtp.mailgun.org` or `smtp.gmail.com`
- `SMTP_PORT`: `587`
- `SMTP_USER`: Your SMTP username or email address
- `SMTP_PASSWORD`: Your SMTP password or Google App Password
- `SMTP_FROM_DEFAULT`: Default sender address

### Step 5: Configure Environment Variables
Create a `.env.local` file in the root directory based on `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

QSTASH_TOKEN="your-qstash-token"
QSTASH_CURRENT_SIGNING_KEY="your-qstash-signing-key"

SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@yourdomain.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM_DEFAULT="noreply@yourdomain.com"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 3. Running Locally & Testing

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000` in your browser.
3. Go to the **Dashboard**, sign in with your demo email (max 3 users), and generate an API key.
4. Test sending an email via the API Playground or cURL:

```bash
curl -X POST http://localhost:3000/api/v1/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "from": "noreply@yourdomain.com",
    "subject": "Hello from Local API",
    "text": "Testing serverless email queue."
  }'
```

---

## 4. Deploying to Production (Vercel)

1. Push your code to GitHub.
2. Import the project into [Vercel](https://vercel.com/).
3. In your Vercel Project Settings -> **Environment Variables**, add all your production credentials from `.env.local`, updating `NEXT_PUBLIC_APP_URL` to your production Vercel domain (`https://your-app.vercel.app`).
4. Click **Deploy**.

---

## License
MIT License. Free for commercial and open-source use.
