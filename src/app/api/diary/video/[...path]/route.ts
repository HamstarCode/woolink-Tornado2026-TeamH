import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const pathParts = (await params).path;
  const objectPath = pathParts.join("/");
  if (pathParts.length !== 2 || pathParts[0] !== user.id) {
    const { data: readableSubmission } = await supabase
      .from("submissions")
      .select("id")
      .eq("diary", request.url)
      .limit(1)
      .maybeSingle();
    if (!readableSubmission) return new Response("Forbidden", { status: 403 });
  }

  const { data, error } = await supabase.storage.from("diary-videos").download(objectPath);
  if (error || !data) return new Response("Video not found", { status: 404 });

  const bytes = await data.arrayBuffer();
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (match) {
      const start = Number(match[1]);
      const end = match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
      if (start <= end && start < bytes.byteLength) {
        return new Response(bytes.slice(start, end + 1), {
          status: 206,
          headers: {
            "Content-Type": "video/mp4",
            "Accept-Ranges": "bytes",
            "Content-Range": `bytes ${start}-${end}/${bytes.byteLength}`,
            "Content-Length": String(end - start + 1),
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
    }
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.byteLength}` } });
  }

  return new Response(bytes, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(bytes.byteLength),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
