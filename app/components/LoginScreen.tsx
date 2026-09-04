"use client";

import Image from "next/image";
import { supabase } from "@/lib/supabase";

// 説明カルーセルとは独立した、ログインだけを担当する画面。
// 2回目以降のアクセスで説明をスキップする場合も、このコンポーネントを
// そのまま単独で表示すればよい。
export default function LoginScreen() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      console.error("Googleログインエラー:", error.message);
    }
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

      <button
        type="button"
        className="welcome-next-btn"
        onClick={handleGoogleLogin}
      >
        Googleでログイン
      </button>
    </div>
  );
}
