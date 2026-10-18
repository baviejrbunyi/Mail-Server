import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
    !supabaseUrl.includes("placeholder") &&
    anonKey &&
    !anonKey.includes("placeholder")
  );

  if (!isConfigured) {
    return NextResponse.json({
      status: "unconfigured",
      connected: false,
      message: "Supabase environment variables are missing or default placeholders in .env.local",
      supabaseUrl: supabaseUrl ? supabaseUrl.replace(/https?:\/\//, "").slice(0, 15) + "..." : "Not set",
      tables: {
        api_keys: false,
        email_logs: false,
      },
    });
  }

  try {
    // Check api_keys table
    const { count: keysCount, error: keysError } = await supabaseAdmin
      .from("api_keys")
      .select("*", { count: "exact", head: true });

    // Check email_logs table
    const { count: logsCount, error: logsError } = await supabaseAdmin
      .from("email_logs")
      .select("*", { count: "exact", head: true });

    // Check auth users count (if accessible)
    let usersCount = 0;
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      usersCount = usersData?.users?.length || 0;
    } catch {}

    const tablesExist = !keysError && !logsError;

    return NextResponse.json({
      status: tablesExist ? "ready" : "tables_missing",
      connected: true,
      message: tablesExist
        ? "Supabase connected successfully and tables are ready!"
        : "Supabase connected, but tables (api_keys / email_logs) were not found. Run supabase/schema.sql in your Supabase SQL editor.",
      tables: {
        api_keys: !keysError,
        email_logs: !logsError,
      },
      counts: {
        api_keys: keysCount ?? 0,
        email_logs: logsCount ?? 0,
        users: usersCount,
      },
      errors: {
        api_keys: keysError ? keysError.message : null,
        email_logs: logsError ? logsError.message : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      connected: false,
      message: "Connection to Supabase failed: " + err.message,
    });
  }
}
