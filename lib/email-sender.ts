import nodemailer from "nodemailer";
import { supabaseAdmin } from "./supabase";
import { globalEmailLogs } from "./email-store";

export interface CustomSmtpConfig {
  host?: string;
  port?: number | string;
  secure?: boolean;
  user?: string;
  pass?: string;
}

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
    smtp?: CustomSmtpConfig;
  }
): Promise<DeliverEmailResult> {
  const customSmtp = payload.smtp;
  const smtpHost = customSmtp?.host || process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = customSmtp?.port ? Number(customSmtp.port) : (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465);
  const smtpUser = customSmtp?.user || process.env.SMTP_USER;
  const smtpPass = customSmtp?.pass || process.env.SMTP_PASSWORD;
  const smtpSecure = customSmtp?.secure !== undefined ? customSmtp.secure : (smtpPort === 465);

  const isSmtpConfigured = Boolean(
    smtpUser &&
    !smtpUser.includes("yourdomain") &&
    smtpPass &&
    !smtpPass.includes("your-")
  );

  const recipientArray = Array.isArray(payload.to) ? payload.to : [payload.to];
  const now = new Date().toISOString();

  try {
    if (isSmtpConfigured) {
      // 1. Configure real Nodemailer transporter with resolved SMTP credentials
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // 2. Transmit email via SMTP
      // If using Gmail SMTP and payload.from is dummy or differing, ensure from matches authenticated user to satisfy Gmail anti-spoofing policy
      const isGmail = smtpHost.includes("gmail.com") || (smtpUser && smtpUser.includes("@gmail.com"));
      let senderAddress = payload.from || smtpUser;
      let replyToAddress: string | undefined = undefined;

      if (isGmail && smtpUser) {
        if (!payload.from || payload.from.includes("yourdomain.com")) {
          senderAddress = smtpUser;
        } else if (!payload.from.includes(smtpUser)) {
          // Gmail allows display name with authenticated address, e.g. "My App <user@gmail.com>"
          replyToAddress = payload.from;
        }
      }

      await transporter.sendMail({
        from: senderAddress,
        to: recipientArray,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        attachments: payload.attachments,
        replyTo: replyToAddress,
      });

      console.log(`[SMTP] Successfully sent email ${messageId} to ${recipientArray.join(", ")} via ${smtpHost}`);
    } else {
      console.log(`[SIMULATED SMTP] Delivered email ${messageId} to ${recipientArray.join(", ")} (SMTP credentials not yet configured)`);
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
