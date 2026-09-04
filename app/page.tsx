"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import IntroCarousel from "./components/IntroCarousel";
import LoginScreen from "./components/LoginScreen";
import "./welcome.css";

type Phase = "checking" | "intro" | "login";

export default function TopPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("checking");

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

      // 2回目以降は "login" を直接選ぶだけでスキップ機能を追加できる
      // （例: localStorage の閲覧済みフラグを見て分岐する）
      setPhase("intro");
    };

    checkUser();
  }, [router]);

  // =========================
  // アプリ立ち上げ画面（ログイン状態確認中）
  // =========================
  if (phase === "checking") {
    return (
      <main className="welcome-page">
        <div className="welcome-phone">
          <div className="welcome-splash">
            <Image
              className="welcome-splash-logo"
              src="/woolink-logo.svg"
              alt="Woolink"
              width={380}
              height={126}
              priority
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="welcome-page">
      <div className="welcome-phone">
        {phase === "intro" ? (
          <IntroCarousel onFinish={() => setPhase("login")} />
        ) : (
          <LoginScreen />
        )}
      </div>
    </main>
  );
}
