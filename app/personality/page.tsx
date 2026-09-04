"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QUESTION_BANK } from "./data-questions";
import { BALANCE_TYPE, TYPE_DATA } from "./data-types";
import { supabase } from "@/lib/supabase";
import "./personality.css";

type Question = {
  id: string;
  axis: "agency" | "candor" | "warmth" | "social" | "energy";
  prompt: string;
  left: string;
  right: string;
};

type EnergyDir = "fast" | "slow";
type Strength = "weak" | "clear" | "strong";

type Result = {
  axisKey: string | null;
  energyDir: EnergyDir;
  amplitude: number;
  theta0: number;
  strength: Strength;
};

type TypeData = {
  name: string;
  energyLabel?: string;
  tagline: string;
  weak: string;
  clear: string;
  strong: string;
  compat: string;
  bestMatch?: string;
};

const questions = QUESTION_BANK as Question[];
const typeData = TYPE_DATA as Record<string, TypeData>;
const balanceType = BALANCE_TYPE as TypeData;

const ANGLES: Record<string, number> = {
  PA: 0,
  BC: 45,
  DE: 90,
  FG: 135,
  HI: 180,
  JK: 225,
  LM: 270,
  NO: 315,
};

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateResult(answers: Record<string, number>): Result {
  const byAxis: Record<string, number[]> = {
    agency: [],
    candor: [],
    warmth: [],
    social: [],
    energy: [],
  };

  questions.forEach((question) => {
    byAxis[question.axis].push(answers[question.id]);
  });

  const d1 = average(byAxis.agency) - 3;
  const d2 = average(byAxis.candor) - 3;
  const d3 = average(byAxis.warmth) - 3;
  const d4 = average(byAxis.social) - 3;

  const scores: Record<string, number> = {
    PA: -d1,
    HI: d1,
    BC: -d2,
    JK: d2,
    DE: -d3,
    LM: d3,
    FG: -d4,
    NO: d4,
  };

  let x = 0;
  let y = 0;

  Object.entries(scores).forEach(([key, score]) => {
    const rad = (ANGLES[key] * Math.PI) / 180;

    x += score * Math.cos(rad);
    y += score * Math.sin(rad);
  });

  x *= 2 / 8;
  y *= 2 / 8;

  const amplitude = Math.sqrt(x * x + y * y);

  let theta0 = (Math.atan2(y, x) * 180) / Math.PI;

  if (theta0 < 0) {
    theta0 += 360;
  }

  const energyAverage = average(byAxis.energy);

  const energyDir: EnergyDir =
    energyAverage < 2.5 ? "fast" : "slow";

  const maxDeviation = Math.max(
    Math.abs(d1),
    Math.abs(d2),
    Math.abs(d3),
    Math.abs(d4)
  );

  const strength: Strength =
    maxDeviation < 0.8
      ? "weak"
      : maxDeviation < 1.5
        ? "clear"
        : "strong";

  const AMPLITUDE_THRESHOLD = 0.5;

  let axisKey: string | null = null;

  if (amplitude >= AMPLITUDE_THRESHOLD) {
    let best: string | null = null;
    let bestDistance = Infinity;

    Object.entries(ANGLES).forEach(([key, angle]) => {
      let difference = Math.abs(theta0 - angle);

      difference = Math.min(
        difference,
        360 - difference
      );

      if (difference < bestDistance - 1e-9) {
        bestDistance = difference;
        best = key;
      } else if (
        Math.abs(difference - bestDistance) < 1e-9 &&
        best !== null &&
        angle < ANGLES[best]
      ) {
        best = key;
      }
    });

    axisKey = best;
  }

  return {
    axisKey,
    energyDir,
    amplitude,
    theta0,
    strength,
  };
}

export default function PersonalityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToProfile = searchParams.get("return") === "/profile";

  const [screen, setScreen] = useState<
    "quiz" | "calculating" | "result"
  >("quiz");

  const [order] = useState<Question[]>(questions);
  const [answers, setAnswers] = useState<
    Record<string, number>
  >({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const advanceTimerRef = useRef<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  // 結果の詳細表示
  const [showDetails, setShowDetails] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const answeredCount = Object.keys(answers).length;

  const progress = useMemo(() => {
    if (order.length === 0) return 0;

    return (answeredCount / order.length) * 100;
  }, [answeredCount, order.length]);

  useEffect(() => () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
    }
  }, []);

  const selectAnswer = (
    questionId: string,
    value: number
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));

    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
    }

    advanceTimerRef.current = window.setTimeout(() => {
      if (currentQuestionIndex < order.length - 1) {
        setCurrentQuestionIndex((previous) => previous + 1);
      }
      advanceTimerRef.current = null;
    }, 180);
  };

  const showPreviousQuestion = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setCurrentQuestionIndex((previous) => Math.max(0, previous - 1));
  };

  const handleCalculate = () => {
    if (answeredCount !== order.length) return;

    setScreen("calculating");
  };

  // =========================
  // 診断結果を計算
  // =========================
  useEffect(() => {
    if (screen !== "calculating") return;

    const timer = window.setTimeout(() => {
      const calculated = calculateResult(answers);

      setResult(calculated);
      setSaveError("");
      setScreen("result");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [screen, answers]);

  const savePersonality = async () => {
    if (!result || isSaving) return;

    setIsSaving(true);
    setSaveError("");

    const { data: authData, error: userError } = await supabase.auth.getUser();
    if (userError || !authData.user) {
      setSaveError("ログイン情報を取得できませんでした。");
      setIsSaving(false);
      return;
    }

    const personalityType = result.axisKey
      ? `${result.axisKey}_${result.energyDir}`
      : "balance";
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ personality_type: personalityType })
      .eq("id", authData.user.id);

    if (updateError) {
      console.error("性格タイプ保存エラー:", updateError.message);
      setSaveError("診断結果の保存に失敗しました。");
      setIsSaving(false);
      return;
    }

    router.push(returnToProfile ? "/profile" : "/home");
  };

  const isBalance = result ? !result.axisKey : false;

  const resultType = result
    ? isBalance
      ? balanceType
      : typeData[
          `${result.axisKey}_${result.energyDir}`
        ]
    : null;
  const currentQuestion = order[currentQuestionIndex];

  // =========================
  // 診断
  // =========================
  if (screen === "quiz") {
    return (
      <main className="personality-page personality-quiz-page">
        <div className="personality-phone">
          <header className="personality-progress-header">
            <div className="personality-progress-label">
              <button type="button" disabled={currentQuestionIndex === 0}
                onClick={showPreviousQuestion}>
                ← 前の質問
              </button>
              <span>{Math.min(currentQuestionIndex + 1, order.length)}/{order.length}</span>
            </div>
            <div className="personality-progress-track">
              <div
                className="personality-progress-value"
                style={{ width: `${progress}%` }}
              />
            </div>
          </header>

          {currentQuestion ? (
            <section className="personality-question-card" key={currentQuestion.id}>
              <p className="personality-question-number">質問 {currentQuestionIndex + 1}</p>
              <h1>{currentQuestion.prompt}</h1>
              <div className="personality-answer-labels">
                <span>{currentQuestion.left}</span>
                <span>{currentQuestion.right}</span>
              </div>
              <div className="personality-scale">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" aria-label={`5段階中${value}`}
                    aria-pressed={answers[currentQuestion.id] === value}
                    className={answers[currentQuestion.id] === value ? "is-selected" : ""}
                    onClick={() => selectAnswer(currentQuestion.id, value)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <p className="personality-loading">ロード中...</p>
          )}

          {currentQuestionIndex === order.length - 1 && order.length > 0 && (
          <div className="personality-submit-wrap">
            <button
              type="button"
              onClick={handleCalculate}
              disabled={answeredCount !== order.length}
            >
              {answeredCount === order.length ? "診断する" : "回答を選んでください"}
            </button>
          </div>
          )}
        </div>
      </main>
    );
  }

  // =========================
  // 診断中
  // =========================
  if (screen === "calculating") {
    return (
      <main className="personality-page personality-calculating">
        <div>
          <span className="personality-spinner" />
          <p>
            あなたの対人スタイルを診断しています…
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // 結果
  // =========================
  if (
    screen === "result" &&
    result &&
    resultType
  ) {
    const accentColor =
      result.energyDir === "slow" && !isBalance
        ? "text-[#4fb3a6]"
        : "text-[#ff8a63]";

    const accentBorder =
      result.energyDir === "slow" && !isBalance
        ? "border-[#cce9e3]"
        : "border-[#efe1cd]";

    return (
      <main className="personality-page personality-result-page">
        <div className="personality-result-phone">
          {/* 結果ヘッダー */}
          <section className="personality-result-hero">
            <p
              className={`text-xs font-bold tracking-[0.14em] ${accentColor}`}
            >
              {isBalance
                ? "バランスタイプ"
                : resultType.energyLabel}
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              {resultType.name}
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#93857a]">
              {resultType.tagline}
            </p>

            <div
              className={`mx-auto mt-6 flex h-28 w-28 items-center justify-center rounded-full border ${accentBorder} ${
                result.energyDir === "slow" &&
                !isBalance
                  ? "bg-gradient-to-br from-[#dcf3ee] to-[#fbeee0]"
                  : "bg-gradient-to-br from-[#ffe4d6] to-[#fbeee0]"
              }`}
            >
              <span
                className={`text-4xl font-black ${accentColor}`}
              >
                {resultType.name.charAt(0)}
              </span>
            </div>
          </section>

          {/* 保存エラー */}
          {saveError && (
            <section className="rounded-2xl border border-red-200 bg-white px-5 py-4">
              <p className="text-sm leading-6 text-red-500">
                {saveError}
              </p>
            </section>
          )}

          {/* 最初に見せる説明 */}
          <section className="personality-result-section">
            <h2 className="text-sm font-bold text-[#ff8a63]">
              どんな人？
            </h2>

            <p className="mt-2 text-[15px] leading-7">
              {resultType[result.strength]}
            </p>
          </section>

          {/* 詳細表示 */}
          {showDetails && (
            <div className="flex flex-col gap-5">
              <section className="personality-result-section">
                <h2 className="text-sm font-bold text-[#ff8a63]">
                  話が合う相手
                </h2>

                <p className="mt-2 text-[15px] leading-7">
                  {resultType.compat}
                </p>
              </section>

              {!isBalance &&
                resultType.bestMatch && (
                  <section className="personality-best-match">
                    <p className="text-xs font-bold text-[#93857a]">
                      最も相性がよいタイプ
                    </p>

                    <p className="mt-2 text-xl font-bold text-[#ff8a63]">
                      {resultType.bestMatch}
                    </p>
                  </section>
                )}

              <p className="px-2 text-center text-xs leading-6 text-[#93857a]">
                ※本診断は医学的・臨床的な性格分析ではありません。
                性格は固定的なものではなく変化しうるため、
                気になったときにいつでも再診断できます。
              </p>
            </div>
          )}

          {/* 詳細開閉 */}
          <button
            type="button"
            onClick={() =>
              setShowDetails((previous) => !previous)
            }
            className="personality-detail-button"
          >
            {showDetails
              ? "詳細を閉じる"
              : "詳しく見る"}
          </button>

          {/* 診断結果を保存 */}
        <button
          type="button"
          className="personality-home-button"
          onClick={savePersonality}
          disabled={isSaving}
        >
          {isSaving
            ? "保存中..."
            : returnToProfile
              ? "保存してプロフィールへ"
              : "保存してホームへ"}
        </button>
        </div>
      </main>
    );
  }

  return null;
}
