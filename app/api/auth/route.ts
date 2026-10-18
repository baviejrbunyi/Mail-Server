import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { globalRegisteredUsers } from "@/lib/email-store";

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder"));
};

// Accurately count all distinct user accounts
async function getAccountCount(): Promise<number> {
  const accountIds = new Set<string>();

  if (isSupabaseConfigured()) {
    // 1. Check Supabase Auth users
    try {
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
      if (usersList?.users) {
        for (const u of usersList.users) {
          if (u.id) accountIds.add(u.id);
        }
      }
    } catch (err) {
      console.warn("Could not list Supabase auth users:", err);
    }

    // 2. Check distinct user_id in api_keys table (excluding system demo placeholder)
    try {
      const { data: keysData } = await supabaseAdmin
        .from("api_keys")
        .select("user_id");
      if (keysData) {
        for (const k of keysData) {
          if (
            k.user_id &&
            k.user_id !== "00000000-0000-0000-0000-000000000001" &&
            k.user_id !== "usr_demo_default"
          ) {
            accountIds.add(k.user_id);
          }
        }
      }
    } catch (err) {
      console.warn("Could not query api_keys users:", err);
    }
  }

  // 3. Include any accounts created in session/memory
  for (const uid of globalRegisteredUsers) {
    if (uid && uid !== "00000000-0000-0000-0000-000000000001" && uid !== "usr_demo_default") {
      accountIds.add(uid);
    }
  }

  return accountIds.size;
}

export async function GET() {
  const userCount = await getAccountCount();
  const remaining = Math.max(0, 3 - userCount);

  return NextResponse.json({
    totalUsers: userCount,
    remainingAccounts: remaining,
    maxLimit: 3,
    isLimitReached: remaining === 0,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. If Supabase is not configured, provide clean demo fallback with 3-account limit
    if (!isSupabaseConfigured()) {
      const currentCount = await getAccountCount();
      if (action === "register" && currentCount >= 3) {
        return NextResponse.json(
          { error: "Registration closed: Maximum 3 accounts allowed in this project." },
          { status: 400 }
        );
      }

      const demoId = "usr_" + cleanEmail.split("@")[0].replace(/[^a-z0-9]/g, "") + "_12345";
      if (action === "register") {
        globalRegisteredUsers.add(demoId);
      }

      return NextResponse.json({
        success: true,
        user: { id: demoId, email: cleanEmail },
        message: "Logged in via local demo mode.",
      });
    }

    // 2. Handle Registration (Sign Up)
    if (action === "register") {
      // Check account limit (strictly 3 accounts maximum)
      const currentCount = await getAccountCount();
      if (currentCount >= 3) {
        return NextResponse.json(
          { error: "Registration closed: Maximum 3 accounts allowed in this project." },
          { status: 400 }
        );
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
