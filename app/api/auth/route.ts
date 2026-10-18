import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder"));
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. If Supabase is not configured, provide clean demo fallback
    if (!isSupabaseConfigured()) {
      const demoId = "usr_" + cleanEmail.split("@")[0].replace(/[^a-z0-9]/g, "") + "_12345";
      return NextResponse.json({
        success: true,
        user: { id: demoId, email: cleanEmail },
        message: "Logged in via local demo mode.",
      });
    }

    // 2. Handle Registration (Sign Up)
    if (action === "register") {
      // Check demo user count (max 3 users limit)
      try {
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        const existingUsers = usersList?.users || [];
        if (existingUsers.length >= 3) {
          return NextResponse.json(
            { error: "Registration closed: Maximum 3 demo accounts allowed in this project." },
            { status: 400 }
          );
        }
      } catch (err) {
        console.warn("Could not check user list limit:", err);
      }

      // Create user with email_confirm: true via Supabase Admin API
      // This bypasses the email verification link requirement completely!
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true, // Auto-confirm email immediately
      });

      if (createError) {
        // If user already exists, suggest logging in
        if (createError.message.includes("already registered") || createError.message.includes("unique")) {
          return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 400 });
        }
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        user: { id: createData.user.id, email: createData.user.email },
        message: "Account created and auto-confirmed successfully!",
      });
    }

    // 3. Handle Sign In (Login)
    if (action === "login") {
      // Try normal sign in with password
      const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (!signError && signData.user) {
        return NextResponse.json({
          success: true,
          user: { id: signData.user.id, email: signData.user.email },
        });
      }

      // If error is "Email not confirmed", auto-confirm the user via Admin API and retry!
      if (signError && signError.message.toLowerCase().includes("email not confirmed")) {
        console.log(`[Auto-Confirm] User ${cleanEmail} had unconfirmed email. Auto-confirming now...`);
        try {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const targetUser = listData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

          if (targetUser) {
            await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
              email_confirm: true,
            });

            // Retry sign in after auto-confirmation
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: password,
            });

            if (!retryError && retryData.user) {
              return NextResponse.json({
                success: true,
                user: { id: retryData.user.id, email: retryData.user.email },
                message: "Email auto-confirmed and signed in successfully!",
              });
            }
          }
        } catch (autoErr: any) {
          console.error("Auto-confirm error:", autoErr);
        }
      }

      return NextResponse.json({
        error: signError ? signError.message : "Invalid credentials.",
      }, { status: 401 });
    }

    return NextResponse.json({ error: "Invalid action. Use 'login' or 'register'." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: "Authentication server error", details: err.message }, { status: 500 });
  }
}
