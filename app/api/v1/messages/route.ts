import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    const { data, count, error } = await supabaseAdmin
      .from("email_logs")
      .select("*", { count: "exact" })
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch audit logs", details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: data || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
  }
}
