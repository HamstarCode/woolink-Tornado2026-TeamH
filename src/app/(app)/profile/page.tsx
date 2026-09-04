"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "./profile.css";

const supabase = createClient();

type MyProfile = {
  id: string;
  nickname: string;
  public_user_id: string;
  personality_type: string | null;
};

const PERSONALITY_NAMES: Record<string, string> = {
  PA_fast: "船長タイプ", PA_slow: "大黒柱タイプ",
  BC_fast: "仕掛け人タイプ", BC_slow: "軍師タイプ",
  DE_fast: "実況者タイプ", DE_slow: "観察者タイプ",
  FG_fast: "旅人タイプ", FG_slow: "職人タイプ",
  HI_fast: "応援団タイプ", HI_slow: "聞き役タイプ",
  JK_fast: "太陽タイプ", JK_slow: "癒し系タイプ",
  LM_fast: "ムードメーカー", LM_slow: "包容力タイプ",
  NO_fast: "盛り上げ役タイプ", NO_slow: "社交家タイプ",
  balance: "バランス型",
};

export default function MyProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        if (active) {
          setMessage("ログイン情報を取得できませんでした。");
          setIsError(true);
          setIsLoading(false);
        }
        return;
      }

      const { data, error } = await supabase.rpc("get_my_profile");
      if (!active) return;

      const myProfile = (data?.[0] ?? null) as MyProfile | null;

      if (error || !myProfile) {
        if (error) console.error("プロフィール取得エラー:", error.message);
        setMessage("プロフィールを読み込めませんでした。");
        setIsError(true);
      } else {
        setProfile(myProfile);
      }
      setIsLoading(false);
    };

    void load();
    return () => { active = false; };
  }, []);

  if (isLoading) {
    return <main className="profile-page"><div className="profile-loading">ロード中...</div></main>;
  }

  return (
    <main className="profile-page">
      <div className="profile-phone">
        <h1>プロフィール</h1>
        {profile ? (
          <section className="profile-card">
            <div className="profile-avatar" aria-hidden="true">{profile.nickname.slice(0, 1)}</div>

            <div className="profile-field">
              <label htmlFor="profile-public-id">公開ID</label>
              <input id="profile-public-id" value={profile.public_user_id} readOnly />
              <p>公開IDは変更できません</p>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-nickname">ニックネーム</label>
              <input id="profile-nickname" value={profile.nickname} readOnly />
              <p>ニックネームは変更できません</p>
            </div>

            <div className="profile-personality">
              <div>
                <span>性格タイプ</span>
                <strong>{profile.personality_type
                  ? (PERSONALITY_NAMES[profile.personality_type] ?? "診断済み")
                  : "未診断"}</strong>
              </div>
              <Link href="/personality?return=/profile">性格診断を受け直す</Link>
            </div>

            {message && <p className={`profile-message${isError ? " is-error" : ""}`}
              role="status">{message}</p>}
          </section>
        ) : (
          <p className="profile-message is-error">{message}</p>
        )}
      </div>
    </main>
  );
}
