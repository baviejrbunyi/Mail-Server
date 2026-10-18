import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { globalApiKeys, globalEmailLogs } from "@/lib/email-store";

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return NextResponse.json({
      success: false,
      message: "Supabase URL is not configured in .env.local. Seeded in-memory store instead.",
      inMemoryOnly: true,
    });
  }

  try {
    // 1. Seed demo API key
    const demoKey = {
      id: "00000000-0000-0000-0000-000000000001",
      user_id: "00000000-0000-0000-0000-000000000001",
      api_key: "ak_live_demo123456789abcdef0123456789abcdef",
      key_prefix: "ak_live_demo...",
      name: "Starter Demo API Key",
      status: "ACTIVE",
    };

    const { error: keyErr } = await supabaseAdmin
      .from("api_keys")
      .upsert(demoKey, { onConflict: "api_key" });

    // 2. Seed initial email logs
    const initialLogs = [
      {
        message_id: "msg_seed_sample_01",
        user_id: "00000000-0000-0000-0000-000000000001",
        client_id: "ak_live_demo...",
        recipient: ["user@example.com"],
        sender: "noreply@yourdomain.com",
        subject: "Welcome to Serverless Email API",
        status: "sent",
        retry_count: 0,
      },
      {
        message_id: "msg_seed_sample_02",
        user_id: "00000000-0000-0000-0000-000000000001",
        client_id: "ak_live_demo...",
        recipient: ["alerts@example.com"],
        sender: "monitor@yourdomain.com",
        subject: "Daily System Delivery Health",
        status: "queued",
        retry_count: 0,
      },
    ];

    const { error: logErr } = await supabaseAdmin
      .from("email_logs")
      .upsert(initialLogs, { onConflict: "message_id" });

    if (keyErr || logErr) {
      return NextResponse.json({
        success: false,
        message: "Failed to seed Supabase tables. Ensure tables exist by running supabase/schema.sql in the Supabase SQL editor.",
        errors: { keyErr, logErr },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Supabase populated successfully with demo API key and sample email delivery logs!",
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: "Seeding error: " + err.message,
    }, { status: 500 });
  }
}
