"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "./diary.css";

type Submission = {
  id: string;
  room_id: string | null;
};

const GUIDE_SHEEP_SRC = "/home/guide-sheep.svg";

function getCurrentExchangeRange() {
  const now = new Date();
  const start = new Date(now);

  if (now.getHours() < 20) {
    start.setDate(start.getDate() - 1);
  }

  start.setHours(20, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export default function DiaryPage() {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadSubmission = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        setError("ログイン情報を確認できませんでした。");
        setIsLoading(false);
        return;
      }

      const { start, end } = getCurrentExchangeRange();
      const { data, error: submissionError } = await supabase
        .from("submissions")
        .select("id, room_id")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<Submission>();

      if (!active) return;

      if (submissionError) {
        console.error("提出状況取得エラー:", submissionError.message);
        setError("日記の提出状況を確認できませんでした。");
      } else {
        setSubmission(data);
      }

      setIsLoading(false);
    };

    void loadSubmission();

    return () => {
      active = false;
    };
  }, []);

  const isMatched = submission?.room_id != null;

  return (
    <main className="diary-page">
      <div className="diary-phone">
        <section className="diary-content">
          <section className="diary-friend-card">
            <h1>友達一覧</h1>

            <p>
              このあたりにもともと畑があって、
              友達ができると羊に変わるみたいなの
              できる？
            </p>
          </section>

          <section
            className={`diary-card${isLoading ? " diary-card-loading" : ""}`}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <p className="diary-loading-text">ロード中...</p>
            ) : error ? (
              <p className="diary-status diary-status-error" role="alert">
                {error}
              </p>
            ) : !submission ? (
              <>
                <p className="diary-status">
                  まだ今回の日記を書いていません
                </p>

                <div className="diary-action">
                  <Link href="/diary/select" className="diary-write-btn">
                    日記を書く！
                  </Link>
                </div>
              </>
            ) : isMatched ? (
              <>
                <p className="diary-status diary-status-complete">
                  交換相手が決まりました
                </p>
                <p className="diary-status-detail">
                  相手の日記が公開されています
                </p>

                <div className="diary-action">
                  <Link
                    href={`/room/${submission.room_id}`}
                    className="diary-write-btn"
                  >
                    相手の交換を見る
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="diary-status diary-status-complete">
                  日記は提出済みです ✓
                </p>
                <p className="diary-status-detail">
                  交換相手を探しています
                </p>
              </>
            )}
          </section>

          <Link href="/diary/history" className="diary-history-row">
            <svg
              className="diary-history-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <rect x="5" y="3" width="14" height="18" rx="2" fill="#eef0fb" />
            </svg>

            <span>これまでの日記</span>
          </Link>
        </section>

        <footer className="diary-mascot-row">
          <Image
            className="diary-mascot"
            src={GUIDE_SHEEP_SRC}
            alt="ガイド羊"
            width={120}
            height={120}
          />

          <div className="diary-tip-bubble">
            {isMatched
              ? "交換相手の日記を見にいこう！"
              : submission
                ? "交換相手が見つかるまで待っていてね"
                : "写真から動画で日記を作ることもできるよ"}
          </div>
        </footer>
      </div>
    </main>
  );
}
