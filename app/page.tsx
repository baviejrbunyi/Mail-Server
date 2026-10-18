import Link from "next/link";
import { Mail, Terminal, Shield, Zap, ArrowRight, CheckCircle2, Server, Database, Cpu, BookOpen } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <header className="flex items-center justify-between gap-8 px-8 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100">Serverless Email API</h1>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
          <Link href="/docs" className="hover:text-amber-400 text-slate-200 transition-colors flex items-center gap-1.5 font-semibold">
            <BookOpen className="w-4 h-4 text-amber-400" /> Documentation
          </Link>
          <Link href="/dashboard" className="hover:text-slate-200 transition-colors">Console</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="hidden sm:flex px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Docs
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors shadow-sm flex items-center gap-2"
          >
            Dashboard & Keys <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-6 py-16 md:py-24 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-medium">
              <Zap className="w-3.5 h-3.5" /> 100% Vercel & Supabase Free Tier Ready
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-100 leading-tight">
              Bridge HTTP JSON to Traditional SMTP.
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed">
              A lightweight, independent serverless email microservice designed for Vercel. Offloads email relay to Upstash QStash webhooks and Nodemailer, ensuring zero request timeouts and automatic retries.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 text-xs font-semibold text-slate-950 bg-amber-400 rounded-xl hover:bg-amber-300 transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/10"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                className="px-6 py-3 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700/70 hover:border-amber-500/40 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-amber-400" /> Full Documentation
              </Link>
            </div>
          </div>

          {/* Terminal / Code Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-400">POST /api/v1/send</span>
            </div>
            <pre className="text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed">
              {`curl -X POST https://your-app.vercel.app/api/v1/send \\
  -H "Authorization: Bearer ak_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "user@example.com",
    "from": "noreply@yourdomain.com",
    "subject": "Welcome aboard!",
    "text": "Thanks for signing up."
  }'`}
            </pre>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Status: 202 Accepted</span>
              <span className="text-emerald-400">● QStash Queued</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">Serverless & Ephemeral</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built for Vercel Serverless Functions. Uses Upstash QStash webhooks instead of blocking background worker loops.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">Supabase PostgreSQL</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Secure API key hashing, role-based security, and comprehensive email delivery audit logs with pagination.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">Automatic Retries</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              QStash handles up to 3 built-in delivery retries on SMTP timeouts or rate limits before updating status to failed.
            </p>
          </div>
        </div>

        {/* Documentation Banner Callout */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" /> Comprehensive Developer Documentation
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              Complete Setup, Architecture & Implementation Guide
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Explore the dedicated documentation page featuring project overviews, setup tutorials for Supabase and QStash, SMTP configurations, endpoint references, and copy-paste code samples in cURL, TypeScript, Python, and Go.
            </p>
          </div>
          <Link
            href="/docs"
            className="px-6 py-3 text-xs font-semibold text-slate-950 bg-amber-400 rounded-xl hover:bg-amber-300 transition-colors shrink-0 flex items-center gap-2 shadow-lg shadow-amber-500/10"
          >
            Open Documentation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-8 text-center text-xs text-slate-500 font-mono">
        Serverless Email API Server · Powered by Next.js, Supabase, Upstash QStash & Nodemailer
      </footer>
    </div>
  );
}
