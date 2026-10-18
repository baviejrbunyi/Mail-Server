"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Terminal,
  Server,
  Database,
  Shield,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  BookOpen,
  Key,
  Layers,
  Settings,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  AlertTriangle,
  Send,
  Boxes,
  FileCode,
  Laptop,
  Sparkles
} from "lucide-react";

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<"curl" | "node" | "nextjs" | "python" | "go" | "php">("curl");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("overview");

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST https://your-domain.vercel.app/api/v1/send \\
  -H "Authorization: Bearer ak_live_YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "customer@example.com",
    "from": "notifications@yourdomain.com",
    "subject": "Order Confirmation #84920",
    "html": "<h1>Thank you for your order!</h1><p>Your package is being prepared.</p>",
    "text": "Thank you for your order! Your package is being prepared."
  }'`,
    node: `// Node.js (18+ native fetch or axios)
async function sendEmail() {
  const response = await fetch("https://your-domain.vercel.app/api/v1/send", {
    method: "POST",
    headers: {
      "Authorization": "Bearer ak_live_YOUR_API_KEY_HERE",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: "customer@example.com",
      from: "notifications@yourdomain.com",
      subject: "Welcome to Acme Corp!",
      html: "<h2>Welcome aboard</h2><p>Click below to verify your email.</p>",
      text: "Welcome aboard. Please verify your email."
    })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to dispatch email");
  }

  console.log("Email Queued:", result.id); // e.g. "msg_9f81a7b..."
  return result;
}

sendEmail().catch(console.error);`,
    nextjs: `// Next.js Server Action or API Route (app/actions/send-welcome.ts)
"use server";

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  const apiKey = process.env.EMAIL_API_KEY; // store ak_live_... in your .env
  const apiUrl = process.env.EMAIL_API_URL || "https://your-domain.vercel.app";

  const res = await fetch(\`\${apiUrl}/api/v1/send\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${apiKey}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: userEmail,
      subject: \`Welcome to our platform, \${userName}!\`,
      html: \`<p>Hello \${userName},</p><p>We are thrilled to have you join us.</p>\`,
      text: \`Hello \${userName}, we are thrilled to have you join us.\`
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to queue welcome email");
  }

  const { id, status } = await res.json();
  return { success: true, messageId: id, status };
}`,
    python: `# Python 3.8+ (using requests or httpx)
import requests

def send_transactional_email(to_email: str, subject: str, message_body: str):
    url = "https://your-domain.vercel.app/api/v1/send"
    headers = {
        "Authorization": "Bearer ak_live_YOUR_API_KEY_HERE",
        "Content-Type": "application/json"
    }
    payload = {
        "to": to_email,
        "from": "alerts@yourdomain.com",
        "subject": subject,
        "html": f"<p>{message_body}</p>",
        "text": message_body
    }

    response = requests.post(url, json=payload, headers=headers, timeout=10)
    response.raise_for_status()
    
    data = response.json()
    print(f"Dispatched message ID: {data['id']} (Status: {data['status']})")
    return data

# Usage example:
send_transactional_email("dev@company.com", "System Alert: Backup Complete", "Database snapshot saved successfully.")`,
    go: `// Go (1.18+)
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type EmailPayload struct {
	To      string \`json:"to"\`
	From    string \`json:"from,omitempty"\`
	Subject string \`json:"subject"\`
	HTML    string \`json:"html,omitempty"\`
	Text    string \`json:"text,omitempty"\`
}

func main() {
	payload := EmailPayload{
		To:      "customer@example.com",
		Subject: "Your Monthly Report",
		Text:    "Your monthly usage report is now available.",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://your-domain.vercel.app/api/v1/send", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer ak_live_YOUR_API_KEY_HERE")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	fmt.Printf("HTTP Status: %d\\n", resp.StatusCode)
}`,
    php: `<?php
// PHP 8+ cURL Example
$apiKey = "ak_live_YOUR_API_KEY_HERE";
$endpoint = "https://your-domain.vercel.app/api/v1/send";

$payload = [
    "to" => "user@example.com",
    "subject" => "Password Reset Request",
    "html" => "<p>Click <a href='https://example.com/reset'>here</a> to reset your password.</p>",
    "text" => "Go to https://example.com/reset to reset your password."
];

$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Status: $httpCode\\n";
echo "Response: $response\\n";
?>`
  };

  const sections = [
    { id: "overview", label: "Project Overview" },
    { id: "architecture", label: "Architecture & Flow" },
    { id: "features", label: "Core Features" },
    { id: "setup", label: "Environment & Setup" },
    { id: "implementation", label: "Implementation & SDKs" },
    { id: "endpoints", label: "API Reference" },
    { id: "use-cases", label: "Real-World Use Cases" },
    { id: "troubleshooting", label: "Troubleshooting & FAQ" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-8 px-6 md:px-10 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-100">Documentation & API Guide</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Serverless Email API Microservice Documentation</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors shadow-sm flex items-center gap-2"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Console & Keys</span>
          </Link>
        </div>
      </header>

      {/* Main Documentation Layout */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-10 py-10 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sticky Sidebar Navigation */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Documentation Table of Contents
              </span>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    className={`block px-3 py-2 text-xs rounded-lg transition-all font-medium ${
                      activeSection === sec.id
                        ? "bg-amber-400/10 text-amber-400 font-semibold border-l-2 border-amber-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    {sec.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Quick Status / Help card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Zap className="w-4 h-4" /> Need an API Key?
              </div>
              <p className="text-slate-400 leading-relaxed">
                Log into the console, create up to 3 authorized developer accounts, and generate full-access API keys instantly.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-amber-400 hover:underline font-medium text-xs pt-1"
              >
                Go to Console <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Documentation Content Body */}
        <main className="lg:col-span-3 space-y-16">
          {/* SECTION 1: OVERVIEW */}
          <section id="overview" className="space-y-6 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Boxes className="w-3.5 h-3.5" /> Project Overview
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">
              High-Speed Serverless Email Bridge
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              The <strong>Serverless Email API</strong> is an independent, lightweight microservice designed specifically for serverless runtimes (such as Vercel, AWS Lambda, or Cloudflare Workers) and modern web applications. It serves as an ultra-fast HTTP-to-SMTP bridge that solves the fundamental limitations of sending emails in serverless environments.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2.5">
                <div className="text-red-400 font-semibold text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> The Serverless Email Problem
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Traditional SMTP protocol connections require a TCP handshake, TLS negotiation, EHLO/HELO exchange, and authentication before transmitting email content. This typically takes <strong>1.5 to 5+ seconds</strong> per email. In serverless environments, synchronous SMTP leads to request timeouts, blocked user threads, and dropped connections when traffic spikes.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2.5">
                <div className="text-emerald-400 font-semibold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> The Solution Provided Here
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our service immediately accepts email payloads via a fast HTTP JSON request (responding in <strong>~20–40ms</strong> with <code className="text-amber-300">202 Accepted</code>). It offloads actual delivery to an asynchronous queue backed by <strong>Upstash QStash</strong>, guarantees up to 3 automatic retries, and maintains a complete PostgreSQL audit trail via <strong>Supabase</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: ARCHITECTURE */}
          <section id="architecture" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" /> Architecture & Flow
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              How the System Works Under the Hood
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              The architecture is decoupled into three primary tiers: the Ingestion API, the Queue Worker, and the Persistence & Telemetry Layer.
            </p>

            {/* Architecture Steps Flow */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-200">HTTP Ingestion & Key Authentication</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Client applications dispatch a JSON payload to <code className="text-amber-300">POST /api/v1/send</code> with a Bearer API key. The key is verified against SHA-256 hashed keys in Supabase. The payload is validated for required fields (recipient address, valid email format, subject).
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-200">Asynchronous Upstash QStash Enqueue</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The message record is created in the database with status <code className="text-amber-400">queued</code>. A lightweight webhook is published to Upstash QStash pointing to <code className="text-amber-300">/api/v1/queue/worker</code>. The HTTP client immediately receives HTTP 202 Accepted with the generated message UUID.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-200">Nodemailer SMTP Transmission</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    QStash hits the queue worker endpoint with signature verification. The worker fetches the message, marks it <code className="text-blue-400">sending</code>, constructs the RFC 5322 MIME message, and connects to your configured SMTP relay (Gmail, SendGrid, Amazon SES, or custom host).
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                  4
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-200">Audit Logging & Retry Resilience</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upon successful SMTP handshake, the database record is updated to <code className="text-emerald-400">sent</code> with provider message IDs and completion timestamps. If SMTP fails (timeout or network error), QStash automatically retries with exponential backoff up to 3 times before setting status to <code className="text-red-400">failed</code>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: FEATURES */}
          <section id="features" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" /> Features Breakdown
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Core Capabilities & Design Highlights
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                <Server className="w-5 h-5 text-amber-400 mb-1" />
                <h3 className="text-sm font-semibold text-slate-200">Zero Serverless Timeouts</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Decoupled ingestion means user requests never hang waiting for SMTP socket negotiations to conclude.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                <Shield className="w-5 h-5 text-emerald-400 mb-1" />
                <h3 className="text-sm font-semibold text-slate-200">SHA-256 API Key Security</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Raw API keys are revealed only once upon creation. Only one-way SHA-256 cryptographic hashes are stored.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                <Database className="w-5 h-5 text-blue-400 mb-1" />
                <h3 className="text-sm font-semibold text-slate-200">Full Audit History</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every email sent, queued, or failed is logged with full metadata, recipient addresses, and error traces.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                <Clock className="w-5 h-5 text-purple-400 mb-1" />
                <h3 className="text-sm font-semibold text-slate-200">Exponential Backoff Retries</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Transient network failures or SMTP provider rate limits are automatically retried by QStash up to 3 times.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                <Key className="w-5 h-5 text-rose-400 mb-1" />
                <h3 className="text-sm font-semibold text-slate-200">Strict Account Limit Quota</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enforces a maximum threshold of 3 administrator accounts per deployment to protect against free-tier abuse.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                <Send className="w-5 h-5 text-amber-400 mb-1" />
                <h3 className="text-sm font-semibold text-slate-200">Interactive Dispatch Trigger</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Includes in-dashboard test dispatch tool and manual trigger button to re-process queued messages anytime.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4: SETUP GUIDE */}
          <section id="setup" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Settings className="w-3.5 h-3.5" /> Setup Guide
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              How to Configure & Deploy
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Follow these straightforward steps to set up your environment variables, Supabase database tables, and SMTP credentials.
            </p>

            {/* Step 1: Env Vars */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold">1</span>
                  Configure Environment Variables (.env.local)
                </h3>
                <button
                  onClick={() =>
                    copyCode(
                      "env",
                      `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Upstash QStash Configuration
QSTASH_TOKEN=ey...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...

# SMTP Relay Configuration (e.g., Gmail, SendGrid, Resend, Amazon SES)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=Your Name <your-email@gmail.com>

# Microservice Public Domain
APP_URL=https://your-domain.vercel.app`
                    )
                  }
                  className="px-3 py-1 text-xs font-mono text-slate-400 hover:text-amber-400 border border-slate-800 rounded-md hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  {copiedIndex === "env" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedIndex === "env" ? "Copied" : "Copy .env template"}
                </button>
              </div>

              <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800/80 leading-relaxed">
{`# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Upstash QStash Configuration (Free at console.upstash.com)
QSTASH_TOKEN=ey...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...

# SMTP Relay Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Your Name <your-email@gmail.com>

# Public App Base URL
APP_URL=https://your-app.vercel.app`}
              </pre>
            </div>

            {/* Step 2: Database Setup */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold">2</span>
                  Supabase Database Schema Setup
                </h3>
                <button
                  onClick={() =>
                    copyCode(
                      "sql",
                      `-- 1. Create API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Email Delivery Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  sender VARCHAR(255),
  status VARCHAR(20) DEFAULT 'queued',
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Indexes for High Performance Lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_status ON public.email_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);`
                    )
                  }
                  className="px-3 py-1 text-xs font-mono text-slate-400 hover:text-amber-400 border border-slate-800 rounded-md hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  {copiedIndex === "sql" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedIndex === "sql" ? "Copied" : "Copy SQL Schema"}
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Execute the SQL snippet below in the Supabase SQL Editor. It generates the required tables, foreign keys, and indexes for high-speed API key authentication and telemetry logging.
              </p>

              <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800/80 leading-relaxed max-h-56">
{`CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  sender VARCHAR(255),
  status VARCHAR(20) DEFAULT 'queued',
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
              </pre>
            </div>

            {/* Step 3: SMTP Credentials */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold">3</span>
                Configuring Popular SMTP Relays
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-1.5">
                  <span className="font-semibold text-amber-400">Gmail / Google Workspace</span>
                  <p className="text-slate-400">
                    Host: <code className="text-slate-300">smtp.gmail.com</code> | Port: <code className="text-slate-300">465</code> (SSL)
                  </p>
                  <p className="text-slate-500">
                    Enable 2-Step Verification in Google Account, then generate a 16-character <strong>App Password</strong>.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-1.5">
                  <span className="font-semibold text-blue-400">SendGrid / Twilio</span>
                  <p className="text-slate-400">
                    Host: <code className="text-slate-300">smtp.sendgrid.net</code> | Port: <code className="text-slate-300">587</code> (STARTTLS)
                  </p>
                  <p className="text-slate-500">
                    Username: <code className="text-slate-300">apikey</code> | Password: Your SendGrid API Key (starts with SG.).
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-1.5">
                  <span className="font-semibold text-emerald-400">Amazon SES</span>
                  <p className="text-slate-400">
                    Host: <code className="text-slate-300">email-smtp.us-east-1.amazonaws.com</code> | Port: <code className="text-slate-300">465</code>
                  </p>
                  <p className="text-slate-500">
                    Obtain dedicated SMTP user credentials from the AWS SES console.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-1.5">
                  <span className="font-semibold text-purple-400">Postmark / Resend</span>
                  <p className="text-slate-400">
                    Host: <code className="text-slate-300">smtp.postmarkapp.com</code> / <code className="text-slate-300">smtp.resend.com</code>
                  </p>
                  <p className="text-slate-500">
                    Port: <code className="text-slate-300">587</code> | Password: Server API Token.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: IMPLEMENTATION & CODE SAMPLES */}
          <section id="implementation" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Code2 className="w-3.5 h-3.5" /> Implementation & Code Samples
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Runnable Code Examples in Any Language
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Integrate sending into your applications with ready-to-run snippets in your language of choice.
            </p>

            {/* Language Selector Tabs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-slate-900/90">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(["curl", "node", "nextjs", "python", "go", "php"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveTab(lang)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                        activeTab === lang
                          ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {lang === "curl" ? "cURL" : lang === "node" ? "Node.js" : lang === "nextjs" ? "Next.js" : lang}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => copyCode(activeTab, codeSnippets[activeTab])}
                  className="px-3 py-1 text-xs font-mono text-slate-400 hover:text-amber-400 border border-slate-800 rounded-md hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  {copiedIndex === activeTab ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedIndex === activeTab ? "Copied" : "Copy Code"}</span>
                </button>
              </div>

              <div className="p-5 bg-slate-950">
                <pre className="text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed">
                  {codeSnippets[activeTab]}
                </pre>
              </div>
            </div>
          </section>

          {/* SECTION 6: API REFERENCE */}
          <section id="endpoints" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Terminal className="w-3.5 h-3.5" /> API Reference
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              REST Endpoints Reference
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              All endpoints require authentication via Bearer token: <code className="text-amber-300">Authorization: Bearer ak_live_...</code>
            </p>

            {/* Endpoint 1: POST /api/v1/send */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold font-mono text-xs">
                    POST
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-100">/api/v1/send</span>
                </div>
                <span className="text-xs text-slate-400">Queue an email for delivery</span>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-semibold text-slate-300">Request Body Parameters:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-amber-300">to</span> <span className="text-rose-400 font-semibold">(required)</span>
                    <p className="text-slate-400 mt-1">Recipient email address (e.g., &quot;user@example.com&quot;).</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-amber-300">subject</span> <span className="text-rose-400 font-semibold">(required)</span>
                    <p className="text-slate-400 mt-1">Subject line of the email.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-amber-300">html</span> <span className="text-slate-400">(optional)</span>
                    <p className="text-slate-400 mt-1">HTML content body for formatted emails.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-amber-300">text</span> <span className="text-slate-400">(optional)</span>
                    <p className="text-slate-400 mt-1">Plaintext fallback representation.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-amber-300">from</span> <span className="text-slate-400">(optional)</span>
                    <p className="text-slate-400 mt-1">Sender name and email. Defaults to environment SMTP_FROM.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-amber-300">replyTo</span> <span className="text-slate-400">(optional)</span>
                    <p className="text-slate-400 mt-1">Reply-to destination address.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-semibold text-slate-300">Expected Response (HTTP 202 Accepted):</span>
                <pre className="font-mono text-amber-300 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
{`{
  "status": "queued",
  "id": "e4b2d184-cf72-4e4a-9ef9-5ba981329bf2",
  "message": "Email enqueued for delivery"
}`}
                </pre>
              </div>
            </div>

            {/* Endpoint 2: GET /api/v1/messages */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold font-mono text-xs">
                    GET
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-100">/api/v1/messages</span>
                </div>
                <span className="text-xs text-slate-400">List paginated historical delivery logs</span>
              </div>

              <div className="text-xs text-slate-400">
                Query parameters: <code className="text-slate-300">limit</code> (default 50), <code className="text-slate-300">status</code> (<code className="text-amber-300">queued | sending | sent | failed</code>).
              </div>

              <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
{`{
  "messages": [
    {
      "id": "e4b2d184-cf72-4e4a-9ef9-5ba981329bf2",
      "recipient": "customer@example.com",
      "subject": "Order Confirmation #84920",
      "status": "sent",
      "retry_count": 0,
      "created_at": "2026-10-18T05:14:02Z"
    }
  ]
}`}
              </pre>
            </div>

            {/* Endpoint 3: GET /api/v1/messages/:id */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold font-mono text-xs">
                    GET
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-100">/api/v1/messages/:id</span>
                </div>
                <span className="text-xs text-slate-400">Fetch real-time delivery status for a specific message</span>
              </div>

              <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
{`{
  "id": "e4b2d184-cf72-4e4a-9ef9-5ba981329bf2",
  "status": "sent",
  "recipient": "customer@example.com",
  "subject": "Order Confirmation #84920",
  "error_message": null,
  "retry_count": 0,
  "updated_at": "2026-10-18T05:14:04Z"
}`}
              </pre>
            </div>
          </section>

          {/* SECTION 7: USE CASES */}
          <section id="use-cases" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Real-World Use Cases
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Where to Deploy the Serverless Email API
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-base font-semibold text-slate-200">SaaS User Onboarding & Magic Links</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Eliminate sluggish signup flows. When a user registers, submit the verification or welcome email to the API and return the UI response instantly, avoiding user-perceived lag.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-base font-semibold text-slate-200">E-Commerce Checkout Receipts</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send Stripe or payment completion notifications. Even if your store experiences high traffic spikes, QStash smooths the outgoing dispatch rate to prevent SMTP account bans.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-base font-semibold text-slate-200">Cron Jobs & Automated Health Alerts</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Trigger automated nightly database backups, uptime monitors, or daily digest emails directly from cron serverless functions with full delivery audit logs.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="text-base font-semibold text-slate-200">Multi-Service Internal Microservice</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Serve as a centralized internal mailer for multiple backend microservices (Go, Python, Rails, Node) with per-service API key revocation and audit trails.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 8: TROUBLESHOOTING & FAQ */}
          <section id="troubleshooting" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" /> Troubleshooting & FAQ
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <h4 className="font-semibold text-slate-200 text-sm">
                  Why does my email show as &quot;queued&quot; in local development?
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Upstash QStash requires a publicly reachable webhook URL (<code className="text-amber-300">APP_URL</code>) to trigger the worker. In local development (<code className="text-slate-300">localhost:3000</code>), QStash cannot reach your private laptop without a tunnel like ngrok. To solve this, you can click the <strong className="text-slate-200">&quot;Trigger Delivery&quot;</strong> button in the Console table to process any queued message instantly via the internal processor.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <h4 className="font-semibold text-slate-200 text-sm">
                  What causes &quot;Invalid login: 535-5.7.8 Username and Password not accepted&quot;?
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  This happens if you are using Gmail with your standard account password. Google requires you to enable 2-Step Verification and create an <strong>App Password</strong> (16 characters without spaces) under Security &gt; 2-Step Verification &gt; App Passwords.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <h4 className="font-semibold text-slate-200 text-sm">
                  How does the 3-Account Maximum quota work?
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  To keep the deployment safely within free tier database limits and prevent spam abuse, the authentication gateway allows a maximum of 3 unique registered accounts. The count is dynamically updated across Supabase Auth users and API key creators.
                </p>
              </div>
            </div>
          </section>

          {/* Bottom Navigation CTA */}
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-slate-100">Ready to test the API?</h3>
              <p className="text-xs text-slate-400">Head over to the Console to create keys, send a test email, or inspect delivery logs.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded-xl hover:bg-amber-300 transition-colors flex items-center gap-2"
              >
                Open Console <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-8 text-center text-xs text-slate-500 font-mono">
        Serverless Email API Documentation · Powered by Next.js, Supabase, Upstash QStash & Nodemailer
      </footer>
    </div>
  );
}
