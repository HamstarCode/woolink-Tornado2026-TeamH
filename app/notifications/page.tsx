"use client";

import { useRouter } from "next/navigation";

export default function PlaceholderPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
        >
          ← 戻る
        </button>
      </div>
    </main>
  );
}