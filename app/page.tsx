import Link from "next/link";
import { Mail, Terminal, Shield, Zap, ArrowRight, CheckCircle2, Server, Database, Cpu } from "lucide-react";

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
            <p className="text-xs text-slate-400 font-mono">Next.js · Supabase · Upstash QStash · Nodemailer</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
          <a href="#architecture" className="hover:text-slate-200 transition-colors">Architecture</a>
          <a href="#endpoints" className="hover:text-slate-200 transition-colors">API Reference</a>
        </nav>

        <div className="flex items-center gap-3">
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
                className="px-6 py-3 text-xs font-semibold text-slate-950 bg-amber-400 rounded-xl hover:bg-amber-300 transition-colors flex items-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#endpoints"
                className="px-6 py-3 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
              >
                View API Docs
              </a>
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

        {/* Endpoints Documentation */}
        <div id="endpoints" className="space-y-6 pt-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">API Endpoints Reference</h2>
          
          <div className="space-y-4 font-mono text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">POST</span>
                <span className="text-slate-200 font-semibold">/api/v1/send</span>
              </div>
              <span className="text-slate-400 font-sans">Queue email for asynchronous SMTP transmission</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold">GET</span>
                <span className="text-slate-200 font-semibold">/api/v1/messages</span>
              </div>
              <span className="text-slate-400 font-sans">List paginated historical email audit logs</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold">GET</span>
                <span className="text-slate-200 font-semibold">/api/v1/messages/:id</span>
              </div>
              <span className="text-slate-400 font-sans">Check delivery state and error details for a message ID</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-8 text-center text-xs text-slate-500 font-mono">
        Serverless Email API Server · Powered by Next.js, Supabase, Upstash QStash & Nodemailer
      </footer>
    </div>
  );
}
