"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { savePrivateDiary } from "@/lib/diaryExchange";
import "./movie.css";

const VIDEO_SERVICE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL
  ?? "https://woolink-video-service.onrender.com";

type GeneratedVideo = { videoUrl: string };

const POLL_INTERVAL_MS = 2_000;
const GENERATION_TIMEOUT_MS = 5 * 60_000;

async function waitForVideo(jobId: string): Promise<string> {
  const deadline = Date.now() + GENERATION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const response = await fetch(`${VIDEO_SERVICE_URL}/jobs/${encodeURIComponent(jobId)}`, {
      cache: "no-store",
    });
    const data = await response.json().catch(() => null) as {
      status?: string;
      videoUrl?: string;
      error?: string;
    } | null;
    if (!response.ok) throw new Error(data?.error || "動画の生成状況を確認できませんでした。");
    if (data?.status === "failed") throw new Error(data.error || "動画生成に失敗しました。");
    if (data?.status === "completed" && data.videoUrl) return data.videoUrl;
  }
  throw new Error("動画生成に時間がかかっています。もう一度お試しください。");
}

export default function DiaryMoviePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [generated, setGenerated] = useState<GeneratedVideo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    previewUrlsRef.current.forEach(URL.revokeObjectURL);
  }, []);

  const selectPhotos = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 10);
    previewUrlsRef.current.forEach(URL.revokeObjectURL);
    const nextPreviews = selected.map((photo) => URL.createObjectURL(photo));
    previewUrlsRef.current = nextPreviews;
    setPhotos(selected);
    setPreviews(nextPreviews);
    setGenerated(null);
    setError(selected.length ? "" : "写真を選択してください。");
  };

  const generate = async () => {
    if (!photos.length || isGenerating) return;
    setIsGenerating(true);
    setGenerated(null);
    setError("");
    try {
      const form = new FormData();
      photos.forEach((photo) => form.append("photos", photo));
      const response = await fetch(`${VIDEO_SERVICE_URL}/generate-async`, {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => null) as {
        jobId?: string;
        error?: string;
      } | null;
      if (!response.ok || !data?.jobId) {
        throw new Error(data?.error || "動画生成に失敗しました。");
      }
      const videoPath = await waitForVideo(data.jobId);
      // ハッカソン中は動画本体をWoolinkへ再アップロードせず、RenderのURLをそのまま交換する。
      const remoteVideoUrl = new URL(videoPath, VIDEO_SERVICE_URL).toString();
      setGenerated({ videoUrl: remoteVideoUrl });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "動画生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  const persistVideo = async () => {
    if (!generated) throw new Error("生成した動画がありません。");
    return generated.videoUrl;
  };

  const proceedToExchange = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      const videoUrl = await persistVideo();
      localStorage.setItem("draftDiary", videoUrl);
      router.push("/diary/confirm");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "動画を保存できませんでした。");
      setIsSaving(false);
    }
  };

  const saveForMyself = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      const videoUrl = await persistVideo();
      await savePrivateDiary(videoUrl);
      localStorage.removeItem("draftDiary");
      router.replace("/diary");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "思い出を保存できませんでした。");
      setIsSaving(false);
    }
  };

  return (
    <main className="movie-page">
      <div className="movie-phone">
        <button className="movie-back" type="button" onClick={() => router.back()} disabled={isGenerating || isSaving}>← 戻る</button>

        <header className="movie-heading">
          <h1>写真で交換日記</h1>
          <p>写真からショート風動画を作ります</p>
        </header>

        <input
          ref={inputRef}
          className="movie-file-input"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => selectPhotos(event.target.files)}
        />
        <button className="movie-file-button" type="button" onClick={() => inputRef.current?.click()} disabled={isGenerating || isSaving}>
          {photos.length ? `${photos.length}枚の写真を選択中` : "写真を選ぶ（最大10枚）"}
        </button>

        {previews.length > 0 && (
          <div className="movie-photo-list" aria-label="選択した写真">
            {previews.map((src, index) => (
              <Image key={src} src={src} width={72} height={72} unoptimized alt={`選択した写真 ${index + 1}`} />
            ))}
          </div>
        )}

        <button className="movie-generate" type="button" onClick={() => void generate()} disabled={!photos.length || isGenerating || isSaving}>
          {isGenerating ? "動画を生成しています..." : generated ? "もう一度生成する" : "動画を生成する！"}
        </button>

        {isGenerating && (
          <p className="movie-wait">
            写真から動画を生成しています。通常2〜3分かかります。このままお待ちください。
          </p>
        )}

        {generated && (
          <section className="movie-result">
            <video
              src={generated.videoUrl}
              controls
              playsInline
              preload="metadata"
              onError={() => setError("保存した動画を読み込めませんでした。もう一度生成してください。")}
            />
            <h2>動画が完成しました！</h2>
            <p>この動画を交換するか、自分だけの思い出として残せます。</p>
            <button className="movie-primary" type="button" onClick={() => void proceedToExchange()} disabled={isSaving}>
              {isSaving ? "保存しています..." : "交換へ進む"}
            </button>
            <button className="movie-secondary" type="button" onClick={() => void saveForMyself()} disabled={isSaving}>
              思い出として残す
            </button>
          </section>
        )}

        {error && <p className="movie-error" role="alert">{error}</p>}
      </div>
    </main>
  );
}
