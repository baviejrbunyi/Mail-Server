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
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";

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
  // Demo user simulation state (Max 3 demo users enforcement)
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [demoUserCount, setDemoUserCount] = useState(1);
  const [authError, setAuthError] = useState("");

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
  const [subject, setSubject] = useState("Test Email via Serverless API");
  const [textBody, setTextBody] = useState("Hello! This email was dispatched via Next.js API, Upstash QStash, and Nodemailer.");
  const [isSending, setIsSending] = useState(false);
  const [sendResponse, setSendResponse] = useState<any>(null);

  // Audit Logs state
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Handle Login / Registration (Enforcing 3 demo user limit)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!userEmail || !userEmail.includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (demoUserCount >= 3) {
      setAuthError("Demo account limit reached (maximum 3 users allowed in demo mode).");
      return;
    }

    const mockUserId = "usr_" + userEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + "_12345";
    setUserId(mockUserId);
    setIsLoggedIn(true);
    setDemoUserCount((prev) => prev + 1);
    localStorage.setItem("email_api_user", JSON.stringify({ userId: mockUserId, email: userEmail }));
    fetchData(mockUserId);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    setUserEmail("");
    localStorage.removeItem("email_api_user");
  };

  useEffect(() => {
    const saved = localStorage.getItem("email_api_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email) {
          const validUserId = parsed.userId || "usr_" + parsed.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + "_12345";
          setUserId(validUserId);
          setUserEmail(parsed.email);
          setIsLoggedIn(true);
          fetchData(validUserId);
        }
      } catch {}
    }
  }, []);

  // Fetch API Keys & Logs when logged in
  const fetchData = async (targetUserId?: string) => {
    const activeUserId = targetUserId || userId;
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
      const activeAuthKey = selectedKey || "ak_live_demo123456789abcdef0123456789abcdef";
      const logsRes = await fetch(`/api/v1/messages`, {
        headers: { Authorization: `Bearer ${activeAuthKey}` },
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.items) {
          setLogs(logsData.items);
        }
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && userId && userId !== "null" && userId !== "undefined") {
      fetchData(userId);
    }
  }, [isLoggedIn, userId]);

  // Create API Key
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !userId || userId === "null" || userId === "undefined") return;
    setIsCreatingKey(true);
    setRawCreatedKey("");

    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name: newKeyName }),
      });
      const data = await res.json();
      if (res.ok) {
        setRawCreatedKey(data.apiKey);
        setSelectedKey(data.apiKey);
        setNewKeyName("");
        fetchData(userId);
      } else {
        alert(data.error || "Failed to create API key");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Send Email Playground
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
        }),
      });

      const data = await res.json();
      setSendResponse({ status: res.status, data });
      if (res.ok) {
        // Optimistically add to logs
        setLogs((prev) => [
          {
            message_id: data.messageId || "msg_" + Math.random().toString(36).slice(2, 10),
            recipient: [toEmail],
            sender: fromEmail,
            subject,
            status: "queued",
            retry_count: 0,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setSendResponse({ status: 500, data: { error: err.message } });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-8 px-8 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 hover:bg-amber-500/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100">API Developer Dashboard</h1>
            <p className="text-xs text-slate-400 font-mono">Manage keys, test endpoints, and inspect logs</p>
          </div>
        </div>

        {isLoggedIn && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{userEmail}</span>
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {!isLoggedIn ? (
          /* LOGIN / 3 DEMO USERS GATEWAY */
          <div className="max-w-md mx-auto mt-16 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Dashboard Access</h2>
              <p className="text-xs text-slate-400">
                Sign in with your email to generate API keys and test the serverless email API. (Demo limit: 3 users max).
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-xl text-xs transition-colors shadow-sm"
              >
                Enter Dashboard ({3 - demoUserCount} demo slots left)
              </button>
            </form>
          </div>
        ) : (
          /* LOGGED IN DASHBOARD CONTENT */
          <div className="space-y-8">
            {/* API Keys Management Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">API Keys</h3>
                  <p className="text-xs text-slate-400">Manage live secret keys for authenticating <code className="text-amber-400">POST /api/v1/send</code></p>
                </div>
                <form onSubmit={handleCreateApiKey} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Key name (e.g., Production App)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isCreatingKey}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> Generate Key
                  </button>
                </form>
              </div>

              {rawCreatedKey && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400">New API Key Generated (Copy now, it won't be shown again!)</span>
                    <button
                      onClick={() => copyToClipboard(rawCreatedKey)}
                      className="px-3 py-1 bg-amber-400 text-slate-950 rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-300 transition-colors"
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
                        <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                        <button
                          onClick={() => {
                            setSelectedKey(k.key_prefix);
                            alert("Select the key for testing in the playground or paste your full raw key.");
                          }}
                          className="text-amber-400 hover:underline"
                        >
                          Use in Playground
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 py-8 text-center text-slate-500 text-xs">
                    No API keys created yet. Generate your first key above.
                  </div>
                )}
              </div>
            </div>

            {/* Email API Playground & Audit Logs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* API Playground */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-lg font-semibold text-slate-100">API Playground</h3>
                  <p className="text-xs text-slate-450">Test <code className="text-amber-400">POST /api/v1/send</code></p>
                </div>

                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">API Secret Key (Bearer)</label>
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
                      <label className="block text-xs font-medium text-slate-300 mb-1">To Address</label>
                      <input
                        type="email"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">From Address</label>
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">Message Body</label>
                    <textarea
                      rows={3}
                      value={textBody}
                      onChange={(e) => setTextBody(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSending ? "Publishing to QStash..." : "Send Email via API"}
                  </button>
                </form>

                {sendResponse && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-400">Response (HTTP {sendResponse.status})</span>
                    <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800">
                      {JSON.stringify(sendResponse.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Audit Logs */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">Email Audit Logs</h3>
                    <p className="text-xs text-slate-400">Real-time status tracking via Supabase</p>
                  </div>
                  <button
                    onClick={() => fetchData()}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    title="Refresh Logs"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <div key={log.message_id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-amber-400">{log.message_id}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                              log.status === "sent"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : log.status === "queued"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 font-medium truncate">{log.subject}</div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>To: {log.recipient?.join(", ")}</span>
                          <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-24 text-center text-slate-500 text-xs">
                      No email delivery logs recorded yet. Send a test email from the playground.
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
        Serverless Email API Dashboard · Vercel & Supabase
      </footer>
    </div>
  );
}
