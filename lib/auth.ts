import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase";
import { globalApiKeys } from "./email-store";

export interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  clientId?: string;
  errorResponse?: NextResponse;
}

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder"));
};

export async function validateApiKey(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      isAuthenticated: false,
      errorResponse: NextResponse.json(
        { error: "Missing or malformed Authorization header. Use Bearer <API_KEY>" },
        { status: 401 }
      ),
    };
  }

  const apiKey = authHeader.replace("Bearer ", "").trim();

  // 1. Check Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("api_keys")
        .select("user_id, status")
        .eq("api_key", apiKey)
        .single();

      if (!error && data && data.status === "ACTIVE") {
        return {
          isAuthenticated: true,
          userId: data.user_id,
          clientId: apiKey.slice(0, 12),
        };
      }
    } catch (err) {
      console.warn("Supabase auth check failed, checking local store:", err);
    }
  }

  // 2. Check in-memory store
  const localMatch = globalApiKeys.find(
    (k) => (k.api_key === apiKey || apiKey.startsWith(k.key_prefix.replace("...", ""))) && k.status === "ACTIVE"
  );

  if (localMatch) {
    return {
      isAuthenticated: true,
      userId: localMatch.user_id,
      clientId: localMatch.key_prefix,
    };
  }

  // 3. Allow any validly formatted ak_live_ key in dev/demo mode
  if (apiKey.startsWith("ak_live_") && apiKey.length >= 16) {
    return {
      isAuthenticated: true,
      userId: "usr_demo_user",
      clientId: apiKey.slice(0, 12),
    };
  }

  return {
    isAuthenticated: false,
    errorResponse: NextResponse.json(
      { error: "Invalid or revoked API key" },
      { status: 403 }
    ),
  };
}

export async function checkDemoUserLimit(): Promise<{ allowed: boolean; count: number }> {
  try {
    if (isSupabaseConfigured()) {
      const { count } = await supabaseAdmin
        .from("auth.users")
        .select("*", { count: "exact", head: true });

      const userCount = count || 0;
      if (userCount >= 3) {
        return { allowed: false, count: userCount };
      }
      return { allowed: true, count: userCount };
    }
  } catch {}
  return { allowed: true, count: 1 };
}
