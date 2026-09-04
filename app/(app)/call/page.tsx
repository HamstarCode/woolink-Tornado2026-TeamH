"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./call.css";

const WEEKDAY_JA = ["月", "火", "水", "木", "金", "土", "日"];

// 話せる時間の予定が入っている曜日（0=月 … 6=日）。実データに置き換える想定。
const SCHEDULE_OFFSETS = [2, 4, 5];

function getMonday(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CallSchedulePage() {
  const router = useRouter();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const monday = useMemo(() => getMonday(today), [today]);

  const todayOffset = Math.round(
    (today.getTime() - monday.getTime()) / 86400000
  );

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [monday]);

  const [selectedOffset, setSelectedOffset] = useState(todayOffset);

  const selectedDate = weekDates[selectedOffset];
  const hasSchedule = SCHEDULE_OFFSETS.includes(selectedOffset);

  return (
    <main className="call-page">
      <div className="call-phone">
        <section className="call-content">
          <section className="call-date-picker">
            <div className="call-date-picker-header">
              {today.getFullYear()} 年 {today.getMonth() + 1} 月
            </div>

            <div className="call-date-picker-row">
              {weekDates.map((d, i) => {
                const isToday = i === todayOffset;
                const isSelected = i === selectedOffset;
                const slotHasSchedule = SCHEDULE_OFFSETS.includes(i);

                return (
                  <button
                    key={i}
                    type="button"
                    className={`call-date-chip${
                      slotHasSchedule ? " has-schedule" : ""
                    }${isSelected ? " is-selected" : ""}`}
                    onClick={() => setSelectedOffset(i)}
                  >
                    <span className="call-date-caption">
                      {isToday ? "今日" : " "}
                    </span>
                    <span className="call-date-num">
                      {d.getDate()}
                    </span>
                    <span className="call-date-weekday">
                      {WEEKDAY_JA[i]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="call-schedule-card">
            <h1>
              {selectedDate.getMonth() + 1}月{selectedDate.getDate()}
              日　話せる時間
            </h1>

            {hasSchedule ? (
              <>
                <ul className="call-schedule-list">
                  <li>20:00 〜 21:00</li>
                </ul>

                <span className="call-schedule-btn call-schedule-btn-secondary">
                  追加で登録する
                </span>
              </>
            ) : (
              <>
                <p className="call-schedule-empty">
                  まだ予定がありません
                </p>

                <span className="call-schedule-btn">
                  新しく登録する
                </span>
              </>
            )}
          </section>

          <div className="call-footer-actions">
            {hasSchedule && (
              <Link
                href={`/call/who?date=${toDateKey(selectedDate)}`}
                className="call-next-btn"
              >
                次へ
              </Link>
            )}

            <div className="call-back-btn-wrap">
              <button
                type="button"
                className="call-back-btn"
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
