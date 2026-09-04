"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "./settings.css";

const supabase = createClient();
const FORCE_MATCH_ADMIN_EMAIL = "aikii1012@gmail.com";

type ForceMatchResult = {
  matched_count: number;
  remaining_count: number;
};

export default function SettingsPage() {
  const router = useRouter();
  const [isMatching, setIsMatching] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setIsAdmin(data.user?.email?.toLowerCase() === FORCE_MATCH_ADMIN_EMAIL);
    });
    return () => { active = false; };
  }, []);

  const handleForceMatch = async () => {
    if (!window.confirm("現在のEX期間の未マッチ提出を強制マッチしますか？")) return;

    setIsMatching(true);
    setMessage("");
    setIsError(false);

    const { data, error } = await supabase.rpc("force_match_diaries");

    if (error) {
      console.error("強制マッチエラー:", error.message);
      setMessage("強制マッチを実行できませんでした。");
      setIsError(true);
    } else {
      const result = (data?.[0] ?? null) as ForceMatchResult | null;
      const matched = result?.matched_count ?? 0;
      const remaining = result?.remaining_count ?? 0;
      setMessage(
        `${matched}人（${Math.floor(matched / 2)}組）がマッチしました。未マッチは${remaining}人です。`,
      );
    }

    setIsMatching(false);
  };

  return (
    <main className="settings-page">
      <div className="settings-phone">
        <button className="settings-back" type="button" onClick={() => router.back()}>
          ← 戻る
        </button>

        <h1>設定</h1>

        <section className="settings-card">
          <p className="settings-card-label">発表・デバッグ用</p>
          <h2>交換日記の強制マッチ</h2>
          <p className="settings-description">
            未マッチの指定希望も含め、全員を性格タイプの相性でマッチします。最後に残った人同士は提出順で組み合わせます。
          </p>

          <button
            className="settings-force-match"
            type="button"
            onClick={handleForceMatch}
            disabled={isMatching || isAdmin !== true}
          >
            {isAdmin === null
              ? "権限を確認中..."
              : isMatching
                ? "マッチング中..."
                : "強制マッチを実行"}
          </button>

          {isAdmin === false && (
            <p className="settings-admin-note">この操作は管理者のみ実行できます。</p>
          )}

          {message && (
            <p className={`settings-result${isError ? " is-error" : ""}`} role="status">
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
