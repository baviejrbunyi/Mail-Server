import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { supabaseAdmin } from "@/lib/supabase";
import nodemailer from "nodemailer";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "placeholder_current",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "placeholder_next",
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailgun.org",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
});

export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature");
  const bodyText = await req.text();

  // Verify QStash signature for security in production
  if (signature && process.env.QSTASH_CURRENT_SIGNING_KEY) {
    try {
      const isValid = await receiver.verify({
        signature,
        body: bodyText,
      });
      if (!isValid) {
        return NextResponse.json({ error: "Invalid QStash signature" }, { status: 401 });
      }
    } catch (err: any) {
      console.error("Signature verification error:", err);
      return NextResponse.json({ error: "Signature verification failed", details: err.message }, { status: 401 });
    }
  }

  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messageId, payload } = data;
  if (!messageId || !payload) {
    return NextResponse.json({ error: "Missing messageId or payload" }, { status: 400 });
  }

  try {
    // Attempt SMTP transmission via Nodemailer
    await transporter.sendMail({
      from: payload.from || process.env.SMTP_FROM_DEFAULT,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      attachments: payload.attachments,
    });

    // Update Supabase status to sent
    await supabaseAdmin
      .from("email_logs")
      .update({
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("message_id", messageId);

    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    console.error(`SMTP delivery failed for message ${messageId}:`, error);

    // Update Supabase status to failed on final failure (or let QStash retry)
    await supabaseAdmin
      .from("email_logs")
      .update({
        status: "failed",
        error_msg: error.message || "Unknown SMTP error",
        updated_at: new Date().toISOString(),
      })
      .eq("message_id", messageId);

    // Return 500 so QStash triggers its built-in retry mechanism
    return NextResponse.json({ error: "SMTP delivery failed", details: error.message }, { status: 500 });
  }
}
