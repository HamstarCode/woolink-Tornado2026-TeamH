"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getDiaryRoom, type DiaryRoom } from "@/lib/diaryRoom";
import "./profile-detail.css";

type Bookmark = { publicUserId: string; nickname: string };

export default function ProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");
  const [profile, setProfile] = useState<DiaryRoom | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
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

            <button type="button" className="partner-friend-request" disabled>
              フレンド申請（準備中）
            </button>
            <p className="partner-profile-note">
              フレンドになると、通話の相手として選べるようになる予定です。
            </p>
          </section>
        ) : (
          <p className="partner-profile-error">{error || "読み込み中..."}</p>
        )}
      </div>
    </main>
  );
}
