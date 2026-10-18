import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { globalEmailLogs } from "@/lib/email-store";

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder"));
};

export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  // 1. Try Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, count, error } = await supabaseAdmin
        .from("email_logs")
        .select("*", { count: "exact" })
        .eq("user_id", auth.userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          items: data,
          count: count || data.length,
          limit,
          offset,
        });
      }
    } catch (dbErr) {
      console.warn("Supabase audit log query failed, using local store:", dbErr);
    }
  }

  // 2. Fallback to in-memory store
  const items = globalEmailLogs.slice(offset, offset + limit);
  return NextResponse.json({
    items,
    count: globalEmailLogs.length,
    limit,
    offset,
  });
}
