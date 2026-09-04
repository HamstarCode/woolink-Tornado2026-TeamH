"use client";

// 文章中の動画URLを、交換日記と履歴の双方で再生できる形にする。
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
