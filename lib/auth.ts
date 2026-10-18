import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase";

export interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  clientId?: string;
  errorResponse?: NextResponse;
}

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

  try {
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("user_id, status")
      .eq("api_key", apiKey)
      .single();

    if (error || !data || data.status !== "ACTIVE") {
      return {
        isAuthenticated: false,
        errorResponse: NextResponse.json(
          { error: "Invalid or revoked API key" },
          { status: 403 }
        ),
      };
    }

    return {
      isAuthenticated: true,
      userId: data.user_id,
      clientId: apiKey.slice(0, 12),
    };
  } catch (err: any) {
    console.error("Auth validation error:", err);
    return {
      isAuthenticated: false,
      errorResponse: NextResponse.json(
        { error: "Internal server error during authentication" },
        { status: 500 }
      ),
    };
  }
}

export async function checkDemoUserLimit(): Promise<{ allowed: boolean; count: number }> {
  try {
    const { count, error } = await supabaseAdmin
      .from("auth.users")
      .select("*", { count: "exact", head: true });

    // Fallback if schema count fails or auth table is restricted
    const userCount = count || 0;
    if (userCount >= 3) {
      return { allowed: false, count: userCount };
    }
    return { allowed: true, count: userCount };
  } catch {
    return { allowed: true, count: 0 };
  }
}
