import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(req);
  if (!auth.isAuthenticated) {
    return auth.errorResponse!;
  }

  const { id } = await params;

  try {
    const { data, error } = await supabaseAdmin
      .from("email_logs")
      .select("*")
      .eq("message_id", id)
      .eq("user_id", auth.userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
  }
}
