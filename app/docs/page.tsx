"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Terminal,
  Server,
  Database,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  BookOpen,
  Key,
  HelpCircle,
  Send,
  Sparkles,
  Globe,
  CheckCheck
} from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<"curl" | "node" | "nextjs" | "python" | "go" | "php">("curl");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [baseUrl, setBaseUrl] = useState<string>("https://your-mail-server.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST ${baseUrl}/api/v1/send \\
  -H "Authorization: Bearer ak_live_YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "customer@example.com",
    "from": "notifications@yourdomain.com",
    "subject": "Order Confirmation #84920",
    "html": "<h1>Thank you for your order!</h1><p>Your package is being prepared.</p>",
    "text": "Thank you for your order! Your package is being prepared."
  }'`,
    node: `// Node.js (Node 18+ native fetch or axios)
async function sendEmail() {
  const response = await fetch("${baseUrl}/api/v1/send", {
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
  // Store these in your project's .env.local
  const apiKey = process.env.MAIL_SERVER_API_KEY; // ak_live_...
  const apiUrl = process.env.MAIL_SERVER_URL || "${baseUrl}";

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

MAIL_SERVER_URL = "${baseUrl}/api/v1/send"
API_KEY = "ak_live_YOUR_API_KEY_HERE"

def send_transactional_email(to_email: str, subject: str, message_body: str):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "to": to_email,
        "from": "alerts@yourdomain.com",
        "subject": subject,
        "html": f"<p>{message_body}</p>",
        "text": message_body
    }

    response = requests.post(MAIL_SERVER_URL, json=payload, headers=headers, timeout=10)
    response.raise_for_status()
    
    data = response.json()
    print(f"Queued message ID: {data['id']} (Status: {data['status']})")
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

	req, _ := http.NewRequest("POST", "${baseUrl}/api/v1/send", bytes.NewBuffer(body))
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
$endpoint = "${baseUrl}/api/v1/send";

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

  const tabFilenames: Record<string, string> = {
    curl: "send-email.sh",
    node: "send-email.mjs",
    nextjs: "send-welcome.ts",
    python: "send_email.py",
    go: "main.go",
    php: "send_email.php",
  };

  const projectEnvExample = `# In your own application's .env or .env.local:
MAIL_SERVER_URL=${baseUrl}
MAIL_SERVER_API_KEY=ak_live_YOUR_GENERATED_KEY_HERE`;

  const sections = [
    { id: "overview", label: "Using This Mail Server" },
    { id: "quickstart", label: "Quickstart (3 Steps)" },
    { id: "implementation", label: "Code Samples & SDKs" },
    { id: "endpoints", label: "API Reference" },
    { id: "use-cases", label: "Real-World Use Cases" },
    { id: "troubleshooting", label: "Developer FAQ" },
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
                <h1 className="text-base font-bold tracking-tight text-slate-100">API Documentation & Integration Guide</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  v1.0 Live
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">How to integrate this deployed mail server into your applications</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors shadow-sm flex items-center gap-2"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Generate API Key</span>
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
                Documentation Index
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

            {/* Live Service URL Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" /> Base Endpoint URL
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                <code className="text-[11px] font-mono text-sky-300 truncate">{baseUrl}</code>
                <button
                  onClick={() => copyCode("baseUrlSidebar", baseUrl)}
                  className="text-slate-400 hover:text-amber-400 p-1 rounded"
                  title="Copy base URL"
                >
                  {copiedIndex === "baseUrlSidebar" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Use this URL for all API requests from your backend code.
              </p>
            </div>

            {/* Quick API Key CTA */}
            <div className="bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-500/20 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Zap className="w-4 h-4" /> Need an API Key?
              </div>
              <p className="text-slate-400 leading-relaxed">
                Log into our Console, click <strong>Generate Key</strong>, and you can start sending emails immediately. No SMTP or database setup needed!
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-amber-400 hover:underline font-semibold text-xs pt-1"
              >
                Open Console <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Documentation Content Body */}
        <main className="lg:col-span-3 space-y-16">
          {/* SECTION 1: OVERVIEW */}
          <section id="overview" className="space-y-6 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Turnkey Email Service
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">
              Integrate Email Sending Into Your Project in Minutes
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              This deployed <strong>Serverless Email API</strong> is a ready-to-use email microservice. You <strong>do not</strong> need to set up your own mail server, configure SMTP relays, manage queue workers, or provision a database. All you need is an <strong>API Key</strong> generated from our Console.
            </p>

            {/* Clarification Box: Zero Infra */}
            <div className="bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Zap className="w-4 h-4" /> What You Need vs. What This Server Handles
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4" /> All You Need In Your App:
                  </span>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    <li>An <strong>API Key</strong> from our <Link href="/dashboard" className="text-amber-400 underline">Console</Link></li>
                    <li>An HTTP client (<code>fetch</code>, <code>cURL</code>, <code>axios</code>, or <code>requests</code>)</li>
                    <li>Call <code>POST {baseUrl}/api/v1/send</code></li>
                  </ul>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-sky-400" /> What This Server Manages For You:
                  </span>
                  <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                    <li>SMTP socket connections & TLS authentication</li>
                    <li>Asynchronous message queue (Upstash QStash)</li>
                    <li>Automatic exponential backoff retries</li>
                    <li>Full delivery logs & telemetry history</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How It Works Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-sm font-semibold text-slate-200">1. Call Our HTTP API</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your website or backend sends a JSON payload to our <code>/api/v1/send</code> endpoint with your Bearer API key.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-sm font-semibold text-slate-200">2. Instant 20ms Response</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The server responds immediately with <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">202 Accepted</code>. Your application thread never hangs waiting for slow SMTP handshakes.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="text-sm font-semibold text-slate-200">3. Reliable Delivery & Logs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our background worker delivers the email to the recipient's inbox, retrying automatically on errors, and logs status to your dashboard.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: QUICKSTART */}
          <section id="quickstart" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" /> Quickstart Guide
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              3 Steps to Start Sending in Your Project
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Follow these three quick steps to send emails from any codebase.
            </p>

            {/* Step 1: Generate Key */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold">1</span>
                  Generate Your API Key
                </h3>
                <Link
                  href="/dashboard"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 w-fit"
                >
                  <Key className="w-3.5 h-3.5" /> Open Console & Create Key
                </Link>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Open the <Link href="/dashboard" className="text-amber-400 hover:underline font-medium">Console Dashboard</Link>, register or log in, then click <strong>&quot;Generate New Key&quot;</strong>. Enter a label (e.g. <code>Production App</code> or <code>Local Dev</code>). You will receive an API key formatted like:
              </p>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between font-mono text-xs">
                <span className="text-emerald-400">ak_live_7a8f9c1b2e3d4f5a6b7c8d9e0f1a2b3c...</span>
                <span className="text-[10px] text-slate-500 uppercase font-sans">Secret Key</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Add this key to your project's server-side environment variables (e.g. <code>.env.local</code>):
              </p>

              <CodeEditor
                code={projectEnvExample}
                language="bash"
                filename=".env.local"
                showLineNumbers={true}
                copyable={true}
              />
            </div>

            {/* Step 2: Make Your First Request */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold">2</span>
                Send an Email via HTTP POST
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Dispatch a POST request to <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-950 border border-slate-800 text-sky-300">{baseUrl}/api/v1/send</code> with your authorization header:
              </p>

              <CodeEditor
                code={`curl -X POST ${baseUrl}/api/v1/send \\
  -H "Authorization: Bearer ak_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello from my app!",
    "html": "<h1>It works!</h1><p>Sent via the serverless email API.</p>",
    "text": "It works! Sent via the serverless email API."
  }'`}
                language="curl"
                filename="Quickstart cURL"
                showLineNumbers={true}
                copyable={true}
              />

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-slate-300">Instant Response (HTTP 202 Accepted):</span>
                <CodeEditor
                  code={`{
  "status": "queued",
  "id": "e4b2d184-cf72-4e4a-9ef9-5ba981329bf2",
  "message": "Email enqueued for delivery"
}`}
                  language="json"
                  filename="202_accepted.json"
                  showLineNumbers={false}
                  copyable={true}
                />
              </div>
            </div>

            {/* Step 3: Monitor Delivery Logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold">3</span>
                Check Delivery Logs & Analytics
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Monitor your emails in real time directly from your <Link href="/dashboard" className="text-amber-400 hover:underline font-medium">Console</Link>. You can inspect each message's lifecycle state:
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> queued
                  </span>
                  <p className="text-[11px] text-slate-400 font-sans">Received & scheduled in worker queue.</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> sending
                  </span>
                  <p className="text-[11px] text-slate-400 font-sans">Nodemailer SMTP handshake active.</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> sent
                  </span>
                  <p className="text-[11px] text-slate-400 font-sans">Accepted by recipient mail server.</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span> failed
                  </span>
                  <p className="text-[11px] text-slate-400 font-sans">Permanent bounce or invalid address.</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: IMPLEMENTATION & CODE SAMPLES */}
          <section id="implementation" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Code2 className="w-3.5 h-3.5" /> Implementation & Code Samples
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Copy-Paste Code Examples for Any Language
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Integrate email sending into your project with ready-to-run snippets. Replace <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-900 border border-slate-800 text-sky-300">ak_live_YOUR_API_KEY_HERE</code> with the key generated from your <Link href="/dashboard" className="text-amber-400 hover:underline">Console</Link>.
            </p>

            {/* Language Selector Tabs */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900/70 p-1.5 rounded-xl border border-slate-800/80 w-fit">
                {(["curl", "node", "nextjs", "python", "go", "php"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all capitalize flex items-center gap-1.5 ${
                      activeTab === lang
                        ? "bg-slate-800 text-sky-300 font-bold shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        lang === "curl"
                          ? "bg-cyan-400"
                          : lang === "node" || lang === "nextjs"
                          ? "bg-emerald-400"
                          : lang === "python"
                          ? "bg-blue-400"
                          : lang === "go"
                          ? "bg-sky-400"
                          : "bg-purple-400"
                      }`}
                    />
                    {lang === "curl"
                      ? "cURL"
                      : lang === "node"
                      ? "Node.js"
                      : lang === "nextjs"
                      ? "Next.js"
                      : lang}
                  </button>
                ))}
              </div>

              <CodeEditor
                code={codeSnippets[activeTab]}
                language={activeTab}
                filename={tabFilenames[activeTab]}
                showLineNumbers={true}
                copyable={true}
              />
            </div>
          </section>

          {/* SECTION 4: API REFERENCE */}
          <section id="endpoints" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Terminal className="w-3.5 h-3.5" /> API Reference
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              REST Endpoints Reference
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              All endpoints require authentication via Bearer token: <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-900 border border-slate-800 text-purple-300">Authorization: Bearer ak_live_...</code>
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
                    <span className="font-mono text-sky-300 font-semibold">to</span> <span className="text-rose-400 font-semibold">(required)</span>
                    <p className="text-slate-400 mt-1">Recipient email address (e.g., &quot;user@example.com&quot;).</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-sky-300 font-semibold">subject</span> <span className="text-rose-400 font-semibold">(required)</span>
                    <p className="text-slate-400 mt-1">Subject line of the email.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-sky-300 font-semibold">html</span> <span className="text-slate-400">(optional)</span>
                    <p className="text-slate-400 mt-1">HTML content body for formatted emails.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-sky-300 font-semibold">text</span> <span className="text-slate-400">(optional)</span>
                    <p className="text-slate-400 mt-1">Plaintext fallback representation.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-sky-300 font-semibold">from</span> <span className="text-slate-400">(optional)</span>
                    <p className="text-slate-400 mt-1">Custom sender name/email (e.g. &quot;Acme Alerts &lt;alerts@acme.com&gt;&quot;). Defaults to server default.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-mono text-sky-300 font-semibold">replyTo</span> <span className="text-slate-400">(optional)</span>
                    <p className="text-slate-400 mt-1">Reply-to destination address for recipient responses.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-300">Expected Response (HTTP 202 Accepted):</span>
                <CodeEditor
                  code={`{
  "status": "queued",
  "id": "e4b2d184-cf72-4e4a-9ef9-5ba981329bf2",
  "message": "Email enqueued for delivery"
}`}
                  language="json"
                  filename="202_accepted.json"
                  showLineNumbers={false}
                  copyable={true}
                />
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
                Query parameters: <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-950 border border-slate-800 text-slate-300">limit</code> (default 50), <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-950 border border-slate-800 text-slate-300">status</code> (<code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-950 border border-slate-800 text-sky-300">queued | sending | sent | failed</code>).
              </div>

              <CodeEditor
                code={`{
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
                language="json"
                filename="messages.json"
                showLineNumbers={false}
                copyable={true}
              />
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

              <CodeEditor
                code={`{
  "id": "e4b2d184-cf72-4e4a-9ef9-5ba981329bf2",
  "status": "sent",
  "recipient": "customer@example.com",
  "subject": "Order Confirmation #84920",
  "error_message": null,
  "retry_count": 0,
  "updated_at": "2026-10-18T05:14:04Z"
}`}
                language="json"
                filename="message_status.json"
                showLineNumbers={false}
                copyable={true}
              />
            </div>
          </section>

          {/* SECTION 5: USE CASES */}
          <section id="use-cases" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Real-World Use Cases
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Where to Use This API in Your Projects
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-base font-semibold text-slate-200">SaaS User Onboarding & Magic Links</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Eliminate sluggish signup flows. When a user registers, submit the verification or welcome email to this API and return the UI response instantly, avoiding user-perceived lag.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-base font-semibold text-slate-200">E-Commerce Checkout Receipts</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send Stripe or payment completion notifications. Even if your store experiences high traffic spikes, the queued worker smooths outgoing dispatch rates to prevent delivery drops.
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
                <h3 className="text-base font-semibold text-slate-200">Contact Form & Lead Submissions</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Forward inquiries from your marketing site directly to your team inbox with replyTo headers so you can hit &quot;Reply&quot; directly to the prospective customer.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 6: TROUBLESHOOTING & FAQ */}
          <section id="troubleshooting" className="space-y-6 border-t border-slate-800/80 pt-12 scroll-mt-24">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" /> Developer FAQ
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <h4 className="font-semibold text-slate-200 text-sm">
                  Do I need to set up my own Supabase, QStash, or SMTP accounts?
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  <strong>No!</strong> That is the primary advantage of this service. The mail server already has Supabase persistence, Upstash QStash queueing, and SMTP relay configured. All you need to do is generate an API key from our <Link href="/dashboard" className="text-amber-400 hover:underline">Console</Link> and pass it in the <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-950 border border-slate-800 text-purple-300">Authorization: Bearer ak_live_...</code> header.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <h4 className="font-semibold text-slate-200 text-sm">
                  How should I store my API key in my project?
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Store it in a server-side environment variable (e.g. <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-950 border border-slate-800 text-sky-300">MAIL_SERVER_API_KEY</code>). <strong>Never</strong> expose your API key in client-side browser bundles or public Git repositories. Call this API from Next.js Server Actions, API routes, or backend servers.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <h4 className="font-semibold text-slate-200 text-sm">
                  What happens if the recipient's mail provider temporarily rejects the email?
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Our service uses Upstash QStash to automatically retry the delivery up to <strong>3 times with exponential backoff</strong>. You can also view failed delivery attempts in the Console logs with the exact SMTP diagnostic error message, and click &quot;Trigger Delivery&quot; to re-queue it.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <h4 className="font-semibold text-slate-200 text-sm">
                  Can I track if an email was actually delivered?
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Yes. When you call <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-950 border border-slate-800 text-sky-300">POST /api/v1/send</code>, you receive a message <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-950 border border-slate-800 text-emerald-300">id</code>. You can either check its status anytime via <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-950 border border-slate-800 text-sky-300">GET /api/v1/messages/:id</code>, or monitor your sent message logs in the Console dashboard.
                </p>
              </div>
            </div>
          </section>

          {/* Bottom Navigation CTA */}
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-slate-100">Ready to start sending?</h3>
              <p className="text-xs text-slate-400">Generate your API key in the Console and make your first HTTP send request in seconds.</p>
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
        Serverless Email API Documentation · Turnkey HTTP Email Delivery for Modern Applications
      </footer>
    </div>
  );
}
