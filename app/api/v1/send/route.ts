import { NextRequest, NextResponse } from "next/server";
import { globalEmailLogs } from "@/lib/email-store";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Use Bearer <API_KEY>" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.replace("Bearer ", "").trim();
  const clientId = apiKey.startsWith("ak_") ? "client_" + apiKey.slice(3, 10) : "client_default";

  try {
    const body = await req.json();
    const { to, from, subject, text, html } = body;

    if (!to || !from || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: "Missing required fields: to, from, subject, and text or html" },
        { status: 400 }
      );
    }

    const messageId = "msg_" + crypto.randomUUID().slice(0, 12);
    const now = new Date().toISOString();

    const newRecord = {
      MessageId: messageId,
      ClientId: clientId,
      To: to,
      From: from,
      Subject: subject,
      Status: "queued" as const,
      RetryCount: 0,
      CreatedAt: now,
      UpdatedAt: now,
    };

    globalEmailLogs.unshift(newRecord);

    // Simulate async SQS worker delivery after 2 seconds
    setTimeout(() => {
      const found = globalEmailLogs.find((m) => m.MessageId === messageId);
      if (found && found.Status === "queued") {
        found.Status = "sent";
        found.UpdatedAt = new Date().toISOString();
      }
    }, 2500);

    return NextResponse.json(
      {
        status: "accepted",
        messageId,
        message: "Email accepted and published to SQS queue for delivery.",
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
