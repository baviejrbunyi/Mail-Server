import nodemailer from "nodemailer";
import { supabaseAdmin } from "./supabase";
import { globalEmailLogs } from "./email-store";

export interface DeliverEmailResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export async function deliverEmail(
  messageId: string,
  payload: {
    to: string | string[];
    from: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{ filename: string; content?: string; path?: string }>;
  }
): Promise<DeliverEmailResult> {
  const isSmtpConfigured = Boolean(
    process.env.SMTP_USER &&
    !process.env.SMTP_USER.includes("yourdomain") &&
    process.env.SMTP_PASSWORD &&
    !process.env.SMTP_PASSWORD.includes("your-")
  );

  const recipientArray = Array.isArray(payload.to) ? payload.to : [payload.to];
  const now = new Date().toISOString();

  try {
    if (isSmtpConfigured) {
      // 1. Configure real Nodemailer transporter with user's SMTP credentials
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.mailgun.org",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      // 2. Transmit email via SMTP
      await transporter.sendMail({
        from: payload.from || process.env.SMTP_FROM_DEFAULT || process.env.SMTP_USER,
        to: recipientArray,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        attachments: payload.attachments,
      });

      console.log(`[SMTP] Successfully sent email ${messageId} to ${recipientArray.join(", ")}`);
    } else {
      console.log(`[SIMULATED SMTP] Delivered email ${messageId} to ${recipientArray.join(", ")} (SMTP credentials not yet configured in .env.local)`);
    }

    // 3. Update Supabase status to 'sent'
    try {
      const { error: sbErr } = await supabaseAdmin
        .from("email_logs")
        .update({
          status: "sent",
          updated_at: now,
        })
        .eq("message_id", messageId);

      if (sbErr) {
        console.warn("[Supabase] Failed to update status to sent:", sbErr.message);
      }
    } catch (e: any) {
      console.warn("[Supabase] Update exception:", e.message);
    }

    // 4. Update in-memory log mirror
    const localLog = globalEmailLogs.find((m) => m.message_id === messageId);
    if (localLog) {
      localLog.status = "sent";
      localLog.updated_at = now;
    }

    return { success: true, messageId };
  } catch (error: any) {
    const errorMsg = error.message || "Unknown SMTP relay error";
    console.error(`[SMTP ERROR] Message ${messageId} failed:`, errorMsg);

    // Update Supabase status to 'failed' with error message
    try {
      await supabaseAdmin
        .from("email_logs")
        .update({
          status: "failed",
          error_msg: errorMsg,
          updated_at: now,
        })
        .eq("message_id", messageId);
    } catch {}

    const localLog = globalEmailLogs.find((m) => m.message_id === messageId);
    if (localLog) {
      localLog.status = "failed";
      localLog.error_msg = errorMsg;
      localLog.updated_at = now;
    }

    return { success: false, messageId, error: errorMsg };
  }
}
