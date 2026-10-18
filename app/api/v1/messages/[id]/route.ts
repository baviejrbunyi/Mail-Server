import { NextRequest, NextResponse } from "next/server";
import { globalEmailLogs } from "@/lib/email-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Use Bearer <API_KEY>" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const message = globalEmailLogs.find((m) => m.MessageId === id);

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json(message);
}
