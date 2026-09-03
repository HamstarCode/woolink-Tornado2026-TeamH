"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TopPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  // =========================
  // ログイン状態を確認
  // =========================
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // ログイン済みならオンボーディングへ
        router.replace("/onboarding");
        return;
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  // =========================
  // Googleログイン
  // =========================
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

  // =========================
  // ログイン状態確認中
  // =========================
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          読み込み中...
        </p>
      </main>
    );
  }

  // =========================
  // 画面
  // =========================
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="mb-6 text-3xl font-bold">
          Woolink
        </h1>

        <button
          onClick={handleGoogleLogin}
          className="rounded-lg bg-gray-900 px-6 py-3 text-white"
        >
          Googleでログイン
        </button>
      </div>
    </main>
  );
}