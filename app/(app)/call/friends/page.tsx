"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { buildCallQuery } from "../callQuery";
import "./friends.css";

// 友達一覧のサンプルデータ（実データに置き換える想定）
const SAMPLE_FRIENDS = [
  { name: "Takumi", avatar: "avatar-1", tag: "🌙 サンプル" },
  { name: "Haru", avatar: "avatar-2", tag: "🌙 サンプル" },
  { name: "Yuki", avatar: "avatar-3", tag: "🌙 サンプル" },
  { name: "Mei", avatar: "avatar-4", tag: "🌙 サンプル" },
  { name: "Sara", avatar: "avatar-5", tag: "🌙 サンプル" },
  { name: "takumim.igipkonto", avatar: "avatar-6", tag: null },
  { name: "takumi.maruseno", avatar: "avatar-1", tag: null },
];

function PersonIcon() {
  return (
    <svg viewBox="0 0 40 40" width="22" height="22">
      <circle
        cx="20"
        cy="15"
        r="7"
        fill="#eef0fb"
      />
      <path
        d="M6 34c0-8 6-13 14-13s14 5 14 13"
        fill="none"
        stroke="#eef0fb"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CallFriendsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date");

  const [selectedFriend, setSelectedFriend] = useState<string | null>(
    "Sara"
  );

  return (
    <main className="friends-page">
      <div className="friends-phone">
        <section className="friends-content">
          <div className="friends-scroll-area">
            <h1 className="friends-page-title">誰と話したい？</h1>

            <p className="friends-notice">
              <svg
                className="friends-notice-icon"
                viewBox="0 0 24 24"
                width="13"
                height="13"
                aria-hidden="true"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
              あなたが選んだことは、マッチするまで相手にはわかりません
            </p>

            <div
              className="friends-contact-list"
              role="radiogroup"
              aria-label="話したい相手"
            >
              {SAMPLE_FRIENDS.map((friend) => (
                <button
                  key={friend.name}
                  type="button"
                  className={`friends-contact-row${
                    selectedFriend === friend.name ? " is-selected" : ""
                  }`}
                  onClick={() => setSelectedFriend(friend.name)}
                >
                  <span className={`friends-avatar ${friend.avatar}`}>
                    <PersonIcon />
                  </span>

                  <span className="friends-contact-main">
                    <span className="friends-contact-name">
                      {friend.name}
                    </span>

                    {friend.tag && (
                      <span className="friends-contact-tag">
                        {friend.tag}
                      </span>
                    )}
                  </span>

                  <span
                    className="friends-radio-dot"
                    aria-hidden="true"
                  />
                </button>
              ))}

              <div className="friends-invite-box">
                <label
                  className="friends-invite-label"
                  htmlFor="inviteEmail"
                >
                  友達のメールアドレスで追加
                </label>

                <div className="friends-invite-row">
                  <input
                    type="email"
                    id="inviteEmail"
                    className="friends-invite-input"
                    placeholder="friend@example.com"
                  />

                  <span className="friends-invite-btn">追加</span>
                </div>
              </div>
            </div>

            <span className="friends-invite-link">
              友達がいない？招待リンクを作る
            </span>
          </div>

          <div className="friends-footer-actions">
            <Link
              className={`friends-next-btn${
                selectedFriend ? "" : " is-disabled"
              }`}
              href={
                selectedFriend
                  ? `/call/time${buildCallQuery({
                      date,
                      who: "friend",
                      friend: selectedFriend,
                    })}`
                  : "#"
              }
              aria-disabled={!selectedFriend}
            >
              次へ
            </Link>

            <div className="friends-back-btn-wrap">
              <button
                type="button"
                className="friends-back-btn"
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
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CallFriendsPage() {
  return (
    <Suspense fallback={null}>
      <CallFriendsContent />
    </Suspense>
  );
}
