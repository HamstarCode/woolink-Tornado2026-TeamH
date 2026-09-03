"use client";

import { useEffect, useRef, useState } from "react";
import "./home.css";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // メニュー外をクリックしたら閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener(
        "click",
        handleClickOutside
      );
    };
  }, [menuOpen]);

  return (
    <main className="woolink-home">
      <div className="phone">
        {/* Header */}
        <header className="topbar">
          <div className="brand">
            <svg
              className="brand-mark"
              viewBox="0 0 40 40"
              width="26"
              height="26"
              aria-hidden="true"
            >
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="#f4c95d"
              />
              <circle
                cx="14"
                cy="18"
                r="2.4"
                fill="#2a2550"
              />
              <circle
                cx="26"
                cy="18"
                r="2.4"
                fill="#2a2550"
              />
              <path
                d="M14 25 Q20 29 26 25"
                stroke="#2a2550"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>

            <span className="brand-name">
              Woolink
            </span>
          </div>

          <button
            ref={menuButtonRef}
            className={`menu-btn ${
              menuOpen ? "open" : ""
            }`}
            type="button"
            aria-label="メニューを開く"
            aria-expanded={menuOpen}
            aria-controls="menuPanel"
            onClick={() =>
              setMenuOpen((previous) => !previous)
            }
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {/* Dropdown menu */}
        {menuOpen && (
          <nav
            ref={menuRef}
            className="menu-panel"
            id="menuPanel"
          >
            <a
              className="menu-item"
              href="/profile"
            >
              <span>プロフィール</span>
              <ArrowIcon />
            </a>

            <a
              className="menu-item"
              href="/notifications"
            >
              <span>お知らせ</span>
              <ArrowIcon />
            </a>

            <a
              className="menu-item"
              href="/settings"
            >
              <span>設定</span>
              <ArrowIcon />
            </a>

            <a
              className="menu-item"
              href="/help"
            >
              <span>ヘルプ</span>
              <ArrowIcon />
            </a>

            <a
              className="menu-item"
              href="/"
            >
              <span>ログアウト</span>
              <ArrowIcon />
            </a>
          </nav>
        )}

        {/* Content */}
        <main className="content">
          <section className="friend-card">
            <h1>友達一覧</h1>

            <p>
              ここには友達ができると羊が増えていくような
              表現を入れる予定です。
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
                <rect
                  x="14"
                  y="21"
                  width="20"
                  height="17"
                  rx="3"
                  fill="none"
                  stroke="#8a90ad"
                  strokeWidth="2.6"
                />
                <path
                  d="M18 21v-5a6 6 0 0 1 12 0v5"
                  fill="none"
                  stroke="#8a90ad"
                  strokeWidth="2.6"
                />
                <circle
                  cx="24"
                  cy="29"
                  r="2.2"
                  fill="#8a90ad"
                />
              </svg>

              <span className="tile-label">
                両思い通話
              </span>
            </a>
          </section>
        </main>

        {/* Footer */}
        <footer className="mascot-row">
          <svg
            className="mascot"
            viewBox="0 0 120 110"
            width="96"
            height="88"
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
              fontFamily="'Hiragino Sans','Noto Sans JP',sans-serif"
            >
              ハムスター
            </text>
            <text
              x="60"
              y="104"
              textAnchor="middle"
              fontSize="10"
              fill="#c9cbe8"
              fontFamily="'Hiragino Sans','Noto Sans JP',sans-serif"
            >
              すぎる
            </text>
          </svg>

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

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}