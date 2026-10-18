import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { globalEmailLogs, StoredEmailLog } from "@/lib/email-store";
import { Client } from "@upstash/qstash";
import crypto from "crypto";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder"));
};

const isQStashConfigured = () => {
  const token = process.env.QSTASH_TOKEN;
  return Boolean(token && !token.includes("your-") && !token.includes("placeholder"));
};

interface SendEmailPayload {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename: string; content?: string; path?: string }>;
}

function validateEmailPayload(body: any): { isValid: boolean; error?: string; data?: SendEmailPayload } {
  if (!body || typeof body !== "object") {
    return { isValid: false, error: "Request body must be a valid JSON object." };
  }

  // 1. Validate 'to'
  if (!body.to) {
    return { isValid: false, error: "Missing required field: 'to' recipient." };
  }

  let recipients: string[] = [];
  if (typeof body.to === "string") {
    recipients = [body.to.trim()];
  } else if (Array.isArray(body.to)) {
    if (body.to.length === 0) {
      return { isValid: false, error: "'to' array must contain at least one recipient." };
    }
    if (body.to.length > 50) {
      return { isValid: false, error: "Maximum 50 recipients allowed per request." };
    }
    recipients = body.to.map((r: any) => String(r).trim());
  } else {
    return { isValid: false, error: "'to' must be an email string or array of email strings." };
  }

  for (const recipient of recipients) {
    if (!EMAIL_REGEX.test(recipient)) {
      return { isValid: false, error: `Invalid recipient email format: "${recipient}"` };
    }
  }

  // 2. Validate 'from'
  if (!body.from || typeof body.from !== "string") {
    return { isValid: false, error: "Missing required field: 'from' sender email address." };
  }
  const sender = body.from.trim();
  if (!EMAIL_REGEX.test(sender)) {
    return { isValid: false, error: `Invalid sender email format: "${sender}"` };
  }

  // 3. Validate 'subject'
  if (!body.subject || typeof body.subject !== "string" || body.subject.trim().length === 0) {
    return { isValid: false, error: "Missing required field: 'subject' must be a non-empty string." };
  }
  if (body.subject.length > 1000) {
    return { isValid: false, error: "'subject' cannot exceed 1000 characters." };
  }

  // 4. Validate body (text or html)
  const hasText = typeof body.text === "string" && body.text.trim().length > 0;
  const hasHtml = typeof body.html === "string" && body.html.trim().length > 0;

  if (!hasText && !hasHtml) {
    return { isValid: false, error: "Email must include either 'text' or 'html' body content." };
  }

  // 5. Validate attachments if provided
  if (body.attachments) {
    if (!Array.isArray(body.attachments)) {
      return { isValid: false, error: "'attachments' must be an array of attachment objects." };
    }
    for (let i = 0; i < body.attachments.length; i++) {
      const att = body.attachments[i];
      if (!att || typeof att !== "object" || !att.filename) {
        return { isValid: false, error: `Attachment at index ${i} is missing required 'filename'.` };
      }
    }
  }

  return {
    isValid: true,
    data: {
      to: recipients,
      from: sender,
      subject: body.subject.trim(),
      text: hasText ? body.text : undefined,
      html: hasHtml ? body.html : undefined,
      attachments: body.attachments,
    },
  };
}

export async function POST(req: NextRequest) {
  // 1. Authenticate Request via Bearer API Key
  const auth = await validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload in request body." }, { status: 400 });
  }

  // 2. Strict Payload Validation
  const validation = validateEmailPayload(body);
  if (!validation.isValid || !validation.data) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const payload = validation.data;
  const messageId = "msg_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const now = new Date().toISOString();

  const emailRecord: StoredEmailLog = {
    message_id: messageId,
    user_id: auth.userId,
    client_id: auth.clientId,
    recipient: Array.isArray(payload.to) ? payload.to : [payload.to],
    sender: payload.from,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    status: "queued",
    retry_count: 0,
    created_at: now,
    updated_at: now,
  };

  // Immediate in-memory mirror for real-time UI responsiveness
  globalEmailLogs.unshift(emailRecord);

  // 3. Save to Supabase (email_logs table) if configured
  if (isSupabaseConfigured()) {
    try {
      const { error: dbError } = await supabaseAdmin.from("email_logs").insert({
        message_id: messageId,
        user_id: auth.userId,
        client_id: auth.clientId,
        recipient: emailRecord.recipient,
        sender: emailRecord.sender,
        subject: emailRecord.subject,
        text_body: payload.text,
        html_body: payload.html,
        status: "queued",
        retry_count: 0,
        created_at: now,
        updated_at: now,
      });

      if (dbError) {
        console.warn("Supabase record warning:", dbError.message);
      }
    } catch (dbErr: any) {
      console.warn("Supabase insert exception:", dbErr.message);
    }
  }

  // 4. Publish Job to Upstash QStash (or trigger async simulator if local)
  if (isQStashConfigured()) {
    try {
      const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-vercel-app.vercel.app"}/api/internal/process-email`;
      
      await qstash.publishJSON({
        url: webhookUrl,
        body: {
          messageId,
          payload: {
            to: emailRecord.recipient,
            from: payload.from,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
            attachments: payload.attachments,
          },
        },
        retries: 3,
      });
    } catch (qErr: any) {
      console.warn("QStash publishing warning:", qErr.message);
    }
  } else {
    // Local / development background worker simulation
    setTimeout(() => {
      const found = globalEmailLogs.find((m) => m.message_id === messageId);
      if (found && found.status === "queued") {
        found.status = "sent";
        found.updated_at = new Date().toISOString();
      }
    }, 2500);
  }

  // 5. Non-blocking 202 Accepted response with unique message ID
  return NextResponse.json(
    {
      status: "accepted",
      messageId,
      message: "Email queued successfully for delivery.",
      recipients: emailRecord.recipient,
      queuedAt: now,
    },
    { status: 202 }
  );
}
