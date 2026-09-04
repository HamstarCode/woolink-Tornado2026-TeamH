import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const VIDEO_SERVICE_URL = process.env.VIDEO_SERVICE_URL
  ?? process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL
  ?? "https://woolink-video-service.onrender.com";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "ログインが必要です。" }, { status: 401 });

  const body = await request.json().catch(() => null) as { videoUrl?: unknown } | null;
  if (typeof body?.videoUrl !== "string") {
    return Response.json({ error: "動画URLがありません。" }, { status: 400 });
  }

  const source = new URL(body.videoUrl, VIDEO_SERVICE_URL);
  if (
    source.origin !== new URL(VIDEO_SERVICE_URL).origin
    || !source.pathname.startsWith("/output/")
    || !source.pathname.endsWith(".mp4")
  ) {
    return Response.json({ error: "保存できない動画URLです。" }, { status: 400 });
  }

  const videoResponse = await fetch(source, { signal: AbortSignal.timeout(45_000) });
  if (!videoResponse.ok) {
    return Response.json({ error: "生成動画を取得できませんでした。" }, { status: 502 });
  }

  const video = await videoResponse.arrayBuffer();
  const path = `${user.id}/${randomUUID()}.mp4`;
  const { error: uploadError } = await supabase.storage
    .from("diary-videos")
    .upload(path, video, { contentType: "video/mp4", upsert: false });

  if (uploadError) {
    return Response.json({ error: `動画を保存できませんでした: ${uploadError.message}` }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const playbackPath = path.split("/").map(encodeURIComponent).join("/");
  return Response.json({ videoUrl: `${origin}/api/diary/video/${playbackPath}` });
}
