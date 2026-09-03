"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

    // 公開IDを生成
    const publicUserId = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    // =========================
    // プロフィール作成
    // =========================
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        nickname: nickname.trim(),
        public_user_id: publicUserId,
      });

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
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-gray-500">
            確認中...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // 画面
  // =========================
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">
          Woolinkへようこそ
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          まずはプロフィールを作りましょう。
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <label
            htmlFor="nickname"
            className="text-sm font-medium text-gray-700"
          >
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
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-400"
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={
              nickname.trim() === "" || isSaving
            }
            className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isSaving ? "保存中..." : "次へ"}
          </button>
        </div>
      </div>
    </main>
  );
}