"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WoolinkScreen from "@/components/WoolinkScreen";
import "./friends.css";

type Profile = { id: string; name: string; avatar_url: string | null };
type FriendRequest = { id: string; user?: Profile };

export default function FriendsPage() {
  const [tab, setTab] = useState<"requests" | "outgoing" | "friends">("requests");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [publicUserId, setPublicUserId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [requestResponse, friendResponse] = await Promise.all([
      fetch("/api/friend-requests"),
      fetch("/api/friends"),
    ]);
    const requestBody = await requestResponse.json().catch(() => ({}));
    const friendBody = await friendResponse.json().catch(() => ({}));
    if (!requestResponse.ok || !friendResponse.ok) {
      setError(requestBody.error ?? friendBody.error ?? "フレンド情報を読み込めませんでした。");
    } else {
      setRequests(requestBody.incoming ?? []);
      setOutgoing(requestBody.outgoing ?? []);
      setFriends(friendBody.friends ?? []);
      if (!(requestBody.incoming ?? []).length) setTab("friends");
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const respond = async (id: string, action: "accept" | "decline") => {
    setWorkingId(id); setError("");
    const response = await fetch(`/api/friend-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error ?? "申請を更新できませんでした。");
    else await load();
    setWorkingId(null);
  };

  const addByPublicId = async () => {
    const normalizedId = publicUserId.trim().toUpperCase();
    if (!normalizedId || adding) return;
    setAdding(true); setError(""); setAddMessage("");
    const response = await fetch("/api/friend-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicUserId: normalizedId }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error ?? "フレンド申請を送れませんでした。");
    } else {
      setPublicUserId("");
      setAddMessage(body.status === "friends" ? "すでにフレンドです。" : body.status === "incoming" ? "この相手から申請が届いています。" : body.status === "outgoing_existing" ? "フレンド申請済みです。" : "フレンド申請を送りました。");
      await load();
      if (body.status === "outgoing" || body.status === "outgoing_existing") setTab("outgoing");
    }
    setAdding(false);
  };

  return <WoolinkScreen title="フレンド" back="/home">
    <section className="friend-add-box">
      <label htmlFor="friend-public-id">公開IDでフレンドを追加</label>
      <div>
        <input
          id="friend-public-id"
          value={publicUserId}
          onChange={(event) => setPublicUserId(event.target.value.toUpperCase())}
          onKeyDown={(event) => { if (event.key === "Enter") void addByPublicId(); }}
          placeholder="公開IDを入力"
          autoComplete="off"
        />
        <button disabled={!publicUserId.trim() || adding} onClick={() => void addByPublicId()}>
          {adding ? "送信中..." : "申請する"}
        </button>
      </div>
      {addMessage && <p>{addMessage}</p>}
    </section>
    <div className="friend-tabs" role="tablist">
      <button className={tab === "requests" ? "is-active" : ""} onClick={() => setTab("requests")}>
        届いた申請{requests.length > 0 && <span>{requests.length}</span>}
      </button>
      <button className={tab === "outgoing" ? "is-active" : ""} onClick={() => setTab("outgoing")}>
        申請中{outgoing.length > 0 && <span>{outgoing.length}</span>}
      </button>
      <button className={tab === "friends" ? "is-active" : ""} onClick={() => setTab("friends")}>フレンド一覧</button>
    </div>

    {loading ? <p className="friends-empty">読み込み中...</p> : tab === "requests" ? <>
      {requests.length === 0 ? <p className="friends-empty">新しい申請はありません。</p> : requests.map((item) => (
        <article className="friend-list-row" key={item.id}>
          <Avatar profile={item.user} />
          <strong>{item.user?.name ?? "交換日記の相手"}</strong>
          <div className="friend-request-buttons">
            <button disabled={workingId === item.id} onClick={() => respond(item.id, "accept")}>承認</button>
            <button className="is-reject" disabled={workingId === item.id} onClick={() => respond(item.id, "decline")}>拒否</button>
          </div>
        </article>
      ))}
    </> : tab === "outgoing" ? <>
      {outgoing.length === 0 ? <p className="friends-empty">申請中の相手はいません。</p> : (
        <section className="friend-outgoing">{outgoing.map((item) => <p key={item.id}><span>{item.user?.name ?? "相手"}</span><small>承認待ち</small></p>)}</section>
      )}
    </> : <>
      {friends.length === 0 ? <p className="friends-empty">まだフレンドはいません。</p> : friends.map((friend) => (
        <article className="friend-list-row is-friend" key={friend.id}>
          <Avatar profile={friend} /><strong>{friend.name}</strong>
        </article>
      ))}
      {friends.length > 0 && <Link className="friends-call-link" href="/call">日調でフレンドを選ぶ</Link>}
    </>}
    {error && <p className="friends-error">{error}</p>}
  </WoolinkScreen>;
}

function Avatar({ profile }: { profile?: Profile }) {
  return <span className="friend-list-avatar">{profile?.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={profile.avatar_url} alt="" />
  ) : (profile?.name ?? "?").slice(0, 1)}</span>;
}
