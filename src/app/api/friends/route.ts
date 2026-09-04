import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("friend_id")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const friendIds = (friendships ?? []).map((f) => f.friend_id as string);
  if (friendIds.length === 0) return NextResponse.json({ friends: [] });

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, nickname")
    .in("id", friendIds);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({
    friends: (profiles ?? []).map((profile) => ({
      id: profile.id,
      name: profile.nickname,
      avatar_url: null,
    })),
  });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    friendId?: unknown;
  } | null;
  if (typeof body?.friendId !== "string" || !body.friendId) {
    return NextResponse.json({ error: "解除する相手が指定されていません。" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("remove_friend", {
    p_friend_id: body.friendId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "フレンド関係が見つかりません。" }, { status: 404 });
  return NextResponse.json({ status: "removed" });
}
