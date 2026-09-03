"use client";

import { useState } from "react";

export default function OnboardingPage() {
  const [nickname, setNickname] = useState("");

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">
          Woolinkへようこそ
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          まずはプロフィールを作りましょう。
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <label
            htmlFor="nickname"
            className="text-sm font-medium text-gray-700"
          >
            ニックネーム
          </label>

        <input
        id="nickname"
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="ニックネームを入力"
        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-400"
        />

          <div className="mt-8">
            <h2 className="text-sm font-medium text-gray-700">
              性格診断
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              あなたの性格について簡単な質問に答えてください。
            </p>

            <button
            disabled={nickname.trim() === ""}
            className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
            性格診断を始める
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}