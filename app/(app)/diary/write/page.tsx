"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./write.css";

export default function DiaryWritePage() {
  const router = useRouter();

  const [diary, setDiary] = useState("");

  // 下書きを読み込む
  useEffect(() => {
    const saved = localStorage.getItem("draftDiary");

    if (saved !== null) {
      setDiary(saved);
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