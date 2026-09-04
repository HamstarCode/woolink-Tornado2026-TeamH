"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "./complete.css";

function CallCompleteContent() {
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const displayDate = date ? new Date(`${date}T00:00:00`) : new Date();
  const dateLabel = `${displayDate.getMonth() + 1}月${displayDate.getDate()}日`;
  const timeLabel = `${start ?? "00:00"}〜${end ?? "00:00"}`;

  return (
    <main className="complete-page">
      <div className="complete-phone">
        <section className="complete-content">
          <div className="complete-message">
            <p className="complete-datetime">
              {dateLabel}
              <br />
              {timeLabel}
            </p>
            <p className="complete-caption">に設定しました</p>
          </div>

          <div className="complete-footer-actions">
            <Link
              href="/home"
              className="complete-home-btn"
            >
              ホームへ戻る
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CallCompletePage() {
  return (
    <Suspense fallback={null}>
      <CallCompleteContent />
    </Suspense>
  );
}
