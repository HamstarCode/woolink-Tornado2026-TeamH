"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "../welcome.css";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [checking, setChecking] = useState(true);
  const [nickname, setNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }
      // tonight は handle_new_user トリガーで profiles を自動作成するので、
      // ここでは診断済みかどうかだけ見て分岐する。
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, personality_type")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.personality_type) {
        router.replace("/home");
        return;
      }
      setNickname(profile?.name ?? "");
      setChecking(false);
    })();
  }, [router, supabase]);

  const saveNickname = async () => {
    const nextName = nickname.trim();
    if (!nextName || isSaving) return;
    setIsSaving(true);
    setError("");

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ name: nextName })
      .eq("id", authData.user.id);
    if (updateError) {
      setError("ニックネームを保存できませんでした。");
      setIsSaving(false);
      return;
    }
    router.push("/personality");
  };

  if (checking) {
    return (
      <main className="welcome-page">
        <div className="welcome-phone">
          <div className="welcome-intro">
            <p className="welcome-copy">確認中…</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="welcome-page">
      <div className="welcome-phone">
        <div className="welcome-intro">
          <p className="welcome-copy">まずはプロフィールを作りましょう</p>

          <div className="welcome-panel">
            <label className="welcome-nickname-label" htmlFor="nickname">ニックネーム</label>
            <input id="nickname" className="welcome-nickname-input" value={nickname}
              maxLength={30} onChange={(event) => setNickname(event.target.value)}
              placeholder="ニックネームを入力" />
            {error && <p className="welcome-nickname-error">{error}</p>}
          </div>

          <button
            type="button"
            className="welcome-next-btn"
            onClick={saveNickname}
            disabled={!nickname.trim() || isSaving}
          >
            {isSaving ? "保存中…" : "性格診断へすすむ"}
          </button>
        </div>
      </div>
    </main>
  );
}
