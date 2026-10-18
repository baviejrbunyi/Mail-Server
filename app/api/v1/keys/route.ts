import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { globalApiKeys, StoredApiKey } from "@/lib/email-store";
import crypto from "crypto";

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder"));
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name } = body;

    if (!userId || !name || userId === "null" || userId === "undefined") {
      return NextResponse.json({ error: "Missing userId or key name" }, { status: 400 });
    }

    const rawKey = "ak_live_" + crypto.randomBytes(24).toString("hex");
    const keyPrefix = rawKey.slice(0, 12) + "...";
    const now = new Date().toISOString();

    // 1. If Supabase is configured, attempt database storage
    if (isSupabaseConfigured()) {
      try {
        const { count } = await supabaseAdmin
          .from("api_keys")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if ((count || 0) >= 5) {
          return NextResponse.json({ error: "API key limit reached (maximum 5 keys per account)" }, { status: 400 });
        }

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

        if (!error && data) {
          // Also mirror in local store for seamless access
          globalApiKeys.unshift({
            id: data.id || "key_" + crypto.randomUUID().slice(0, 8),
            user_id: userId,
            api_key: rawKey,
            key_prefix: keyPrefix,
            name: name,
            status: "ACTIVE",
            created_at: now,
          });

          return NextResponse.json({
            apiKey: rawKey,
            name: data.name,
            createdAt: data.created_at,
          });
        }
      } catch (dbErr) {
        console.warn("Supabase insert failed, falling back to local store:", dbErr);
      }
    }

    // 2. Fallback to in-memory store
    const userKeys = globalApiKeys.filter((k) => k.user_id === userId);
    if (userKeys.length >= 5) {
      return NextResponse.json({ error: "API key limit reached (maximum 5 keys per account)" }, { status: 400 });
    }

    const newKey: StoredApiKey = {
      id: "key_" + crypto.randomUUID().slice(0, 8),
      user_id: userId,
      api_key: rawKey,
      key_prefix: keyPrefix,
      name: name,
      status: "ACTIVE",
      created_at: now,
    };

    globalApiKeys.unshift(newKey);

    return NextResponse.json({
      apiKey: rawKey,
      name: newKey.name,
      createdAt: newKey.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId || userId === "null" || userId === "undefined" || userId.trim() === "") {
    return NextResponse.json({ error: "Missing userId query parameter" }, { status: 400 });
  }

  // 1. Try Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("api_keys")
        .select("id, key_prefix, name, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return NextResponse.json({ keys: data });
      }
    } catch (dbErr) {
      console.warn("Supabase fetch failed, falling back to local store:", dbErr);
    }
  }

  // 2. Fallback to in-memory store
  const keys = globalApiKeys
    .filter((k) => k.user_id === userId || k.user_id === "usr_demo_default")
    .map(({ id, key_prefix, name, status, created_at }) => ({
      id,
      key_prefix,
      name,
      status,
      created_at,
    }));

  return NextResponse.json({ keys });
}
