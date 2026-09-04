import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RequestRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const targetUserId = new URL(request.url).searchParams.get("targetUserId");

  if (targetUserId) {
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id")
      .eq("user_id", user.id)
      .eq("friend_id", targetUserId)
      .maybeSingle();
    if (friendship) return NextResponse.json({ status: "friends" });

    const { data: friendRequest, error } = await supabase
      .from("friend_requests")
      .select("id, sender_id, receiver_id")
      .eq("status", "pending")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!friendRequest) return NextResponse.json({ status: "none" });
    return NextResponse.json({
      status: friendRequest.sender_id === user.id ? "outgoing" : "incoming",
      requestId: friendRequest.id,
    });
  }

  const { data: rows, error } = await supabase
    .from("friend_requests")
    .select("id, sender_id, receiver_id, created_at")
    .eq("status", "pending")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const requests = (rows ?? []) as RequestRow[];
  const otherIds = [...new Set(requests.map((row) => row.sender_id === user.id ? row.receiver_id : row.sender_id))];
  const { data: profiles, error: profileError } = otherIds.length
    ? await supabase.from("profiles").select("id, nickname").in("id", otherIds)
    : { data: [], error: null };
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, {
    id: profile.id,
    name: profile.nickname,
    avatar_url: null,
  }]));
  const withProfiles = requests.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    user: profileMap.get(row.sender_id === user.id ? row.receiver_id : row.sender_id),
  }));

  return NextResponse.json({
    incoming: withProfiles.filter((_, index) => requests[index].receiver_id === user.id),
    outgoing: withProfiles.filter((_, index) => requests[index].sender_id === user.id),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    targetUserId?: string;
    publicUserId?: string;
  };
  const targetUserId = body.targetUserId;
  const publicUserId = body.publicUserId?.trim().toUpperCase();
  if (!targetUserId && !publicUserId) {
    return NextResponse.json({ error: "申請先が必要です。" }, { status: 400 });
  }
  if (publicUserId) {
    const { data, error } = await supabase.rpc("send_friend_request_by_public_id", {
      p_public_user_id: publicUserId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const result = data?.[0];
    return NextResponse.json(
      { status: result?.result_status ?? "outgoing", requestId: result?.request_id ?? null },
      { status: result?.result_status === "outgoing" ? 201 : 200 },
    );
  }
  if (!targetUserId) return NextResponse.json({ error: "申請先が必要です。" }, { status: 400 });
  if (targetUserId === user.id) return NextResponse.json({ error: "自分自身には申請できません。" }, { status: 400 });

  const { data, error } = await supabase.rpc("send_friend_request", {
    p_target_user_id: targetUserId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const result = data?.[0];
  const resultStatus = result?.result_status === "outgoing_existing"
    ? "outgoing"
    : result?.result_status ?? "outgoing";
  return NextResponse.json(
    { status: resultStatus, requestId: result?.request_id ?? null },
    { status: result?.result_status === "outgoing" ? 201 : 200 },
  );
}
