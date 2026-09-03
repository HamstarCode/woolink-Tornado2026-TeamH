"use client";

import { useEffect, useMemo, useState } from "react";
import { QUESTION_BANK } from "./data-questions";
import { BALANCE_TYPE, TYPE_DATA } from "./data-types";

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

function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

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
      difference = Math.min(difference, 360 - difference);

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
  const [screen, setScreen] = useState<
    "start" | "quiz" | "calculating" | "result"
  >("start");

  const [order, setOrder] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);

  const currentQuestion = order[index];

  const answeredCount = Object.keys(answers).length;

  const progress = useMemo(() => {
    if (order.length === 0) return 0;

    return (answeredCount / order.length) * 100;
  }, [answeredCount, order.length]);

  const startQuiz = () => {
    setOrder(shuffle(questions));
    setIndex(0);
    setAnswers({});
    setResult(null);
    setScreen("quiz");
  };

  const selectAnswer = (value: number) => {
    if (!currentQuestion) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: value,
    }));

    window.setTimeout(() => {
      if (index < order.length - 1) {
        setIndex((previous) => previous + 1);
      } else {
        setScreen("calculating");
      }
    }, 380);
  };

  useEffect(() => {
    if (screen !== "calculating") return;

    const timer = window.setTimeout(() => {
      const calculated = calculateResult(answers);
      setResult(calculated);
      setScreen("result");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [screen, answers]);

  const goBack = () => {
    if (index === 0) return;

    setIndex((previous) => previous - 1);
  };

  const goNext = () => {
    if (!currentQuestion) return;
    if (!(currentQuestion.id in answers)) return;

    if (index < order.length - 1) {
      setIndex((previous) => previous + 1);
    }
  };

  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const isBalance = result ? !result.axisKey : false;

  const resultType = result
    ? isBalance
      ? balanceType
      : typeData[`${result.axisKey}_${result.energyDir}`]
    : null;

  if (screen === "start") {
    return (
      <main className="min-h-screen bg-[#fff8ef] px-6 py-10 text-[#3d332c]">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col items-center justify-center text-center">
          <p className="text-xs font-bold tracking-[0.14em] text-[#ff8a63]">
            対人スタイル診断
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-[1.45] sm:text-5xl">
            話が合う人には、
            <br />
            理由がある。
          </h1>

          <p className="mt-6 max-w-lg text-sm leading-8 text-[#93857a]">
            「対人円環の相補性理論」と「ラポール理論」をもとに、
            20個の質問からあなたの対人スタイルをやさしく診断します。
          </p>

          <div className="mt-8 flex gap-3">
            {[
              ["設問数", "20問"],
              ["所要時間", "約3分"],
              ["結果タイプ", "全17種"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#efe1cd] bg-white px-4 py-3"
              >
                <p className="text-[11px] text-[#93857a]">{label}</p>
                <p className="mt-1 text-lg font-bold text-[#ff8a63]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={startQuiz}
            className="mt-8 rounded-full bg-gradient-to-b from-[#ff9c78] to-[#ff8a63] px-9 py-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(255,138,99,0.32)] transition hover:scale-[1.02] active:scale-95"
          >
            診断をはじめる
          </button>

          <p className="mt-7 max-w-md text-xs leading-7 text-[#93857a]">
            回答はこの端末の中だけで計算され、どこにも送信されません。
            診断は医学的・臨床的な性格分析ではなく、
            性格は変化しうるものとして扱っています。
          </p>
        </div>
      </main>
    );
  }

  if (screen === "quiz" && currentQuestion) {
    return (
      <main className="min-h-screen bg-[#fff8ef] px-5 py-5 text-[#3d332c]">
        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-xl flex-col">
          <header>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#fbeee0]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff8a63] to-[#ffc857] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={index === 0}
                className="px-1 py-1 text-sm text-[#93857a] disabled:cursor-default disabled:opacity-35"
              >
                ← 前の質問
              </button>

              <span className="text-sm font-bold text-[#93857a]">
                <span className="text-[#ff8a63]">
                  {index + 1}
                </span>
                <span className="mx-1 opacity-50">/</span>
                20
              </span>

              <button
                type="button"
                onClick={goNext}
                disabled={currentAnswer === undefined}
                className="px-1 py-1 text-sm text-[#93857a] disabled:cursor-default disabled:opacity-35"
              >
                次の質問 →
              </button>
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center">
            <div
              key={currentQuestion.id}
              className="w-full py-3"
            >
              <p className="mb-10 flex min-h-[2.4em] items-center justify-center text-center font-bold leading-[1.6] text-[clamp(21px,5.6vw,28px)]">
                {currentQuestion.prompt}
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex-1 text-left text-sm leading-6 text-[#93857a]">
                    {currentQuestion.left}
                  </p>

                  <p className="flex-1 text-right text-sm leading-6 text-[#93857a]">
                    {currentQuestion.right}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 px-1.5">
                  {[1, 2, 3, 4, 5].map((value, i) => (
                    <div
                      key={value}
                      className="flex flex-1 items-center"
                    >
                      <button
                        type="button"
                        aria-label={`5段階中${value}`}
                        onClick={() => selectAnswer(value)}
                        className={`mx-auto rounded-full border-2 transition ${
                          value === currentAnswer
                            ? "border-[#ff8a63] bg-gradient-to-b from-[#ff9c78] to-[#ff8a63] shadow-[0_6px_16px_rgba(255,138,99,0.4)] scale-105"
                            : "border-[#efe1cd] bg-white hover:border-[#ff8a63]"
                        } ${
                          value === 1 || value === 5
                            ? "h-[52px] w-[52px]"
                            : value === 2 || value === 4
                              ? "h-[46px] w-[46px]"
                              : "h-[38px] w-[38px]"
                        }`}
                      />

                      {i < 4 && (
                        <div className="h-0.5 flex-1 bg-[#efe1cd]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-7 text-center text-xs text-[#93857a]">
                気持ちに近いところをタップすると、自動的に次の質問へ進みます
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "calculating") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff8ef] text-[#3d332c]">
        <div className="flex flex-col items-center gap-5">
          <div className="h-[76px] w-[76px] animate-spin rounded-full border-[7px] border-[#fbeee0] border-t-[#ff8a63]" />

          <p className="text-sm font-medium text-[#93857a]">
            あなたの対人スタイルを診断しています…
          </p>
        </div>
      </main>
    );
  }

  if (screen === "result" && result && resultType) {
    return (
      <main className="min-h-screen bg-[#fff8ef] px-6 py-10 text-[#3d332c]">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-7 pb-14">
          <div className="flex flex-col gap-2 text-center">
            <p
              className={`text-xs font-bold tracking-[0.14em] ${
                result.energyDir === "slow" && !isBalance
                  ? "text-[#4fb3a6]"
                  : "text-[#ff8a63]"
              }`}
            >
              {isBalance
                ? "バランスタイプ"
                : resultType.energyLabel}
            </p>

            <h1 className="text-4xl font-bold">
              {resultType.name}
            </h1>

            <p className="max-w-md text-sm leading-7 text-[#93857a]">
              {resultType.tagline}
            </p>
          </div>

          <div
            className={`flex h-40 w-40 items-center justify-center rounded-full border border-[#efe1cd] ${
              result.energyDir === "slow" && !isBalance
                ? "bg-gradient-to-br from-[#dcf3ee] to-[#fbeee0]"
                : "bg-gradient-to-br from-[#ffe4d6] to-[#fbeee0]"
            }`}
          >
            <span
              className={`text-5xl font-black ${
                result.energyDir === "slow" && !isBalance
                  ? "text-[#4fb3a6]"
                  : "text-[#ff8a63]"
              }`}
            >
              {resultType.name.charAt(0)}
            </span>
          </div>

          <section className="w-full">
            <h2 className="text-sm font-bold text-[#ff8a63]">
              ① どんな人か
            </h2>

            <p className="mt-2 text-[15px] leading-8">
              {resultType[result.strength]}
            </p>
          </section>

          <section className="w-full">
            <h2 className="text-sm font-bold text-[#ff8a63]">
              ② 話が合う相手
            </h2>

            <p className="mt-2 text-[15px] leading-8">
              {resultType.compat}
            </p>
          </section>

          {!isBalance && resultType.bestMatch && (
            <div className="w-full rounded-[20px] border border-[#efe1cd] bg-gradient-to-br from-[#ffe4d6] to-white px-6 py-5 text-center">
              <p className="text-xs font-bold text-[#93857a]">
                最も相性がよいタイプ
              </p>

              <p className="mt-2 text-xl font-bold text-[#ff8a63]">
                {resultType.bestMatch}
              </p>
            </div>
          )}

          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={startQuiz}
              className="w-full rounded-full bg-gradient-to-b from-[#ff9c78] to-[#ff8a63] px-9 py-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(255,138,99,0.32)]"
            >
              もう一度診断する
            </button>
          </div>

          <p className="text-center text-xs leading-7 text-[#93857a]">
            ※本診断は医学的・臨床的な性格分析ではありません。
            性格は固定的なものではなく変化しうるため、
            気になったときにいつでも再診断できます。
          </p>
        </div>
      </main>
    );
  }

  return null;
}