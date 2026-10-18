import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { globalEmailLogs, StoredEmailLog } from "@/lib/email-store";
import { Client } from "@upstash/qstash";
import crypto from "crypto";

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder"));
};

const isQStashConfigured = () => {
  const token = process.env.QSTASH_TOKEN;
  return Boolean(token && !token.includes("your-") && !token.includes("placeholder"));
};

export async function POST(req: NextRequest) {
  // 1. Authenticate API Key
  const auth = await validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { to, from, subject, text, html, attachments } = body;

    if (!to || !from || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: "Missing required fields: to, from, subject, and text or html" },
        { status: 400 }
      );
    }

    const messageId = "msg_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const recipientArray = Array.isArray(to) ? to : [to];
    const now = new Date().toISOString();

    const emailRecord: StoredEmailLog = {
      message_id: messageId,
      user_id: auth.userId,
      client_id: auth.clientId,
      recipient: recipientArray,
      sender: from,
      subject,
      text,
      html,
      status: "queued",
      retry_count: 0,
      created_at: now,
      updated_at: now,
    };

    // Mirror in local store for immediate UI visibility
    globalEmailLogs.unshift(emailRecord);

    // 2. Save record to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin.from("email_logs").insert({
          message_id: messageId,
          user_id: auth.userId,
          client_id: auth.clientId,
          recipient: recipientArray,
          sender: from,
          subject,
          status: "queued",
          retry_count: 0,
          created_at: now,
          updated_at: now,
        });
      } catch (dbErr) {
        console.warn("Supabase insert warning:", dbErr);
      }
    }

    // 3. Publish job to Upstash QStash if configured, otherwise simulate async worker
    if (isQStashConfigured()) {
      try {
        const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-vercel-app.vercel.app"}/api/internal/process-email`;
        
        await qstash.publishJSON({
          url: webhookUrl,
          body: {
            messageId,
            payload: { to: recipientArray, from, subject, text, html, attachments },
          },
          retries: 3,
        });
      } catch (qErr) {
        console.warn("QStash publish warning:", qErr);
      }
    } else {
      // Async simulation for development & playground
      setTimeout(() => {
        const found = globalEmailLogs.find((m) => m.message_id === messageId);
        if (found && found.status === "queued") {
          found.status = "sent";
          found.updated_at = new Date().toISOString();
        }
      }, 2500);
    }

    // 4. Return 202 Accepted immediately
    return NextResponse.json(
      {
        status: "accepted",
        messageId,
        message: "Email queued successfully for delivery via QStash & SMTP.",
      },
      { status: 202 }
    );
  } catch (err: any) {
    console.error("Ingestion API error:", err);
    return NextResponse.json(
      { error: "Internal server error during email ingestion", details: err.message },
      { status: 500 }
    );
  }
}
