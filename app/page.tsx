"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import "./welcome.css";

type IntroPage = {
  heading?: string;
  body: string[];
  emphasis?: string;
};

// 初回説明（4ページ）。実装済み機能（交換日記・性格診断による相性マッチ・両想い通話）と
// 内容がずれないよう、各ページの説明文はそれぞれの画面の実装に合わせている。
const INTRO_PAGES: IntroPage[] = [
  {
    body: [
      "夜、1人がさみしい",
      "誰かと話したい",
      "でも、誘ったら迷惑じゃないかな…",
    ],
    emphasis: "そんなあなたのためのアプリです",
  },
  {
    heading: "①返事に焦らない交換日記",
    body: [
      "日記を書いたら、返事を待ち眠る。",
      "ゆっくりやりとりができる交換日記で",
      "日常の共有ができます。",
    ],
  },
  {
    heading: "②安心できる友達との出会い",
    body: [
      "あなたの対人タイプを診断。",
      "結果をもとに相性の良いユーザーと",
      "交換日記が行えます。",
    ],
  },
  {
    heading: "③友達との両思い通話",
    body: [
      "話せる時間に話せる人と。",
      "「今、迷惑じゃないかな」",
      "を解決します。",
    ],
  },
];

export default function TopPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [introStep, setIntroStep] = useState(0);

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

      setCheckingAuth(false);
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
  // アプリ立ち上げ画面（ログイン状態確認中）
  // =========================
  if (checkingAuth) {
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

  // =========================
  // 初回説明（4ページ）＋ ログイン
  // =========================
  const page = INTRO_PAGES[introStep];
  const isLastPage = introStep === INTRO_PAGES.length - 1;

  return (
    <main className="welcome-page">
      <div className="welcome-phone">
        <div className="welcome-intro">
          <p className="welcome-copy">ようこそ Woolinkへ！</p>

          <div className="welcome-panel">
            <div className="welcome-panel-copy">
              {page.heading && (
                <p className="welcome-panel-heading">{page.heading}</p>
              )}

              <p>
                {page.body.map((line, i) => (
                  <Fragment key={i}>
                    {line}
                    {i < page.body.length - 1 && <br />}
                  </Fragment>
                ))}
              </p>

              {page.emphasis && (
                <p className="welcome-panel-emphasis">{page.emphasis}</p>
              )}
            </div>

            <Image
              className="welcome-app-icon"
              src="/app-icon.svg"
              alt=""
              width={380}
              height={130}
              aria-hidden="true"
            />

            <div
              className="welcome-page-indicators"
              role="group"
              aria-label="ページ選択"
            >
              {INTRO_PAGES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`welcome-page-indicator${
                    i === introStep ? " is-active" : ""
                  }`}
                  aria-label={`${i + 1}ページ目`}
                  aria-pressed={i === introStep}
                  onClick={() => setIntroStep(i)}
                />
              ))}
            </div>
          </div>

          {isLastPage ? (
            <button
              type="button"
              className="welcome-next-btn"
              onClick={handleGoogleLogin}
            >
              Googleでログイン
            </button>
          ) : (
            <button
              type="button"
              className="welcome-next-btn"
              onClick={() => setIntroStep((step) => step + 1)}
            >
              次へ
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
