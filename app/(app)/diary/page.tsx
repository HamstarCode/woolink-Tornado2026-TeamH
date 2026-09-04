"use client";

import Link from "next/link";
import "./diary.css";

export default function DiaryPage() {
  return (
    <main className="diary-page">
      <div className="diary-phone">

        {/* Content */}
        <section className="diary-content">
          <section className="diary-friend-card">
            <h1>友達一覧</h1>
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

        {/* Footer */}
        <footer className="diary-mascot-row">
          <svg
            className="diary-mascot"
            viewBox="0 0 120 110"
            width="88"
            height="80"
            aria-hidden="true"
          >
            <ellipse
              cx="60"
              cy="60"
              rx="52"
              ry="46"
              fill="#3a4a86"
            />

            <circle
              cx="30"
              cy="24"
              r="8"
              fill="#3a4a86"
            />

            <circle
              cx="90"
              cy="20"
              r="6"
              fill="#3a4a86"
            />

            <circle
              cx="102"
              cy="34"
              r="5"
              fill="#3a4a86"
            />

            <circle
              cx="42"
              cy="52"
              r="4"
              fill="#e7e6f2"
            />

            <circle
              cx="70"
              cy="52"
              r="4"
              fill="#e7e6f2"
            />

            <path
              d="M44 66 Q56 74 68 66"
              stroke="#e7e6f2"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />

            <text
              x="60"
              y="94"
              textAnchor="middle"
              fontSize="10"
              fill="#c9cbe8"
              fontFamily="'Zen Maru Gothic','Hiragino Sans',sans-serif"
            >
              ハムスター
            </text>

            <text
              x="60"
              y="104"
              textAnchor="middle"
              fontSize="10"
              fill="#c9cbe8"
              fontFamily="'Zen Maru Gothic','Hiragino Sans',sans-serif"
            >
              すぎる
            </text>
          </svg>

          <div className="diary-tip-bubble">
            写真から動画で日記を作ることもできるよ
          </div>
        </footer>

      </div>
    </main>
  );
}