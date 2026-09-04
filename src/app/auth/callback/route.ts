import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect back from a Supabase magic-link email.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // 初回か既存ユーザーかは onboarding 側でプロフィールを見て判定する。
  // 直接 /home へ送ると、新規Googleユーザーがニックネーム・診断を飛ばしてしまう。
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
