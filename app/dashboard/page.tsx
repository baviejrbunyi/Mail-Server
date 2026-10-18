"use client";

import React, { useState, useEffect } from "react";
import { 
  Key, 
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
  Sparkles,
  BookOpen,
  Mail
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CodeEditor } from "@/components/CodeEditor";
import { copyToClipboardSafe } from "@/lib/utils";

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

export default function DashboardPage() {
  // Auth state
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [remainingAccounts, setRemainingAccounts] = useState<number>(3);
  const [totalUsers, setTotalUsers] = useState<number>(0);

  const fetchAccountStats = async () => {
    try {
      const res = await fetch("/api/auth");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.remainingAccounts === "number") {
          setRemainingAccounts(data.remainingAccounts);
        }
        if (typeof data.totalUsers === "number") {
          setTotalUsers(data.totalUsers);
        }
      }
    } catch (err) {
      console.warn("Could not fetch account stats:", err);
    }
  };

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

  // Custom SMTP Relay state in Playground
  const [useCustomSmtp, setUseCustomSmtp] = useState(false);
  const [customSmtpHost, setCustomSmtpHost] = useState("smtp.gmail.com");
  const [customSmtpPort, setCustomSmtpPort] = useState<number>(465);
  const [customSmtpUser, setCustomSmtpUser] = useState("");
  const [customSmtpPass, setCustomSmtpPass] = useState("");

  // Audit Logs state
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [actionToast, setActionToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setActionToast({ type, text });
    setTimeout(() => setActionToast(null), 3500);
  };

  // Initialize Auth state on mount & synchronize account stats
  useEffect(() => {
    // 1. Immediately fetch remaining account slots
    fetchAccountStats();
    const interval = setInterval(fetchAccountStats, 8000);

    // 2. Check local session storage
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

    // 2b. Restore saved custom SMTP preferences
    try {
      const savedSmtp = localStorage.getItem("email_api_custom_smtp");
      if (savedSmtp) {
        const parsedSmtp = JSON.parse(savedSmtp);
        if (parsedSmtp.user) {
          setCustomSmtpUser(parsedSmtp.user);
          setFromEmail(parsedSmtp.user);
        }
        if (parsedSmtp.pass) setCustomSmtpPass(parsedSmtp.pass);
        if (parsedSmtp.host) setCustomSmtpHost(parsedSmtp.host);
        if (parsedSmtp.port) setCustomSmtpPort(Number(parsedSmtp.port));
        if (typeof parsedSmtp.useCustomSmtp === "boolean") setUseCustomSmtp(parsedSmtp.useCustomSmtp);
      }
    } catch {}

    // 3. Check Supabase Auth session if configured
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

      return () => {
        subscription.unsubscribe();
        clearInterval(interval);
      };
    } catch {
      return () => clearInterval(interval);
    }
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

  // Supabase Auth: Sign In or Sign Up via server-side auto-confirming API
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
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: authMode === "signup" ? "register" : "login",
          email: emailInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthMessage({
          type: "error",
          text: data.error || "Authentication failed. Please verify credentials.",
        });
        fetchAccountStats();
      } else if (data.user) {
        const authUser = { id: data.user.id, email: data.user.email || emailInput };
        setUser(authUser);
        localStorage.setItem("email_api_user", JSON.stringify(authUser));
        setAuthMessage({
          type: "success",
          text: data.message || "Logged in successfully!",
        });
        fetchAccountStats();
        fetchData(data.user.id);
      }
    } catch (err: any) {
      setAuthMessage({ type: "error", text: err.message });
      fetchAccountStats();
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
    fetchAccountStats();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSelectedKey("");
    setApiKeys([]);
    localStorage.removeItem("email_api_user");
    fetchAccountStats();
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
        showToast("API Key created successfully!", "success");
      } else {
        showToast(data.error || "Failed to create API key", "error");
      }
    } catch (err: any) {
      showToast("Error: " + err.message, "error");
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Send Email Playground with validation
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) {
      showToast("Please select or generate an API key first.", "error");
      return;
    }

    if (!customSmtpUser.trim() || !customSmtpPass.trim()) {
      showToast("Please provide your SMTP Username and Password (e.g. Gmail App Password).", "error");
      return;
    }

    setIsSending(true);
    setSendResponse(null);

    try {
      const payloadToSend: any = {
        to: toEmail,
        from: fromEmail || customSmtpUser.trim(),
        subject,
        text: textBody,
        html: htmlBody,
        smtp: {
          host: customSmtpHost.trim() || "smtp.gmail.com",
          port: Number(customSmtpPort) || 465,
          secure: Number(customSmtpPort) === 465,
          user: customSmtpUser.trim(),
          pass: customSmtpPass.trim(),
        },
      };

      try {
        localStorage.setItem(
          "email_api_custom_smtp",
          JSON.stringify({
            user: customSmtpUser.trim(),
            pass: customSmtpPass.trim(),
            host: customSmtpHost.trim(),
            port: customSmtpPort,
          })
        );
      } catch {}

      const res = await fetch("/api/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${selectedKey}`,
        },
        body: JSON.stringify(payloadToSend),
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

  const copyToClipboard = async (text: string) => {
    await copyToClipboardSafe(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl border flex items-center gap-2.5 backdrop-blur-md ${
              actionToast.type === "error"
                ? "bg-red-950/90 border-red-500/40 text-red-200"
                : "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
            }`}
          >
            {actionToast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{actionToast.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between gap-8 px-8 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 hover:bg-amber-500/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100">Serverless Email API Console</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Docs</span>
          </Link>

          {user && (
            <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {!user ? (
          /* AUTHENTICATION GATEWAY */
          <div className="max-w-md mx-auto mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Developer Authentication</h2>
              <p className="text-xs text-slate-400">
                Sign in or register an account ({remainingAccounts} of 3 account slots available).
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
                onClick={() => {
                  if (remainingAccounts > 0) {
                    setAuthMode("signup");
                    setAuthMessage(null);
                  }
                }}
                disabled={remainingAccounts <= 0}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  remainingAccounts <= 0
                    ? "opacity-50 cursor-not-allowed text-slate-500"
                    : authMode === "signup"
                    ? "bg-amber-400 text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Account (Max {remainingAccounts})
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
                disabled={authLoading || (authMode === "signup" && remainingAccounts <= 0)}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {authMode === "signin"
                  ? "Sign In to Dashboard"
                  : remainingAccounts <= 0
                  ? "Account Limit Reached (3/3)"
                  : `Register Account (${remainingAccounts} slot${remainingAccounts === 1 ? "" : "s"} left)`}
              </button>
            </form>

            <div className="relative border-t border-slate-800 pt-4 text-center">
              <span className="text-[11px] text-slate-500">Or test immediately without creating an account:</span>
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
                  <p className="text-xs text-slate-400">Manage secret keys for authenticating API requests</p>
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
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" /> New Secret API Key Generated (Copy now, it won&apos;t be shown again!)
                    </span>
                    <button
                      onClick={() => copyToClipboard(rawCreatedKey)}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey ? "Copied!" : "Copy Key"}
                    </button>
                  </div>
                  <div className="p-3 bg-[#0d1117] rounded-lg text-xs font-mono border border-slate-800 overflow-x-auto text-emerald-300 selection:bg-emerald-900">
                    {rawCreatedKey}
                  </div>
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
                            showToast("Selected key for playground!", "success");
                          }}
                          className="text-amber-400 hover:underline font-semibold"
                        >
                          Select Key
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 py-8 text-center text-slate-500 text-xs">
                    No API keys created yet. Generate your first API key above.
                  </div>
                )}
              </div>
            </div>

            {/* Email Playground & Audit Logs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Playground */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-lg font-semibold text-slate-100">API Playground</h3>
                  <p className="text-xs text-slate-400">Test <code className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-950 border border-slate-800 text-sky-300">POST /api/v1/send</code> with live validation</p>
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

                  {/* Mandatory SMTP Relay Credentials (BYOS) */}
                  <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-100">Your SMTP Relay Credentials</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-500/20 px-2 py-0.5 rounded font-semibold">
                        Required (BYOS)
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      This server operates on a <strong>Bring Your Own SMTP (BYOS)</strong> model. Supply your Gmail App Password or custom SMTP relay credentials. No credentials are saved on the server.
                    </p>

                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start justify-between gap-3">
                      <div>
                        <strong>Using Gmail?</strong> Use your Gmail address and a 16-character <strong>Google App Password</strong> (not your regular account password).
                      </div>
                      <Link
                        href="/docs#gmail-guide"
                        target="_blank"
                        className="text-amber-400 hover:underline font-semibold shrink-0 text-[11px]"
                      >
                        Guide →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Gmail / SMTP Username <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="yourname@gmail.com"
                          value={customSmtpUser}
                          onChange={(e) => {
                            setCustomSmtpUser(e.target.value);
                            setFromEmail(e.target.value);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          16-char App Password <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="password"
                          placeholder="abcd efgh ijkl mnop"
                          value={customSmtpPass}
                          onChange={(e) => setCustomSmtpPass(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <label className="block text-slate-400 mb-1">SMTP Host</label>
                        <input
                          type="text"
                          value={customSmtpHost}
                          onChange={(e) => setCustomSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Port</label>
                        <select
                          value={customSmtpPort}
                          onChange={(e) => setCustomSmtpPort(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
                          required
                        >
                          <option value={465}>465 (SSL - Recommended)</option>
                          <option value={587}>587 (TLS / STARTTLS)</option>
                        </select>
                      </div>
                    </div>
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
                    <CodeEditor
                      code={JSON.stringify(sendResponse.data, null, 2)}
                      language="json"
                      filename="response.json"
                      showLineNumbers={false}
                      copyable={true}
                    />
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
                          <span className="text-xs font-mono text-sky-300 font-medium">{log.message_id}</span>
                          <div className="flex items-center gap-2">
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
                      No email delivery logs recorded yet. Send a test email via the API playground.
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
