"use client";

import Image from "next/image";
import "./home.css";

// 両思い通話は相手と両思いになるまでロックされている（実データと連携する箇所）
const isMutualCallUnlocked = false;

export default function HomePage() {
  return (
    <main className="woolink-home">
      <div className="phone">

        {/* Content */}
        <section className="content">
          <section className="friend-card">
            <h1>友達一覧</h1>

            <p>
              このあたりにもともと畑があって、友達ができると羊に変わるみたいなのできる？
            </p>
          </section>

          <section className="actions">
            <a
              className="action-tile diary"
              href="/diary"
            >
              <span
                className="badge"
                aria-hidden="true"
              />

              <svg
                className="tile-icon"
                viewBox="0 0 48 48"
                width="40"
                height="40"
                aria-hidden="true"
              >
                <rect
                  x="12"
                  y="8"
                  width="24"
                  height="32"
                  rx="3"
                  fill="#fbfaf6"
                />

                <rect
                  x="9"
                  y="10"
                  width="24"
                  height="32"
                  rx="3"
                  fill="#ffffff"
                  stroke="#dcd8cc"
                  strokeWidth="1"
                />

                <line
                  x1="14"
                  y1="17"
                  x2="28"
                  y2="17"
                  stroke="#c9c4b4"
                  strokeWidth="1.4"
                />

                <line
                  x1="14"
                  y1="22"
                  x2="28"
                  y2="22"
                  stroke="#c9c4b4"
                  strokeWidth="1.4"
                />

                <line
                  x1="14"
                  y1="27"
                  x2="24"
                  y2="27"
                  stroke="#c9c4b4"
                  strokeWidth="1.4"
                />
              </svg>

              <span className="tile-label">
                交換日記
              </span>
            </a>

            {isMutualCallUnlocked ? (
              <a
                className="action-tile call"
                href="/call"
              >
                <svg
                  className="tile-icon"
                  viewBox="0 0 48 48"
                  width="34"
                  height="34"
                  aria-hidden="true"
                >
                  <path
                    d="M17 11l6 7-4 4c2.2 4.5 5.5 7.8 10 10l4-4 7 6c-1.6 4.2-5.9 5.9-9.8 4.5-8.8-3.2-15.5-9.9-18.7-18.7C10.1 15.9 12.8 12.6 17 11Z"
                    fill="none"
                    stroke="#fbfaf6"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="tile-label">
                  両思い通話
                </span>
              </a>
            ) : (
              <span
                className="action-tile call is-disabled"
                aria-disabled="true"
                tabIndex={-1}
              >
                <svg
                  className="tile-icon"
                  viewBox="0 0 48 48"
                  width="34"
                  height="34"
                  aria-hidden="true"
                >
                  <rect
                    x="14"
                    y="21"
                    width="20"
                    height="17"
                    rx="3"
                    fill="none"
                    stroke="#fbfaf6"
                    strokeWidth="2.6"
                  />

                  <path
                    d="M18 21v-5a6 6 0 0 1 12 0v5"
                    fill="none"
                    stroke="#fbfaf6"
                    strokeWidth="2.6"
                  />

                  <circle
                    cx="24"
                    cy="29"
                    r="2.2"
                    fill="#fbfaf6"
                  />
                </svg>

                <span className="tile-label">
                  両思い通話
                </span>
              </span>
            )}
          </section>
        </section>

        {/* Footer */}
        <footer className="mascot-row">
          <Image
            className="mascot"
            src="/home/guide-sheep.svg"
            alt="ガイド羊"
            width={120}
            height={120}
          />

          <a
            className="guide-bubble"
            href="/help"
          >
            ガイド
          </a>
        </footer>

      </div>
    </main>
  );
}