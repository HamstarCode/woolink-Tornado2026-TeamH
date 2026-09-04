"use client";

import { useCallback, useEffect, useState } from "react";
import WoolinkScreen from "@/components/WoolinkScreen";
import "./notifications.css";

type FriendRequest = {
  id: string;
  createdAt: string;
  user?: { id: string; name: string; avatar_url: string | null };
};

export default function NotificationsPage() {
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/friend-requests");
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error ?? "お知らせを読み込めませんでした。");
    else {
      setIncoming(body.incoming ?? []);
      setOutgoing(body.outgoing ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // The request resolves asynchronously; state is never changed during the effect setup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const respond = async (id: string, action: "accept" | "decline") => {
    setWorkingId(id);
    setError("");
    const response = await fetch(`/api/friend-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await response.json().catch(() => ({}));
    setWorkingId(null);
    if (!response.ok) {
      setError(body.error ?? "申請を更新できませんでした。");
      return;
    }
    setIncoming((current) => current.filter((item) => item.id !== id));
  };

  return (
    <WoolinkScreen title="お知らせ">
      {loading ? <p className="notification-empty">読み込み中...</p> : (
        <>
          <section className="notification-section">
            <h2>フレンド申請</h2>
            {incoming.length === 0 ? <p className="notification-empty">新しいフレンド申請はありません。</p> : incoming.map((item) => (
              <article className="friend-request-card" key={item.id}>
                <div className="friend-request-avatar">
                  {item.user?.avatar_url ? (
                    // Profile images may be hosted by the user's OAuth provider.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.user.avatar_url} alt="" />
                  ) : (item.user?.name ?? "?").slice(0, 1)}
                </div>
                <div className="friend-request-body">
                  <strong>{item.user?.name ?? "交換日記の相手"}</strong>
                  <span>フレンド申請が届きました</span>
                </div>
                <div className="friend-request-actions">
                  <button disabled={workingId === item.id} onClick={() => respond(item.id, "accept")}>承認</button>
                  <button className="is-secondary" disabled={workingId === item.id} onClick={() => respond(item.id, "decline")}>拒否</button>
                </div>
              </article>
            ))}
          </section>
          {outgoing.length > 0 && (
            <section className="notification-section outgoing-section">
              <h2>申請中</h2>
              {outgoing.map((item) => (
                <div className="outgoing-request" key={item.id}>
                  <span>{item.user?.name ?? "交換日記の相手"}</span><small>承認待ち</small>
                </div>
              ))}
            </section>
          )}
          {error && <p className="notification-error">{error}</p>}
        </>
      )}
    </WoolinkScreen>
  );
}
