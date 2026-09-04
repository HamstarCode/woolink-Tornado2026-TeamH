"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./confirm.css";

type Recipient =
  | { type: "stranger" }
  | { type: "friend"; name: string }
  | null;

export default function DiaryFriendPage() {
  const router = useRouter();

  const [recipient, setRecipient] =
    useState<Recipient>(null);

  const [friendInput, setFriendInput] =
    useState("");

  const selectStranger = () => {
    setRecipient({ type: "stranger" });
    setFriendInput("");
  };

  const selectFriend = (name: string) => {
    setRecipient({
      type: "friend",
      name,
    });
    setFriendInput("");
  };

  const handleFriendInput = (
    value: string
  ) => {
    setFriendInput(value);

    if (value.trim().length > 0) {
      setRecipient(null);
    }
  };

  const canSend =
    recipient !== null ||
    friendInput.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;

    // 今は画面完成を優先。
    // 後でここにSupabaseへの送信処理を入れる。
    console.log("送信先:", {
      recipient,
      friendInput: friendInput.trim(),
    });
  };

  return (
    <main className="friend-page">
      <div className="friend-phone">
        <main className="content">
          <div className="scroll-area">
            {/* 戻る */}
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

            {/* 日記内容 */}
            <div className="content-preview">
              <p>
                内容
                <br />
                動画か日記の文章
              </p>
            </div>

            {/* 誰に送る？ */}
            <h1 className="section-title center">
              誰に送る？
            </h1>

            {/* 初めて出会う誰かに */}
            <button
              type="button"
              className={`stranger-btn ${
                recipient?.type === "stranger"
                  ? "is-selected"
                  : ""
              }`}
              onClick={selectStranger}
            >
              初めて出会う誰かに
            </button>

            {/* 友達に送る */}
            <h2 className="section-title">
              友達に送る
            </h2>

            <input
              type="text"
              className="friend-input"
              value={friendInput}
              onChange={(event) =>
                handleFriendInput(
                  event.target.value
                )
              }
              placeholder="入力"
            />

            {/* きいてほしいした人 */}
            <h2 className="section-title">
              <svg
                className="star-icon"
                viewBox="0 0 24 24"
                width="13"
                height="13"
                aria-hidden="true"
              >
                <path
                  d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.2 7.1L12 17.8l-6.2 3.5L7 14.2 2 9.3z"
                  fill="#f2c94c"
                />
              </svg>
              「きいてほしい」した人
            </h2>

            <div className="avatar-row">
              <button
                type="button"
                className={`avatar-item ${
                  recipient?.type === "friend" &&
                  recipient.name === "Sora"
                    ? "is-selected"
                    : ""
                }`}
                onClick={() =>
                  selectFriend("Sora")
                }
              >
                <span className="avatar avatar-a" />
                <span className="avatar-name">
                  Sora
                </span>
              </button>
            </div>

            {/* 最近指定してくれた人 */}
            <h2 className="section-title">
              最近指定してくれた人
            </h2>

            <div className="avatar-row">
              <button
                type="button"
                className={`avatar-item ${
                  recipient?.type === "friend" &&
                  recipient.name === "Haru"
                    ? "is-selected"
                    : ""
                }`}
                onClick={() =>
                  selectFriend("Haru")
                }
              >
                <span className="avatar avatar-b" />
                <span className="avatar-name">
                  Haru
                </span>
              </button>

              <button
                type="button"
                className={`avatar-item ${
                  recipient?.type === "friend" &&
                  recipient.name === "Yuki"
                    ? "is-selected"
                    : ""
                }`}
                onClick={() =>
                  selectFriend("Yuki")
                }
              >
                <span className="avatar avatar-c" />
                <span className="avatar-name">
                  Yuki
                </span>
              </button>

              <button
                type="button"
                className={`avatar-item ${
                  recipient?.type === "friend" &&
                  recipient.name === "Mei"
                    ? "is-selected"
                    : ""
                }`}
                onClick={() =>
                  selectFriend("Mei")
                }
              >
                <span className="avatar avatar-d" />
                <span className="avatar-name">
                  Mei
                </span>
              </button>
            </div>

            {/* 送信 */}
            <button
              type="button"
              className={`send-btn ${
                !canSend ? "is-disabled" : ""
              }`}
              onClick={handleSend}
              disabled={!canSend}
            >
              送信
            </button>
          </div>
        </main>
      </div>
    </main>
  );
}