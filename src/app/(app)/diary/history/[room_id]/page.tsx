"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getDiaryHistoryDetail,
  type DiaryHistoryDetail,
} from "@/lib/diaryRoom";
import DiaryBody from "@/components/DiaryBody";
import { useBookmark } from "@/hooks/useBookmark";
import "./history-detail.css";

export default function DiaryHistoryDetailPage() {
  const params = useParams<{ room_id: string }>();
  const roomId = params.room_id;
  const [detail, setDetail] = useState<DiaryHistoryDetail | null>(null);
  const [error, setError] = useState("");
  const { isBookmarked, toggleBookmark } = useBookmark(
    detail?.partner_user_id,
    detail?.partner_public_user_id,
    detail?.partner_nickname,
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await getDiaryHistoryDetail(roomId);
        if (active) setDetail(data);
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "交換記録を読み込めませんでした。",
          );
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [roomId]);

  const exchangeDate = detail
    ? new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(detail.exchangeStartedAt))
    : "";

  return (
    <main className="history-detail-page">
      <div className="history-detail-phone">
        <div className="history-detail-heading">
          <Link href="/diary/history">← これまでの日記</Link>
          {detail && <p>{exchangeDate}の交換</p>}
        </div>

        {detail ? (
          <div className="history-detail-sections">
            {detail.room_id && detail.partner_nickname ? (
            <article className="history-detail-card history-detail-received">
              <div className="history-detail-card-heading">
                <div>
                  <p className="history-detail-eyebrow">相手から届いた日記</p>
                  <h1>{detail.partner_nickname}さんの日記</h1>
                </div>
                <div className="history-detail-partner-actions">
                  <button
                    type="button"
                    onClick={toggleBookmark}
                    aria-label={isBookmarked ? "ブックマークを解除" : "ブックマークする"}
                  >
                    {isBookmarked ? "★" : "☆"}
                  </button>
                  <Link href={`/profile/${detail.partner_user_id}?room=${detail.room_id}`}>
                    プロフィール
                  </Link>
                </div>
              </div>

              <div className="history-detail-diary">
                <DiaryBody text={detail.partner_diary} />
              </div>

              <section className="history-detail-reply">
                <h2>あなたの返信</h2>
                {detail.my_reply_reaction && (
                  <p className="history-detail-reaction">{detail.my_reply_reaction}</p>
                )}
                {detail.my_reply_content ? (
                  <DiaryBody text={detail.my_reply_content} />
                ) : !detail.my_reply_reaction ? (
                  <p className="history-detail-muted">返信していません</p>
                ) : null}
              </section>
            </article>
            ) : null}

            <article className="history-detail-card history-detail-sent">
              <p className="history-detail-eyebrow">あなたが送った日記</p>
              <h1>あなたの日記</h1>
              <div className="history-detail-diary">
                <DiaryBody text={detail.myDiary} />
              </div>

              <section className="history-detail-reply">
                <h2>
                  {detail.partner_nickname
                    ? `${detail.partner_nickname}さんからの返信`
                    : detail.submissionKind === "private"
                      ? "保存状況"
                    : "交換状況"}
                </h2>
                {detail.partnerReplyReaction && (
                  <p className="history-detail-reaction">
                    {detail.partnerReplyReaction}
                  </p>
                )}
                {detail.partnerReplyContent ? (
                  <DiaryBody text={detail.partnerReplyContent} />
                ) : !detail.partnerReplyReaction && detail.room_id ? (
                  <p className="history-detail-muted">
                    相手からの返信はまだありません
                  </p>
                ) : !detail.room_id ? (
                  <p className="history-detail-muted">
                    {detail.submissionKind === "private"
                      ? "自分用の思い出として保存しました"
                      : "交換相手を探しています"}
                  </p>
                ) : null}
              </section>
            </article>
          </div>
        ) : (
          <p className={`history-detail-message ${error ? "is-error" : ""}`}>
            {error || "交換記録を読み込んでいます..."}
          </p>
        )}
      </div>
    </main>
  );
}
