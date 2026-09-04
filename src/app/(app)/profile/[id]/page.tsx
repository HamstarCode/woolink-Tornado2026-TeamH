"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getDiaryRoom, type DiaryRoom } from "@/lib/diaryRoom";
import "./profile-detail.css";

type Bookmark = { publicUserId: string; nickname: string };
type FriendStatus = "loading" | "none" | "outgoing" | "incoming" | "friends";

export default function ProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");
  const [profile, setProfile] = useState<DiaryRoom | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("loading");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [friendError, setFriendError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!roomId) {
        setError("交換日記からプロフィールを開いてください。");
        return;
      }

      try {
        const room = await getDiaryRoom(roomId);
        if (!active) return;

        if (room.partner_user_id !== params.id) {
          setError("このプロフィールを表示する権限がありません。");
          return;
        }

        setProfile(room);
        const relationshipResponse = await fetch(
          `/api/friend-requests?targetUserId=${encodeURIComponent(room.partner_user_id)}`,
        );
        if (relationshipResponse.ok) {
          const relationship = (await relationshipResponse.json()) as { status: FriendStatus };
          if (active) setFriendStatus(relationship.status);
        } else if (active) {
          setFriendStatus("none");
        }
        const saved = localStorage.getItem("bookmarks");
        const bookmarks: Bookmark[] = saved ? JSON.parse(saved) : [];
        setIsBookmarked(
          bookmarks.some(
            (bookmark) => bookmark.publicUserId === room.partner_public_user_id,
          ),
        );
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "プロフィールを読み込めませんでした。",
          );
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [params.id, roomId]);

  const toggleBookmark = () => {
    if (!profile) return;

    const saved = localStorage.getItem("bookmarks");
    const bookmarks: Bookmark[] = saved ? JSON.parse(saved) : [];
    const updated = isBookmarked
      ? bookmarks.filter(
          (bookmark) => bookmark.publicUserId !== profile.partner_public_user_id,
        )
      : [
          ...bookmarks,
          {
            publicUserId: profile.partner_public_user_id,
            nickname: profile.partner_nickname,
          },
        ];

    localStorage.setItem("bookmarks", JSON.stringify(updated));
    setIsBookmarked(!isBookmarked);
  };

  const sendFriendRequest = async () => {
    if (!profile || sendingRequest || friendStatus !== "none") return;
    setSendingRequest(true);
    setFriendError("");
    const response = await fetch("/api/friend-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: profile.partner_user_id }),
    });
    const result = (await response.json().catch(() => ({}))) as { status?: FriendStatus; error?: string };
    setSendingRequest(false);
    if (!response.ok) {
      setFriendError(result.error ?? "フレンド申請を送れませんでした。");
      return;
    }
    setFriendStatus(result.status ?? "outgoing");
  };

  const friendButtonLabel = {
    loading: "確認中...",
    none: sendingRequest ? "送信中..." : "フレンド申請する",
    outgoing: "フレンド申請済み",
    incoming: "申請が届いています",
    friends: "フレンドです",
  }[friendStatus];

  return (
    <main className="partner-profile-page">
      <div className="partner-profile-phone">
        <Link className="partner-profile-back" href={roomId ? `/room/${roomId}` : "/diary"}>
          ← 交換日記へ戻る
        </Link>

        {profile ? (
          <section className="partner-profile-card">
            <div className="partner-profile-avatar" aria-hidden="true">
              {profile.partner_nickname.slice(0, 1)}
            </div>
            <h1>{profile.partner_nickname}</h1>
            <p className="partner-profile-id">公開ID：{profile.partner_public_user_id}</p>
            {profile.partner_personality_type && (
              <p className="partner-profile-type">
                性格タイプ：{profile.partner_personality_type}
              </p>
            )}

            <button type="button" className="partner-bookmark" onClick={toggleBookmark}>
              {isBookmarked ? "★ ブックマーク済み" : "☆ ブックマークする"}
            </button>

            <button
              type="button"
              className={`partner-friend-request${friendStatus === "none" ? " is-ready" : ""}`}
              disabled={friendStatus !== "none" || sendingRequest}
              onClick={sendFriendRequest}
            >
              {friendButtonLabel}
            </button>
            {friendStatus === "incoming" && (
              <Link className="partner-request-link" href="/notifications">お知らせで申請を確認する</Link>
            )}
            {friendError && <p className="partner-friend-error">{friendError}</p>}
            <p className="partner-profile-note">
              承認されてフレンドになると、日調の通話相手として選べます。
            </p>
          </section>
        ) : (
          <p className="partner-profile-error">{error || "読み込み中..."}</p>
        )}
      </div>
    </main>
  );
}
