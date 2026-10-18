import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { globalEmailLogs } from "@/lib/email-store";

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder"));
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  const { id } = await params;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("email_logs")
        .select("*")
        .eq("message_id", id)
        .single();

      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch (err) {
      console.warn("Supabase single message query failed:", err);
    }
  }

  const localItem = globalEmailLogs.find((m) => m.message_id === id);
  if (localItem) {
    return NextResponse.json(localItem);
  }

  return NextResponse.json({ error: "Message not found" }, { status: 404 });
}
