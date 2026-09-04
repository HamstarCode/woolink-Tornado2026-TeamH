"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VIDEO_STUDIO_URL } from "@/lib/external-links";
import "./write.css";

export default function DiaryWritePage() {
  const router = useRouter();

  const [diary, setDiary] = useState("");

  // 下書きを読み込む
  useEffect(() => {
    const saved = localStorage.getItem("draftDiary");

    if (saved !== null) {
      queueMicrotask(() => setDiary(saved));
    }
  }, []);

  // 入力内容を下書きとして保存
  useEffect(() => {
    localStorage.setItem("draftDiary", diary);
  }, [diary]);

  return (
    <main className="write-page">
      <div className="write-phone">
        <main className="write-content">
          <div className="action-row">
            <button
              type="button"
              className="back-btn"
              onClick={() => router.back()}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <path
                  d="M15 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              戻る
            </button>

            <Link
              className="confirm-btn"
              href="/diary/confirm"
            >
              確認する
            </Link>
          </div>

          <p className="hint-text">
            ヒント：今日のお昼ごはんは？
          </p>

          {/* 写真→動画(video-diary)は別デプロイの独立アプリなので、動画を
              直接添付する手段は無い。生成した動画のURLをコピーして本文に
              貼ると、相手が読むときに自動で埋め込み再生される
              (src/components/DiaryBody.tsx が本文中の .mp4 URL を検出)。 */}
          <a
            href={VIDEO_STUDIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              fontSize: 12,
              color: "#c7cae4",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              marginBottom: 10,
            }}
          >
            🎬 写真から動画を作って、URLをここに貼る ↗
          </a>

          <textarea
            className="diary-textarea"
            value={diary}
            onChange={(event) =>
              setDiary(event.target.value)
            }
            placeholder={`今日は少しゆっくり過ごした。

やることを一つずつ片付けられて、すっきりした気分。

明日も無理せず、自分のペースで頑張りたい。`}
          />
        </main>
      </div>
    </main>
  );
}
