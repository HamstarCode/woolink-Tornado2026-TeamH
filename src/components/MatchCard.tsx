"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import CallPanel from "@/components/CallPanel";
import { formatRange } from "@/lib/slots";
import { formatDateJa, slotDateTime } from "@/lib/date";
import { useCall } from "@/lib/webrtc/useCall";
import type { MatchWithFriend } from "@/types/db";

export default function MatchCard({ match }: { match: MatchWithFriend }) {
  const range = formatRange(match.overlap_start, match.overlap_end);
  const scheduledLabel = `${formatDateJa(match.date)} ${range}`;

  // どちらの参加者が「自分」かは match 行から一意に決まる(friend が相手なので、
  // user_a / user_b のうち friend.id でない方が自分)。
  const meId = match.user_a === match.friend.id ? match.user_b : match.user_a;
  const call = useCall({ matchId: match.id, meId, peerId: match.friend.id });

  // ── マッチした時間帯に合わせた通知・強調 ──────────────────────────────
  const startsAt = useMemo(
    () => slotDateTime(match.date, match.overlap_start).getTime(),
    [match.date, match.overlap_start]
  );
  const endsAt = useMemo(
    () => slotDateTime(match.date, match.overlap_end + 1).getTime(),
    [match.date, match.overlap_end]
  );

  // 開始/終了時刻ちょうどに再レンダーして「いま話せる時間」表示を切り替える。
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timers: number[] = [];
    const at = (t: number) => {
      const delay = t - Date.now();
      if (delay > 0 && delay < 2_147_483_647) {
        timers.push(window.setTimeout(() => setNowMs(Date.now()), delay + 250));
      }
    };
    at(startsAt);
    at(endsAt);
    return () => timers.forEach((id) => clearTimeout(id));
  }, [startsAt, endsAt]);

  const isUpcoming = nowMs < startsAt;
  const isActive = nowMs >= startsAt && nowMs < endsAt;
  const isPast = nowMs >= endsAt;
  // A match itself is mutual consent, so both users may start early. The
  // selected range remains the suggested time and is still used for notices.
  const canCall = !isPast;

  // OS 通知（任意）。ユーザーが「時間になったら通知」を押したときだけ許可を求める。
  const [notifyArmed, setNotifyArmed] = useState(false);
  const armNotify = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const perm =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    if (perm === "granted") setNotifyArmed(true);
  };

  useEffect(() => {
    if (!notifyArmed) return;
    const delay = startsAt - Date.now();
    if (delay <= 0 || delay > 2_147_483_647) return;
    const key = `wl_notified_${match.id}`;
    const id = window.setTimeout(() => {
      try {
        if (localStorage.getItem(key)) return;
        new Notification("Woolink", {
          body: `${match.friend.name}さんと話せる時間です 📞`,
        });
        localStorage.setItem(key, "1");
      } catch {
        // 通知が出せなくても致命的ではない
      }
    }, delay);
    return () => clearTimeout(id);
  }, [notifyArmed, startsAt, match.id, match.friend.name]);

  const callButtonLabel =
    call.phase !== "idle"
      ? "通話中…"
      : canCall
        ? "📞 今すぐ通話する"
        : "通話時間終了";

  return (
    <div
      className={[
        "rounded-2xl bg-card p-5 space-y-4 border",
        isActive ? "border-accent ring-2 ring-accent/30" : "border-accent/20",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <Avatar src={match.friend.avatar_url} name={match.friend.name} size={48} />
        <div>
          <p className="text-xs text-accent">
            🌙 Match{match.preferred && <span className="ml-1.5 text-moon/50">⭐ 優先</span>}
          </p>
          <p className="text-moon font-medium">{match.friend.name}さんも話したいみたい</p>
        </div>
      </div>

      <div className="rounded-xl bg-night-deep/60 px-4 py-3 text-center">
        <p className="text-lg font-semibold text-moon tabular-nums">{range}</p>
        <p className="text-xs text-moon/50 mt-0.5">
          {formatDateJa(match.date)}・2人とも話せる時間
        </p>
      </div>

      {isActive && (
        <p className="text-xs text-accent text-center -mt-1">🌙 いま、話せる時間です</p>
      )}
      {isUpcoming && (
        <p className="text-xs text-moon/50 text-center -mt-1">
          {range} に話す予定
        </p>
      )}
      {isPast && (
        <p className="text-xs text-moon/50 text-center -mt-1">この通話時間は終了しました</p>
      )}

      <button
        onClick={call.start}
        disabled={call.phase !== "idle" || !canCall}
        className={[
          "w-full rounded-xl text-sm font-medium py-3 disabled:opacity-40 disabled:cursor-not-allowed",
          canCall ? "bg-accent text-night" : "bg-accent/90 text-night",
        ].join(" ")}
      >
        {callButtonLabel}
      </button>

      {isUpcoming && (
        <button
          onClick={armNotify}
          disabled={notifyArmed}
          className="w-full rounded-xl bg-white/5 text-moon/70 text-xs py-2.5 disabled:opacity-60"
        >
          {notifyArmed ? "⏰ 時間になったら通知します" : "⏰ 時間になったら通知する"}
        </button>
      )}

      <CallPanel
        call={call}
        peerName={match.friend.name}
        peerAvatarUrl={match.friend.avatar_url}
        scheduledLabel={scheduledLabel}
      />
    </div>
  );
}
