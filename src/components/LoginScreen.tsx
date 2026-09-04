"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// 説明カルーセルとは独立した、ログインだけを担当する画面。
export default function LoginScreen() {
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError("Googleログインに失敗しました: " + error.message);
  };

  return (
    <div className="login-screen">
      <Image
        className="login-logo"
        src="/woolink-logo.svg"
        alt="Woolink"
        width={300}
        height={100}
        priority
      />

      <p className="login-tagline">ようこそ Woolinkへ！</p>

      <button type="button" className="welcome-next-btn" onClick={handleGoogleLogin}>
        Googleでログイン
      </button>

      {error && <p style={{ fontSize: 12, color: "#ffb4b4", margin: 0 }}>{error}</p>}
    </div>
  );
}
