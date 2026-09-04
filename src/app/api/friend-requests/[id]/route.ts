import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { action?: "accept" | "decline" };
  if (body.action !== "accept" && body.action !== "decline") {
    return NextResponse.json({ error: "操作が正しくありません。" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("respond_friend_request", {
    p_request_id: id,
    p_action: body.action,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ status: data });
}
