"use client";

import Link from "next/link";
import "./diary.css";

export default function DiaryPage() {
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

          <section className="diary-card">
            <p className="diary-status">
              まだ今日は日記を書いていません
            </p>

            <div className="diary-action">
              <Link
                href="/diary/select"
                className="diary-write-btn"
              >
                日記を書く！
              </Link>
            </div>
          </section>

          <Link
            href="/diary/history"
            className="diary-history-row"
          >
            <svg
              className="diary-history-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="3"
                width="14"
                height="18"
                rx="2"
                fill="#eef0fb"
              />
            </svg>

            <span>これまでの日記</span>
          </Link>
        </section>

        <footer className="diary-mascot-row">
          <img
            className="diary-mascot"
            src="/UISOURCE/tornado_2026/Tornado_2026_diaryHome-main/Tornado_2026_diaryHome-main/picture/ガイド羊.svg"
            alt="ガイド羊"
          />

          <div className="diary-tip-bubble">
            写真から動画で日記を作ることもできるよ
          </div>
        </footer>
      </div>
    </main>
  );
}