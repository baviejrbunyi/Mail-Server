"use client";

import React, { useState, useEffect } from "react";
import { 
  Server, 
  Terminal, 
  Database, 
  Send, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Key, 
  Layers, 
  ArrowRight,
  ExternalLink,
  Cpu,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface EmailLog {
  MessageId: string;
  ClientId: string;
  To: string | string[];
  From: string;
  Subject: string;
  Status: "queued" | "sent" | "failed";
  RetryCount: number;
  ErrorMsg?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "playground" | "logs" | "sam" | "code" | "sandbox">("overview");
  const [apiKey, setApiKey] = useState("ak_prod_99f83a2b1c4e");
  const [copiedKey, setCopiedKey] = useState(false);

  // Playground State
  const [toEmail, setToEmail] = useState("recipient@example.com");
  const [fromEmail, setFromEmail] = useState("sender@yourdomain.com");
  const [subject, setSubject] = useState("Hello from AWS Serverless Email API");
  const [textBody, setTextBody] = useState("This is a test email sent asynchronously via API Gateway, SQS queue, and Amazon SES Lambda worker.");
  const [htmlBody, setHtmlBody] = useState("<h1>Hello from AWS Serverless!</h1><p>This email was processed asynchronously via SQS and SES.</p>");
  const [isSending, setIsSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  // Logs State
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Code Viewer State
  const [activeCodeFile, setActiveCodeFile] = useState<"ingest" | "worker" | "auth">("ingest");
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/v1/messages", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (data.items) {
        setLogs(data.items);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [apiKey]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setLastResponse(null);

    try {
      const res = await fetch("/api/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
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
      setLastResponse({ status: res.status, data });
      if (res.ok) {
        fetchLogs();
      }
    } catch (err: any) {
      setLastResponse({ status: 500, data: { error: err.message } });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string, isCode = false) => {
    navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      String(l.MessageId).toLowerCase().includes(searchFilter.toLowerCase()) ||
      String(l.Subject).toLowerCase().includes(searchFilter.toLowerCase()) ||
      String(l.To).toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-8 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100">AWS Serverless Email API</h1>
            <p className="text-xs text-slate-400 font-mono">API Gateway · Lambda · SQS · DynamoDB · SES</p>
          </div>
        </div>

        {/* 4-5 Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab("overview")}
            className={`transition-colors whitespace-nowrap py-1 ${activeTab === "overview" ? "text-amber-400 font-semibold border-b-2 border-amber-400" : "hover:text-slate-200"}`}
          >
            Overview & Architecture
          </button>
          <button
            onClick={() => setActiveTab("playground")}
            className={`transition-colors whitespace-nowrap py-1 ${activeTab === "playground" ? "text-amber-400 font-semibold border-b-2 border-amber-400" : "hover:text-slate-200"}`}
          >
            API Playground
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`transition-colors whitespace-nowrap py-1 ${activeTab === "logs" ? "text-amber-400 font-semibold border-b-2 border-amber-400" : "hover:text-slate-200"}`}
          >
            Audit Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab("sam")}
            className={`transition-colors whitespace-nowrap py-1 ${activeTab === "sam" ? "text-amber-400 font-semibold border-b-2 border-amber-400" : "hover:text-slate-200"}`}
          >
            AWS SAM Template
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`transition-colors whitespace-nowrap py-1 ${activeTab === "code" ? "text-amber-400 font-semibold border-b-2 border-amber-400" : "hover:text-slate-200"}`}
          >
            Lambda Handlers
          </button>
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`transition-colors whitespace-nowrap py-1 ${activeTab === "sandbox" ? "text-amber-400 font-semibold border-b-2 border-amber-400" : "hover:text-slate-200"}`}
          >
            SES Sandbox & Curl
          </button>
        </nav>

        {/* Primary Action Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono text-slate-300 truncate max-w-[140px]">{apiKey}</span>
            <button
              onClick={() => copyToClipboard(apiKey)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy API Key"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            onClick={() => setActiveTab("playground")}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shadow-sm shadow-amber-500/20"
          >
            Send Test Email
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Mobile Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 border-b border-slate-800 text-xs">
          {(["overview", "playground", "logs", "sam", "code", "sandbox"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium capitalize transition-colors ${
                activeTab === tab ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {tab === "sam" ? "AWS SAM" : tab}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & ARCHITECTURE */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 rounded-2xl p-8 shadow-xl">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-medium">
                  <Cpu className="w-3.5 h-3.5" /> 100% Serverless Architecture · AWS Free Tier Ready
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-100">
                  High-Performance Transactional Email API Engine
                </h2>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                  Designed for modern applications requiring reliable, asynchronous email delivery. Ingestion API accepts payloads instantly via Amazon API Gateway, records state in DynamoDB, and offloads delivery to Amazon SQS and worker Lambdas using Amazon SES.
                </p>
                <div className="pt-2 flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveTab("playground")}
                    className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors flex items-center gap-2"
                  >
                    Open API Playground <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab("sam")}
                    className="px-5 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    View AWS SAM Template
                  </button>
                </div>
              </div>
            </div>

            {/* Architecture Flow Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">01</div>
                <h3 className="text-sm font-semibold text-slate-200">API Gateway & Auth</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  REST API endpoint validates Bearer tokens against the DynamoDB <code className="text-amber-300 font-mono">ApiKeys</code> table.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">02</div>
                <h3 className="text-sm font-semibold text-slate-200">Asynchronous SQS</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <code className="text-amber-300 font-mono">ingestEmail</code> logs request as <code className="text-amber-300 font-mono">queued</code> in DynamoDB and publishes job to FIFO SQS queue.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">03</div>
                <h3 className="text-sm font-semibold text-slate-200">Worker Lambda & SES</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <code className="text-amber-300 font-mono">processEmailQueue</code> triggers via SQS, invoking Amazon SES to dispatch emails reliably.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">04</div>
                <h3 className="text-sm font-semibold text-slate-200">Resilience & DLQ</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatic retries on throttling with Dead Letter Queue (DLQ) threshold and audit logs via GSI.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: API PLAYGROUND */}
        {activeTab === "playground" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">API Playground</h3>
                  <p className="text-xs text-slate-400">Test <code className="text-amber-400">POST /api/v1/send</code> endpoint instantly</p>
                </div>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded">POST 202 Accepted</span>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Authorization Bearer Token</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">From Address (Verified SES)</label>
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
                    rows={3}
                    value={textBody}
                    onChange={(e) => setTextBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">HTML Body</label>
                  <textarea
                    rows={3}
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSending ? "Publishing to SQS Queue..." : "Send Email via API"}
                </button>
              </form>
            </div>

            {/* Response Viewer */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-semibold text-slate-200">Response Payload</h3>
                  {lastResponse && (
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded ${
                        lastResponse.status === 202 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      HTTP {lastResponse.status}
                    </span>
                  )}
                </div>

                {lastResponse ? (
                  <pre className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800/80">
                    {JSON.stringify(lastResponse.data, null, 2)}
                  </pre>
                ) : (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    Submit the API request to inspect the JSON response and message ID.
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">cURL Equivalent</h4>
                <div className="relative">
                  <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
                    {`curl -X POST https://your-api.execute-api.region.amazonaws.com/prod/api/v1/send \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "${toEmail}", "from": "${fromEmail}", "subject": "${subject}", "text": "${textBody}"}'`}
                  </pre>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST https://api.execute-api.amazonaws.com/prod/api/v1/send -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json" -d '{"to": "${toEmail}", "from": "${fromEmail}", "subject": "${subject}", "text": "${textBody}"}'`
                      )
                    }
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === "logs" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">DynamoDB Email Audit Logs</h3>
                <p className="text-xs text-slate-400">Tracking message delivery lifecycle (queued, sent, failed) indexed by ClientId</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter by ID, subject, recipient..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-64"
                />
                <button
                  onClick={fetchLogs}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  title="Refresh Logs"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                    <th className="py-3 px-4">Message ID</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Retries</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs font-mono">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.MessageId} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4 text-amber-400">{log.MessageId}</td>
                        <td className="py-3 px-4 text-slate-300">{Array.isArray(log.To) ? log.To.join(", ") : log.To}</td>
                        <td className="py-3 px-4 text-slate-200 truncate max-w-xs">{log.Subject}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              log.Status === "sent"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : log.Status === "queued"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {log.Status === "sent" && <CheckCircle2 className="w-3 h-3" />}
                            {log.Status === "queued" && <Clock className="w-3 h-3" />}
                            {log.Status === "failed" && <AlertCircle className="w-3 h-3" />}
                            {log.Status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{log.RetryCount}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(log.CreatedAt).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                        No email logs found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* TAB 4: AWS SAM TEMPLATE */}
        {activeTab === "sam" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">AWS SAM Infrastructure Template (<code className="text-amber-400">template.yaml</code>)</h3>
                <p className="text-xs text-slate-400">Complete AWS CloudFormation serverless stack definitions</p>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: AWS Serverless Email API Server`,
                    true
                  )
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-2 transition-colors"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Copied!" : "Copy Template"}
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800 max-h-[550px]">
              {`AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  AWS Serverless Email API Server
  Lightweight high-performance email microservice using API Gateway, Lambda, SQS, DynamoDB, and SES.

Globals:
  Function:
    Timeout: 15
    MemorySize: 256
    Runtime: nodejs20.x

Resources:
  ApiKeysTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ApiKeys
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: ApiKey
          AttributeType: S
      KeySchema:
        - AttributeName: ApiKey
          KeyType: HASH

  EmailLogsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: EmailLogs
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: MessageId
          AttributeType: S
        - AttributeName: ClientId
          AttributeType: S
        - AttributeName: CreatedAt
          AttributeType: S
      KeySchema:
        - AttributeName: MessageId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: ClientId-CreatedAt-Index
          KeySchema:
            - AttributeName: ClientId
              KeyType: HASH
            - AttributeName: CreatedAt
              KeyType: RANGE
          Projection:
            ProjectionType: ALL

  EmailDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: EmailDLQ.fifo
      FifoQueue: true
      ContentBasedDeduplication: true

  EmailQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: EmailQueue.fifo
      FifoQueue: true
      ContentBasedDeduplication: true
      VisibilityTimeout: 60
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt EmailDLQ.Arn
        maxReceiveCount: 3

  EmailApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod

  IngestEmailFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/src/
      Handler: handlers/ingestEmail.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref ApiKeysTable
        - DynamoDBCrudPolicy:
            TableName: !Ref EmailLogsTable
        - SQSSendMessagePolicy:
            QueueName: !GetAtt EmailQueue.QueueName
      Events:
        SendApi:
          Type: Api
          Properties:
            RestApiId: !Ref EmailApi
            Path: /api/v1/send
            Method: POST

  ProcessEmailQueueFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/src/
      Handler: handlers/processEmailQueue.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref EmailLogsTable
        - Statement:
            - Effect: Allow
              Action:
                - ses:SendEmail
                - ses:SendRawEmail
              Resource: "*"
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt EmailQueue.Arn
            BatchSize: 5`}
            </pre>
          </motion.div>
        )}

        {/* TAB 5: LAMBDA HANDLERS */}
        {activeTab === "code" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Core Lambda Handlers & Middleware</h3>
                <p className="text-xs text-slate-400">Production TypeScript source code for ingestion, SQS worker, and authentication</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveCodeFile("ingest")}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${activeCodeFile === "ingest" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  ingestEmail.ts
                </button>
                <button
                  onClick={() => setActiveCodeFile("worker")}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${activeCodeFile === "worker" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  processEmailQueue.ts
                </button>
                <button
                  onClick={() => setActiveCodeFile("auth")}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${activeCodeFile === "auth" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  auth.ts
                </button>
              </div>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800 max-h-[550px]">
              {activeCodeFile === "ingest" &&
                `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateApiKey } from "../middleware/auth";
import crypto from "crypto";

const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);
const sqs = new SQSClient({});

const LOGS_TABLE = process.env.EMAIL_LOGS_TABLE || "EmailLogs";
const QUEUE_URL = process.env.EMAIL_QUEUE_URL || "";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const auth = await validateApiKey(event);
  if (!auth.isValid) return auth.errorResponse!;

  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing body" }) };
  }

  const payload = JSON.parse(event.body);
  const messageId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await dynamo.send(new PutCommand({
    TableName: LOGS_TABLE,
    Item: {
      MessageId: messageId,
      ClientId: auth.clientId,
      To: payload.to,
      From: payload.from,
      Subject: payload.subject,
      Status: "queued",
      RetryCount: 0,
      CreatedAt: createdAt,
      UpdatedAt: createdAt,
    },
  }));

  await sqs.send(new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify({ messageId, payload, clientId: auth.clientId }),
    MessageGroupId: auth.clientId || "default",
    MessageDeduplicationId: messageId,
  }));

  return {
    statusCode: 202,
    body: JSON.stringify({ status: "accepted", messageId, message: "Email queued successfully" }),
  };
};`}

              {activeCodeFile === "worker" &&
                `import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SQSEvent, SQSBatchResponse } from "aws-lambda";

const ses = new SESClient({ region: process.env.SES_REGION || "us-east-1" });
const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);
const LOGS_TABLE = process.env.EMAIL_LOGS_TABLE || "EmailLogs";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const { messageId, payload } = JSON.parse(record.body);
      const toAddresses = Array.isArray(payload.to) ? payload.to : [payload.to];

      await ses.send(new SendEmailCommand({
        Source: payload.from,
        Destination: { ToAddresses: toAddresses },
        Message: {
          Subject: { Data: payload.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: payload.text || "", Charset: "UTF-8" },
            ...(payload.html && { Html: { Data: payload.html, Charset: "UTF-8" } }),
          },
        },
      }));

      await dynamo.send(new UpdateCommand({
        TableName: LOGS_TABLE,
        Key: { MessageId: messageId },
        UpdateExpression: "SET #status = :status, UpdatedAt = :updatedAt",
        ExpressionAttributeNames: { "#status": "Status" },
        ExpressionAttributeValues: { ":status": "sent", ":updatedAt": new Date().toISOString() },
      }));
    } catch (error: any) {
      console.error("SES delivery error:", error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};`}

              {activeCodeFile === "auth" &&
                `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.API_KEYS_TABLE || "ApiKeys";

export async function validateApiKey(event: APIGatewayProxyEvent) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      isValid: false,
      errorResponse: { statusCode: 401, body: JSON.stringify({ error: "Missing Bearer token" }) },
    };
  }

  const apiKey = authHeader.replace("Bearer ", "").trim();
  const result = await dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { ApiKey: apiKey } }));

  if (!result.Item || result.Item.Status !== "ACTIVE") {
    return {
      isValid: false,
      errorResponse: { statusCode: 403, body: JSON.stringify({ error: "Invalid API key" }) },
    };
  }

  return { isValid: true, clientId: result.Item.ClientId };
}`}
            </pre>
          </motion.div>
        )}

        {/* TAB 6: SES SANDBOX & CURL */}
        {activeTab === "sandbox" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <AlertCircle className="w-4 h-4" /> Amazon SES Sandbox Notice & Verification
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When you first create an AWS SES account, you are placed in the **SES Sandbox**. In the sandbox, you can only send emails <span className="underline font-semibold">to and from email addresses or domains that you have explicitly verified</span> in the AWS SES Console. To send emails to arbitrary external recipients in production, you must submit a support ticket to request SES Production Access and remove sending limits.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-100">Verification & Testing Checklist</h3>
              <ul className="space-y-3 text-xs text-slate-300 list-disc pl-5">
                <li>Verify your sender domain or email address in the <span className="font-mono text-amber-400">Amazon SES Console -&gt; Verified Identities</span>.</li>
                <li>Provision your DynamoDB tables (<code className="text-amber-400 font-mono">ApiKeys</code>, <code className="text-amber-400 font-mono">EmailLogs</code>) and SQS queue using the provided SAM template.</li>
                <li>Insert an active test API key into your DynamoDB <code className="text-amber-400 font-mono">ApiKeys</code> table (`ApiKey: ak_prod_123`, `ClientId: client_demo`, `Status: ACTIVE`).</li>
                <li>Deploy your Lambdas via <code className="text-amber-400 font-mono">sam deploy --guided</code> and test using the cURL commands below.</li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-100">API Verification cURL Commands</h3>
              
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">1. Send Email (POST /api/v1/send)</span>
                <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800">
                  {`curl -X POST https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/api/v1/send \\
  -H "Authorization: Bearer ak_prod_99f83a2b1c4e" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "recipient@verifieddomain.com",
    "from": "sender@verifieddomain.com",
    "subject": "Hello from Serverless API",
    "text": "Testing AWS SES asynchronous email delivery via SQS."
  }'`}
                </pre>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-400">2. Check Message Status (GET /api/v1/messages/{'{"{id}"}'})</span>
                <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto border border-slate-800">
                  {`curl -X GET https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/api/v1/messages/msg_123456 \\
  -H "Authorization: Bearer ak_prod_99f83a2b1c4e"`}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-8 text-center text-xs text-slate-500 font-mono">
        AWS Serverless Email API Server · Built with AWS SAM, Lambda, SQS, DynamoDB & Amazon SES
      </footer>
    </div>
  );
}
