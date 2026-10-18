import { NextRequest, NextResponse } from "next/server";
import { globalEmailLogs } from "@/lib/email-store";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Use Bearer <API_KEY>" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.replace("Bearer ", "").trim();
  const clientId = apiKey.startsWith("ak_") ? "client_" + apiKey.slice(3, 10) : "client_default";

  const items = globalEmailLogs;

  return NextResponse.json({
    items,
    count: items.length,
    clientId,
  });
}
