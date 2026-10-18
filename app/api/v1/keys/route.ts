import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: "Missing userId or key name" }, { status: 400 });
    }

    // Check user key count (max 5 keys per user)
    const { count } = await supabaseAdmin
      .from("api_keys")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((count || 0) >= 5) {
      return NextResponse.json({ error: "API key limit reached (maximum 5 keys per account)" }, { status: 400 });
    }

    const rawKey = "ak_live_" + crypto.randomBytes(24).toString("hex");
    const keyPrefix = rawKey.slice(0, 12) + "...";

    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        user_id: userId,
        api_key: rawKey,
        key_prefix: keyPrefix,
        name: name,
        status: "ACTIVE",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create API key", details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      apiKey: rawKey, // Shown once
      name: data.name,
      createdAt: data.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId query parameter" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, key_prefix, name, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch API keys", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ keys: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
  }
}
