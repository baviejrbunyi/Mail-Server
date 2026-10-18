import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Client } from "@upstash/qstash";
import crypto from "crypto";

const qstash = new Client({ token: process.env.QSTASH_TOKEN || "placeholder_token" });

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

    // 2. Save record to Supabase with status queued
    const { error: dbError } = await supabaseAdmin.from("email_logs").insert({
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

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to record email in database", details: dbError.message },
        { status: 500 }
      );
    }

    // 3. Publish job to Upstash QStash
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-vercel-app.vercel.app"}/api/internal/process-email`;
    
    await qstash.publishJSON({
      url: webhookUrl,
      body: {
        messageId,
        payload: { to: recipientArray, from, subject, text, html, attachments },
      },
      retries: 3,
    });

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
