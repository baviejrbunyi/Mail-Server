"use client";

import React, { useState, useEffect } from "react";
import { 
  Key, 
  Mail, 
  Send, 
  RefreshCw, 
  Copy, 
  Check, 
  Plus, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  User, 
  ArrowLeft,
  Database,
  Sparkles,
  Terminal,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ApiKeyItem {
  id: string;
  key_prefix: string;
  name: string;
  status: string;
  created_at: string;
}

interface EmailLogItem {
  message_id: string;
  recipient: string[];
  sender: string;
  subject: string;
  status: "queued" | "sent" | "failed";
  retry_count: number;
  error_msg?: string;
  created_at: string;
}

interface SupabaseStatus {
  status: string;
  connected: boolean;
  message: string;
  tables?: { api_keys: boolean; email_logs: boolean };
  counts?: { api_keys: number; email_logs: number; users: number };
}

export default function DashboardPage() {
  // Auth state
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Supabase Database Diagnostic State
  const [dbStatus, setDbStatus] = useState<SupabaseStatus | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState("");

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [rawCreatedKey, setRawCreatedKey] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Playground state
  const [selectedKey, setSelectedKey] = useState("");
  const [toEmail, setToEmail] = useState("recipient@example.com");
  const [fromEmail, setFromEmail] = useState("noreply@yourdomain.com");
  const [subject, setSubject] = useState("Production Test Email");
  const [textBody, setTextBody] = useState("Hello! This email was processed via Next.js API, Upstash QStash, and Nodemailer.");
  const [htmlBody, setHtmlBody] = useState("<h2>Hello from Serverless API!</h2><p>Delivered securely via SMTP relay.</p>");
  const [isSending, setIsSending] = useState(false);
  const [sendResponse, setSendResponse] = useState<any>(null);

  // Audit Logs state
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Check Supabase Health
  const checkDbHealth = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch("/api/setup/status");
      const data = await res.json();
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({
        status: "error",
        connected: false,
        message: "Could not reach status API: " + err.message,
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  // Seed Supabase with demo data
  const handleSeedDatabase = async () => {
    setIsSeedingDb(true);
    setSeedSuccessMsg("");
    try {
      const res = await fetch("/api/setup/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedSuccessMsg(data.message || "Database seeded successfully!");
        checkDbHealth();
        if (user) fetchData(user.id);
      } else {
        alert(data.message || "Seeding failed");
      }
    } catch (err: any) {
      alert("Seeding error: " + err.message);
    } finally {
      setIsSeedingDb(false);
    }
  };

  // Initialize Auth state on mount
  useEffect(() => {
    checkDbHealth();

    // 1. Check local session storage
    const saved = localStorage.getItem("email_api_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id && parsed.email) {
          setUser(parsed);
          fetchData(parsed.id);
        }
      } catch {}
    }

    // 2. Check Supabase Auth session if configured
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser = { id: session.user.id, email: session.user.email || "" };
          setUser(authUser);
          localStorage.setItem("email_api_user", JSON.stringify(authUser));
          fetchData(session.user.id);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser = { id: session.user.id, email: session.user.email || "" };
          setUser(authUser);
          localStorage.setItem("email_api_user", JSON.stringify(authUser));
          fetchData(session.user.id);
        }
      });

      return () => subscription.unsubscribe();
    } catch {}
  }, []);

  // Fetch API Keys & Logs for user
  const fetchData = async (targetUserId?: string) => {
    const activeUserId = targetUserId || user?.id;
    if (!activeUserId || activeUserId === "null" || activeUserId === "undefined") return;

    setIsLoadingLogs(true);
    try {
      // Fetch keys
      const keysRes = await fetch(`/api/v1/keys?userId=${encodeURIComponent(activeUserId)}`);
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        if (keysData.keys) {
          setApiKeys(keysData.keys);
          if (keysData.keys.length > 0 && !selectedKey) {
            setSelectedKey(keysData.keys[0].key_prefix);
          }
        }
      }

      // Fetch logs
      const activeAuth = selectedKey || "ak_live_demo123456789abcdef0123456789abcdef";
      const logsRes = await fetch("/api/v1/messages", {
        headers: { Authorization: `Bearer ${activeAuth}` },
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.items) {
          setLogs(logsData.items);
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Supabase Auth: Sign In or Sign Up
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setAuthLoading(true);

    if (!emailInput || !passwordInput) {
      setAuthMessage({ type: "error", text: "Please provide both email and password." });
      setAuthLoading(false);
      return;
    }

    try {
      if (authMode === "signup") {
        // Enforce maximum 3 demo users restriction
        if (dbStatus?.counts?.users && dbStatus.counts.users >= 3) {
          setAuthMessage({
            type: "error",
            text: "Demo user limit reached (maximum 3 accounts allowed). Please sign in to an existing demo account.",
          });
          setAuthLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: emailInput,
          password: passwordInput,
        });

        if (error) {
          setAuthMessage({ type: "error", text: error.message });
        } else if (data.user) {
          const authUser = { id: data.user.id, email: data.user.email || emailInput };
          setUser(authUser);
          localStorage.setItem("email_api_user", JSON.stringify(authUser));
          setAuthMessage({ type: "success", text: "Account created successfully!" });
          fetchData(data.user.id);
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput,
        });

        if (error) {
          // If Supabase Auth is not set up, provide clear guidance
          setAuthMessage({
            type: "error",
            text: error.message || "Failed to sign in. If testing locally without Supabase Auth, use Demo Sandbox Login below.",
          });
        } else if (data.user) {
          const authUser = { id: data.user.id, email: data.user.email || emailInput };
          setUser(authUser);
          localStorage.setItem("email_api_user", JSON.stringify(authUser));
          fetchData(data.user.id);
        }
      }
    } catch (err: any) {
      setAuthMessage({ type: "error", text: err.message });
    } finally {
      setAuthLoading(false);
    }
  };

  // Instant Demo Sandbox Login (bypasses Supabase password if testing without live Supabase)
  const handleInstantDemoLogin = () => {
    const demoId = "00000000-0000-0000-0000-000000000001";
    const demoUser = { id: demoId, email: "developer@demo.local" };
    setUser(demoUser);
    localStorage.setItem("email_api_user", JSON.stringify(demoUser));
    setSelectedKey("ak_live_demo123456789abcdef0123456789abcdef");
    fetchData(demoId);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSelectedKey("");
    setApiKeys([]);
    localStorage.removeItem("email_api_user");
  };

  // Create API Key
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !user?.id) return;
    setIsCreatingKey(true);
    setRawCreatedKey("");

    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, name: newKeyName }),
      });
      const data = await res.json();
      if (res.ok) {
        setRawCreatedKey(data.apiKey);
        setSelectedKey(data.apiKey);
        setNewKeyName("");
        fetchData(user.id);
      } else {
        alert(data.error || "Failed to create API key");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Send Email Playground with validation
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) {
      alert("Please select or generate an API key first.");
      return;
    }

    setIsSending(true);
    setSendResponse(null);

    try {
      const res = await fetch("/api/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${selectedKey}`,
        },
        body: JSON.stringify({
          to: toEmail,
          from: fromEmail,
          subject,
          text: textBody,
          html: htmlBody,
        }),
      });

      const data = await res.json();
      setSendResponse({ status: res.status, data });

      if (res.ok) {
        // Refresh logs immediately (shows queued)
        if (user?.id) fetchData(user.id);
        // Refresh again after background worker delivers (shows sent)
        setTimeout(() => {
          if (user?.id) fetchData(user.id);
        }, 1800);
        setTimeout(() => {
          if (user?.id) fetchData(user.id);
        }, 3500);
      }
    } catch (err: any) {
      setSendResponse({ status: 500, data: { error: err.message } });
    } finally {
      setIsSending(false);
    }
  };

  // Manually trigger delivery for a queued message
  const handleTriggerDelivery = async (messageId: string) => {
    try {
      const activeAuth = selectedKey || "ak_live_demo123456789abcdef0123456789abcdef";
      const res = await fetch(`/api/v1/messages/${messageId}/process`, {
        method: "POST",
        headers: { Authorization: `Bearer ${activeAuth}` },
      });
      const data = await res.json();
      if (res.ok) {
        if (user?.id) fetchData(user.id);
      } else {
        alert(data.error || "Delivery trigger failed");
      }
    } catch (err: any) {
      alert("Trigger error: " + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-8 px-8 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 hover:bg-amber-500/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100">Serverless Email API Console</h1>
            <p className="text-xs text-slate-400 font-mono">Supabase Auth · API Keys · SQS / QStash Relay</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Database Diagnostic & Seeder Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                dbStatus?.connected && dbStatus.status === "ready" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-200">Supabase Database Connection</h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    dbStatus?.connected && dbStatus.status === "ready"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {dbStatus?.connected && dbStatus.status === "ready" ? "READY" : "LOCAL / UNPOPULATED"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{dbStatus?.message || "Checking database..."}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={checkDbHealth}
                disabled={isCheckingDb}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? "animate-spin" : ""}`} /> Test Connection
              </button>
              <button
                onClick={handleSeedDatabase}
                disabled={isSeedingDb}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> {isSeedingDb ? "Seeding..." : "Seed Demo Data"}
              </button>
            </div>
          </div>

          {seedSuccessMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{seedSuccessMsg}</span>
            </div>
          )}
        </div>

        {!user ? (
          /* AUTHENTICATION GATEWAY */
          <div className="max-w-md mx-auto mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Developer Authentication</h2>
              <p className="text-xs text-slate-400">
                Sign in with Supabase Auth or use the instant demo sandbox (3 accounts max).
              </p>
            </div>

            {/* Auth Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => { setAuthMode("signin"); setAuthMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  authMode === "signin" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode("signup"); setAuthMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  authMode === "signup" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Account (Max 3)
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="developer@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {authMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  authMessage.type === "error"
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                }`}>
                  {authMessage.type === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{authMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {authMode === "signin" ? "Sign In to Dashboard" : "Register Account"}
              </button>
            </form>

            <div className="relative border-t border-slate-800 pt-4 text-center">
              <span className="text-[11px] text-slate-500">Or skip Supabase credentials setup for now:</span>
              <button
                type="button"
                onClick={handleInstantDemoLogin}
                className="mt-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> Enter via Instant Demo Sandbox
              </button>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED USER DASHBOARD */
          <div className="space-y-8">
            {/* API Keys Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">API Keys</h3>
                  <p className="text-xs text-slate-400">Authenticated with user UUID: <code className="text-amber-400 font-mono">{user.id}</code></p>
                </div>

                <form onSubmit={handleCreateApiKey} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Key name (e.g. Staging Key)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isCreatingKey}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> Generate Key
                  </button>
                </form>
              </div>

              {rawCreatedKey && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400">New Secret API Key Generated (Copy now, it won't be shown again!)</span>
                    <button
                      onClick={() => copyToClipboard(rawCreatedKey)}
                      className="px-3 py-1 bg-amber-400 text-slate-950 rounded text-xs font-bold flex items-center gap-1.5 hover:bg-amber-300 transition-colors"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey ? "Copied!" : "Copy Key"}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto border border-amber-500/20">
                    {rawCreatedKey}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {apiKeys.length > 0 ? (
                  apiKeys.map((k) => (
                    <div key={k.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">{k.name}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono rounded">
                          {k.status}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400">{k.key_prefix}</div>
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{new Date(k.created_at).toLocaleDateString()}</span>
                        <button
                          onClick={() => {
                            setSelectedKey(k.key_prefix);
                            alert("Selected key for playground!");
                          }}
                          className="text-amber-400 hover:underline font-semibold"
                        >
                          Select for Testing
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 py-8 text-center text-slate-500 text-xs">
                    No API keys created yet. Generate your first API key above or click "Seed Demo Data".
                  </div>
                )}
              </div>
            </div>

            {/* Email Playground & Audit Logs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Playground */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">API Playground</h3>
                    <p className="text-xs text-slate-400">Test <code className="text-amber-400 font-mono">POST /api/v1/send</code> with live validation</p>
                  </div>
                  <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">202 Accepted</span>
                </div>

                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Authorization API Key</label>
                    <input
                      type="text"
                      placeholder="ak_live_..."
                      value={selectedKey}
                      onChange={(e) => setSelectedKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">To Address (Validated)</label>
                      <input
                        type="email"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">From Address (Validated)</label>
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Text Body</label>
                    <textarea
                      rows={2}
                      value={textBody}
                      onChange={(e) => setTextBody(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">HTML Body</label>
                    <textarea
                      rows={2}
                      value={htmlBody}
                      onChange={(e) => setHtmlBody(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSending ? "Validating & Queuing..." : "Send Email via API"}
                  </button>
                </form>

                {sendResponse && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Response Payload</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        sendResponse.status === 202 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        HTTP {sendResponse.status}
                      </span>
                    </div>
                    <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800">
                      {JSON.stringify(sendResponse.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Audit Logs */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">Email Audit Logs</h3>
                    <p className="text-xs text-slate-400">Indexed state: queued, sent, failed</p>
                  </div>
                  <button
                    onClick={() => fetchData(user.id)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    title="Refresh Logs"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <div key={log.message_id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-amber-400">{log.message_id}</span>
                          <div className="flex items-center gap-2">
                            {log.status === "queued" && (
                              <button
                                onClick={() => handleTriggerDelivery(log.message_id)}
                                className="px-2 py-0.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                                title="Run delivery worker immediately"
                              >
                                <Send className="w-2.5 h-2.5" /> Deliver Now
                              </button>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                                log.status === "sent"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : log.status === "queued"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {log.status === "sent" && <CheckCircle2 className="w-3 h-3" />}
                              {log.status === "queued" && <Clock className="w-3 h-3" />}
                              {log.status === "failed" && <AlertCircle className="w-3 h-3" />}
                              {log.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-300 font-medium truncate">{log.subject}</div>
                        {log.error_msg && (
                          <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded font-mono">
                            Error: {log.error_msg}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>To: {Array.isArray(log.recipient) ? log.recipient.join(", ") : log.recipient}</span>
                          <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-24 text-center text-slate-500 text-xs">
                      No email delivery logs recorded yet. Click "Seed Demo Data" above or send a test email.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-8 text-center text-xs text-slate-500 font-mono">
        Serverless Email API Console · Vercel & Supabase
      </footer>
    </div>
  );
}
