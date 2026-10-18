import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { globalEmailLogs, StoredEmailLog } from "@/lib/email-store";
import { deliverEmail, CustomSmtpConfig } from "@/lib/email-sender";
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
  smtp?: CustomSmtpConfig;
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

  // 6. Optional custom SMTP config
  let customSmtp: CustomSmtpConfig | undefined = undefined;
  if (body.smtp && typeof body.smtp === "object") {
    customSmtp = {
      host: body.smtp.host ? String(body.smtp.host).trim() : undefined,
      port: body.smtp.port ? Number(body.smtp.port) : undefined,
      secure: typeof body.smtp.secure === "boolean" ? body.smtp.secure : undefined,
      user: body.smtp.user ? String(body.smtp.user).trim() : undefined,
      pass: body.smtp.pass ? String(body.smtp.pass).trim() : undefined,
    };
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
      smtp: customSmtp,
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

  // Immediate in-memory mirror for local UI responsiveness
  globalEmailLogs.unshift(emailRecord);

  // 3. Save to Supabase (email_logs table)
  if (isSupabaseConfigured()) {
    try {
      // Determine if auth.userId is a standard UUID or string
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const safeUserId = auth.userId && UUID_REGEX.test(auth.userId) ? auth.userId : null;

      const recordToInsert: any = {
        message_id: messageId,
        client_id: auth.clientId || "default",
        recipient: emailRecord.recipient,
        sender: emailRecord.sender,
        subject: emailRecord.subject,
        status: "queued",
        retry_count: 0,
        created_at: now,
        updated_at: now,
      };

      // Only pass user_id if valid UUID (or if table user_id is TEXT)
      if (safeUserId) {
        recordToInsert.user_id = safeUserId;
      }

      // Try inserting with optional body columns
      recordToInsert.text_body = payload.text;
      recordToInsert.html_body = payload.html;

      const { error: dbError } = await supabaseAdmin.from("email_logs").insert(recordToInsert);

      if (dbError) {
        console.warn("[Supabase] Full insert warning:", dbError.message);
        // Fallback retry without text_body/html_body in case table has legacy schema
        const fallbackRecord = {
          message_id: messageId,
          recipient: emailRecord.recipient,
          sender: emailRecord.sender,
          subject: emailRecord.subject,
          status: "queued",
          retry_count: 0,
          created_at: now,
          updated_at: now,
        };
        await supabaseAdmin.from("email_logs").insert(fallbackRecord).then(({ error }) => {
          if (error) console.error("[Supabase Fallback Insert Error]:", error.message);
          else console.log("[Supabase] Fallback insert succeeded for message:", messageId);
        });
      } else {
        console.log(`[Supabase] Successfully saved email_log for message ${messageId}`);
      }
    } catch (dbErr: any) {
      console.error("[Supabase Exception]:", dbErr.message);
    }
  }

  // 4. Background Delivery Execution (Decoupled & Non-blocking)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const isLocalhost = !appUrl || appUrl.includes("localhost") || appUrl.includes("127.0.0.1") || appUrl.includes("placeholder");

  if (isQStashConfigured() && !isLocalhost) {
    // Production on Vercel with public HTTPS URL -> Publish to Upstash QStash
    try {
      const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
      const webhookUrl = `${appUrl}/api/internal/process-email`;
      
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
            smtp: payload.smtp,
          },
        },
        retries: 3,
      });
      console.log(`[QStash] Published email job ${messageId} to ${webhookUrl}`);
    } catch (qErr: any) {
      console.warn("[QStash] Publish failed, falling back to direct delivery:", qErr.message);
      deliverEmail(messageId, payload).catch((err) => console.error("[Direct Delivery Error]:", err));
    }
  } else {
    // Local development or localhost:
    // QStash cannot reach localhost:3000 from the cloud, so execute delivery asynchronously
    // 1 second later to deliver via Nodemailer and transition status to 'sent'!
    console.log(`[Local Mode] Triggering asynchronous delivery for ${messageId}`);
    setTimeout(() => {
      deliverEmail(messageId, payload).catch((err) => {
        console.error("[Local Delivery Error]:", err);
      });
    }, 1000);
  }

  // 5. Non-blocking 202 Accepted response
  return NextResponse.json(
    {
      status: "accepted",
      messageId,
      message: "Email accepted and queued for delivery.",
      recipients: emailRecord.recipient,
      queuedAt: now,
    },
    { status: 202 }
  );
}
