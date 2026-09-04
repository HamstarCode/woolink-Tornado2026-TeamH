"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./onboarding.css";

const PUBLIC_USER_ID_RETRY_LIMIT = 5;

const generatePublicUserId = () =>
  crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();

export default function OnboardingPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // ログイン状態・プロフィール確認
  // =========================
  useEffect(() => {
    const checkProfile = async () => {
      // ログイン中のユーザーを取得
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/");
        return;
      }

      // プロフィールを確認
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, personality_type")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "プロフィール確認エラー:",
          profileError.message
        );

        setError("プロフィールの確認に失敗しました。");
        setCheckingProfile(false);
        return;
      }

      // =========================
      // プロフィールが存在する
      // =========================
      if (profile !== null) {
        // 性格診断済み
        if (profile.personality_type !== null) {
          router.replace("/home");
          return;
        }

        // プロフィールはあるが
        // 性格診断がまだ
        router.replace("/personality");
        return;
      }

      // =========================
      // プロフィールが存在しない
      // =========================
      setCheckingProfile(false);
    };

    checkProfile();
  }, [router]);

  // =========================
  // ニックネーム保存
  // =========================
  const handleNext = async () => {
    if (nickname.trim() === "" || isSaving) return;

    setIsSaving(true);
    setError("");

    // ログイン中のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("ログイン情報を取得できませんでした。");
      setIsSaving(false);
      return;
    }

    // =========================
    // プロフィール作成
    // =========================
    let insertError: { code?: string; message: string } | null = null;

    for (let attempt = 0; attempt < PUBLIC_USER_ID_RETRY_LIMIT; attempt += 1) {
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        nickname: nickname.trim(),
        public_user_id: generatePublicUserId(),
      });

      insertError = error;

      if (!error) break;

      // public_user_id の重複だけは、新しいIDを生成して再試行する。
      if (error.code !== "23505") break;
    }

    if (insertError) {
      console.error(
        "プロフィール保存エラー:",
        insertError.message
      );

      setError("プロフィールの保存に失敗しました。");
      setIsSaving(false);
      return;
    }

    // ニックネーム登録後は性格診断へ
    router.replace("/personality");
  };

  // =========================
  // プロフィール確認中
  // =========================
  if (checkingProfile) {
    return (
      <main className="woolink-loading-screen" aria-busy="true">
        <p className="woolink-loading-text">ロード中...</p>
      </main>
    );
  }

  // =========================
  // 画面
  // =========================
  return (
    <main className="onboarding-page">
      <div className="onboarding-phone">
        <section className="onboarding-panel">
          <h1>まずはプロフィールを作りましょう</h1>
          <label htmlFor="nickname">
            ニックネーム
          </label>

          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError("");
            }}
            placeholder="ニックネームを入力"
            disabled={isSaving}
          />

          {error && (
            <p className="onboarding-error">{error}</p>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={
              nickname.trim() === "" || isSaving
            }
          >
            {isSaving ? "保存中..." : "性格診断へすすむ"}
          </button>
        </section>
      </div>
    </main>
  );
}
