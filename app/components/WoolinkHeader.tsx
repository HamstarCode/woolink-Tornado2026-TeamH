"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WoolinkHeader() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // =========================
  // メニュー外をクリックしたら閉じる
  // =========================
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
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuOpen]);

  // =========================
  // ログアウト
  // =========================
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(
        "ログアウトエラー:",
        error.message
      );
      return;
    }

    setMenuOpen(false);
    router.replace("/");
  };

  return (
    <>
      <header className="woolink-header">
        <div className="woolink-header-brand">
          <svg
            className="woolink-header-mark"
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

          <span className="woolink-header-name">
            Woolink
          </span>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className={`woolink-menu-btn ${
            menuOpen ? "open" : ""
          }`}
          aria-label="メニューを開く"
          aria-expanded={menuOpen}
          aria-controls="woolink-menu"
          onClick={() =>
            setMenuOpen((previous) => !previous)
          }
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {menuOpen && (
        <nav
          ref={menuRef}
          id="woolink-menu"
          className="woolink-menu-panel"
        >
          <Link
            className="woolink-menu-item"
            href="/home"
            onClick={() => setMenuOpen(false)}
          >
            <span>ホーム</span>
            <ArrowIcon />
          </Link>

          <Link
            className="woolink-menu-item"
            href="/diary"
            onClick={() => setMenuOpen(false)}
          >
            <span>交換日記</span>
            <ArrowIcon />
          </Link>

          <Link
            className="woolink-menu-item"
            href="/profile"
            onClick={() => setMenuOpen(false)}
          >
            <span>プロフィール</span>
            <ArrowIcon />
          </Link>

          <Link
            className="woolink-menu-item"
            href="/notifications"
            onClick={() => setMenuOpen(false)}
          >
            <span>お知らせ</span>
            <ArrowIcon />
          </Link>

          <Link
            className="woolink-menu-item"
            href="/settings"
            onClick={() => setMenuOpen(false)}
          >
            <span>設定</span>
            <ArrowIcon />
          </Link>

          <Link
            className="woolink-menu-item"
            href="/help"
            onClick={() => setMenuOpen(false)}
          >
            <span>ヘルプ</span>
            <ArrowIcon />
          </Link>

          <button
            type="button"
            className="woolink-menu-item"
            onClick={handleLogout}
          >
            <span>ログアウト</span>
            <ArrowIcon />
          </button>
        </nav>
      )}
    </>
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