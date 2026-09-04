"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getDiaryRoom, sendDiaryReply, type DiaryRoom } from "@/lib/diaryRoom";
import "./room.css";

const REACTIONS = [
  { emoji: "👀", label: "読みました" },
  { emoji: "😊", label: "共感しました" },
  { emoji: "👍", label: "いいね" },
  { emoji: "💭", label: "考えさせられました" },
];

type Bookmark = { publicUserId: string; nickname: string };

export default function RoomPage() {
  const params = useParams<{ room_id: string }>();
  const router = useRouter();
  const roomId = params.room_id;

  const [room, setRoom] = useState<DiaryRoom | null>(null);
  const [reply, setReply] = useState("");
  const [reaction, setReaction] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await getDiaryRoom(roomId);
        if (!active) return;
        setRoom(data);

        const saved = localStorage.getItem("bookmarks");
        const bookmarks: Bookmark[] = saved ? JSON.parse(saved) : [];
        setIsBookmarked(
          bookmarks.some(
            (bookmark) => bookmark.publicUserId === data.partner_public_user_id,
          ),
        );
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "交換日記を読み込めませんでした。",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [roomId]);

  const toggleBookmark = () => {
    if (!room) return;

    const saved = localStorage.getItem("bookmarks");
    const bookmarks: Bookmark[] = saved ? JSON.parse(saved) : [];
    const updated = isBookmarked
      ? bookmarks.filter(
          (bookmark) => bookmark.publicUserId !== room.partner_public_user_id,
        )
      : [
          ...bookmarks,
          {
            publicUserId: room.partner_public_user_id,
            nickname: room.partner_nickname,
          },
        ];

    localStorage.setItem("bookmarks", JSON.stringify(updated));
    setIsBookmarked(!isBookmarked);
  };

  const handleReply = async () => {
    if (!room || isSending || (!reply.trim() && !reaction)) return;

    setIsSending(true);
    setError("");

    try {
      await sendDiaryReply(roomId, reply, reaction);
      setRoom({
        ...room,
        my_reply_content: reply.trim() || null,
        my_reply_reaction: reaction,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "返信を送信できませんでした。",
      );
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <main className="room-state">交換日記を読み込んでいます...</main>;
  }

  if (!room) {
    return (
      <main className="room-state">
        <p>{error || "交換日記が見つかりませんでした。"}</p>
        <Link href="/diary">交換日記ホームへ</Link>
      </main>
    );
  }

  const hasReplied = Boolean(room.my_reply_content || room.my_reply_reaction);
  const isExpired = new Date() >= new Date(room.ended_at);
  const canReply = Boolean(reply.trim() || reaction) && !isSending;

  return (
    <main className="room-page">
      <div className="room-phone">
        <section className="room-content">
          <button className="room-back-btn" type="button" onClick={() => router.push("/diary")}>
            ← 交換日記ホームへ
          </button>

          <section className="room-card">
            <div className="room-partner-row">
              <div>
                <p className="room-label">相手の日記</p>
                <p className="room-partner-name">{room.partner_nickname}さん</p>
              </div>
              <div className="room-partner-actions">
                <button
                  type="button"
                  className="room-bookmark-btn"
                  onClick={toggleBookmark}
                  aria-label={isBookmarked ? "ブックマークを解除" : "ブックマークする"}
                >
                  {isBookmarked ? "★" : "☆"}
                </button>
                <Link
                  className="room-profile-link"
                  href={`/profile/${room.partner_user_id}?room=${roomId}`}
                >
                  プロフィール
                </Link>
              </div>
            </div>

            <p className="room-diary">{room.partner_diary}</p>
          </section>

          <section className="room-card">
            <p className="room-label">返信</p>

            {hasReplied ? (
              <div className="room-replied">
                <p className="room-replied-title">返信済み ✓</p>
                {room.my_reply_reaction && (
                  <p className="room-replied-reaction">{room.my_reply_reaction}</p>
                )}
                {room.my_reply_content && (
                  <p className="room-replied-content">{room.my_reply_content}</p>
                )}
              </div>
            ) : isExpired ? (
              <p className="room-muted">このExchangeは終了しました。</p>
            ) : (
              <>
                <div className="room-reactions" aria-label="リアクション">
                  {REACTIONS.map((item) => (
                    <button
                      key={item.emoji}
                      type="button"
                      className={`room-reaction ${reaction === item.emoji ? "is-selected" : ""}`}
                      onClick={() =>
                        setReaction(reaction === item.emoji ? null : item.emoji)
                      }
                    >
                      <span>{item.emoji}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="room-reply-input"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="ひとこと返信できます"
                  maxLength={2000}
                  rows={4}
                />

                <button
                  type="button"
                  className="room-reply-btn"
                  onClick={handleReply}
                  disabled={!canReply}
                >
                  {isSending ? "送信中..." : "返信する"}
                </button>
              </>
            )}
          </section>

          {error && <p className="room-error" role="alert">{error}</p>}
        </section>
      </div>
    </main>
  );
}
