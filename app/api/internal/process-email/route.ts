import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { deliverEmail } from "@/lib/email-sender";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "placeholder_current",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "placeholder_next",
});

export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature");
  const bodyText = await req.text();

  // Verify QStash signature for security in production if keys are present
  if (
    signature &&
    process.env.QSTASH_CURRENT_SIGNING_KEY &&
    !process.env.QSTASH_CURRENT_SIGNING_KEY.includes("placeholder")
  ) {
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

  // Execute SMTP transmission and status update via shared deliverEmail engine
  const result = await deliverEmail(messageId, payload);

  if (result.success) {
    return NextResponse.json({ success: true, messageId });
  } else {
    // Return 500 to trigger QStash automatic retry
    return NextResponse.json({ error: "SMTP delivery failed", details: result.error }, { status: 500 });
  }
}
