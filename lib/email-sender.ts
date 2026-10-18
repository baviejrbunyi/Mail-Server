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
  if (!customSmtp || !customSmtp.user || !customSmtp.pass) {
    const errorMsg = "Missing required SMTP credentials. Every dispatch must include 'smtp.user' and 'smtp.pass' (e.g. Gmail address and 16-character App Password, or custom relay credentials).";
    console.error(`[SMTP ERROR] Message ${messageId} aborted:`, errorMsg);
    return { success: false, messageId, error: errorMsg };
  }

  const smtpUser = customSmtp.user.trim();
  const smtpPass = customSmtp.pass.trim();
  const isGmailUser = smtpUser.endsWith("@gmail.com") || smtpUser.endsWith("@googlemail.com");
  const smtpHost = customSmtp.host ? customSmtp.host.trim() : (isGmailUser ? "smtp.gmail.com" : "");

  if (!smtpHost) {
    const errorMsg = "Missing required 'smtp.host' (e.g. 'smtp.gmail.com' or 'email-smtp.us-east-1.amazonaws.com').";
    console.error(`[SMTP ERROR] Message ${messageId} aborted:`, errorMsg);
    return { success: false, messageId, error: errorMsg };
  }

  const smtpPort = customSmtp.port ? Number(customSmtp.port) : 465;
  const smtpSecure = customSmtp.secure !== undefined ? customSmtp.secure : (smtpPort === 465);

  const recipientArray = Array.isArray(payload.to) ? payload.to : [payload.to];
  const now = new Date().toISOString();

  try {
    // 1. Configure Nodemailer transporter with caller's SMTP credentials
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
    const isGmail = smtpHost.includes("gmail.com") || smtpUser.includes("@gmail.com");
    let senderAddress = payload.from || smtpUser;
    let replyToAddress: string | undefined = undefined;

    if (isGmail) {
      if (!payload.from || payload.from.includes("yourdomain.com")) {
        senderAddress = smtpUser;
      } else if (!payload.from.includes(smtpUser)) {
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
