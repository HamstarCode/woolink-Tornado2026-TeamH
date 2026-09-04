"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDiaryHistory, type DiaryHistoryEntry } from "@/lib/diaryRoom";
import "./history.css";

const getTokyoDate = (iso: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(iso));

const getDateParts = (iso: string) => {
  const parts = getTokyoDate(iso);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: value("year"),
    date: `${value("month")}/${value("day")}`,
  };
};

export default function DiaryHistoryPage() {
  const [entries, setEntries] = useState<DiaryHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await getDiaryHistory();
        if (active) setEntries(data);
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "日記履歴を取得できませんでした。",
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
  }, []);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, DiaryHistoryEntry[]>();

    entries.forEach((entry) => {
      const { year } = getDateParts(entry.exchangeStartedAt);
      groups.set(year, [...(groups.get(year) ?? []), entry]);
    });

    return [...groups.entries()];
  }, [entries]);

  return (
    <main className="history-page">
      <div className="history-phone">
        <div className="history-heading-row">
          <h1>これまでの日記</h1>
          <Link href="/diary">戻る</Link>
        </div>

        {isLoading ? (
          <p className="history-message">日記を読み込んでいます...</p>
        ) : error ? (
          <p className="history-message history-error" role="alert">{error}</p>
        ) : entries.length === 0 ? (
          <p className="history-message">まだ交換した日記はありません。</p>
        ) : (
          groupedEntries.map(([year, yearEntries]) => (
            <section className="history-year" key={year}>
              <h2>{year}年</h2>
              <div className="history-year-rule" />

              <div className="history-grid">
                {yearEntries.map((entry) => {
                  const { date } = getDateParts(entry.exchangeStartedAt);

                  return (
                    <Link
                      className="history-diary-card"
                      href={`/diary/history/${entry.submissionId}`}
                      key={entry.submissionId}
                      aria-label={entry.partnerNickname
                        ? `${entry.partnerNickname}さんとの${date}の交換日記`
                        : entry.submissionKind === "private"
                          ? `${date}の自分用の日記`
                        : `${date}の提出日記（交換相手を探しています）`}
                    >
                      <span className="history-card-name">
                        {entry.partnerNickname ?? (entry.submissionKind === "private" ? "わたしの思い出" : "交換相手を探しています")}
                      </span>
                      <span className="history-card-line" />
                      <span className="history-card-status">
                        {entry.roomId ? "交換日記" : entry.submissionKind === "private" ? "自分用に保存" : "提出済み"}
                      </span>
                      <span className="history-card-date">{date}</span>
                      <span className="history-card-line" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
