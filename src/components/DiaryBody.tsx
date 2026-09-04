"use client";

// 写真→動画アプリ(video-diary, 別デプロイのExpress/FFmpegサービス)は
// この交換日記アプリとは別スタックなので、生成した動画そのものを直接
// 投稿する手段がない。代わりに「動画のURLをコピーして日記本文に貼り付ける」
// 導線にし(/diary/select の「写真から」タイル→video-diaryで生成→URLコピー
// →この日記に貼り付け)、表示側で本文中の動画URLを検出して <video> として
// 埋め込み再生する。これで「動画をWebアプリ内で友達と共有したい」に対応する。
//
// 検出対象は video-diary の出力URL(.mp4 で終わるURL)全般。ドメインを
// 決め打ちにしないのは、Render/Vercel のURLが変わっても壊れないように。
const VIDEO_URL_PATTERN = /https?:\/\/\S+\.mp4(?:\?\S*)?/gi;

export default function DiaryBody({ text }: { text: string | null | undefined }) {
  if (!text) return null;

  const videoUrls = Array.from(new Set(text.match(VIDEO_URL_PATTERN) ?? []));
  const textWithoutVideoLinks = videoUrls
    .reduce((acc, url) => acc.replace(url, "").trim(), text)
    .trim();

  return (
    <>
      {textWithoutVideoLinks && <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{textWithoutVideoLinks}</p>}
      {videoUrls.map((url) => (
        <video
          key={url}
          src={url}
          controls
          playsInline
          style={{
            display: "block",
            width: "100%",
            maxWidth: 320,
            borderRadius: 12,
            marginTop: textWithoutVideoLinks ? 10 : 0,
            background: "#000",
          }}
        />
      ))}
    </>
  );
}
