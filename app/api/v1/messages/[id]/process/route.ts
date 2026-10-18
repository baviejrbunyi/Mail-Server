import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { globalEmailLogs } from "@/lib/email-store";
import { deliverEmail } from "@/lib/email-sender";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  const { id } = await params;

  // 1. Fetch message details
  let messageRecord: any = null;

  try {
    const { data } = await supabaseAdmin
      .from("email_logs")
      .select("*")
      .eq("message_id", id)
      .single();
    if (data) messageRecord = data;
  } catch {}

  if (!messageRecord) {
    messageRecord = globalEmailLogs.find((m) => m.message_id === id);
  }

  if (!messageRecord) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // 2. Deliver email via shared engine
  const result = await deliverEmail(id, {
    to: messageRecord.recipient,
    from: messageRecord.sender,
    subject: messageRecord.subject,
    text: messageRecord.text_body || messageRecord.text,
    html: messageRecord.html_body || messageRecord.html,
  });

  return NextResponse.json({
    messageId: id,
    status: result.success ? "sent" : "failed",
    error: result.error,
  });
}
