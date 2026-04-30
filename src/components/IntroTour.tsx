"use client";

import { useState } from "react";

const STORAGE_KEY = "chessoplex-tour-dismissed";

const STEPS = [
  {
    icon: "♟",
    title: "Welcome to Chessoplex",
    body: "Play chess against a real engine (Stockfish 16). Your moves are analysed live — every game helps you improve.",
  },
  {
    icon: "📊",
    title: "Eval Bar",
    body: "The vertical bar on the left of the board shows who's winning. White on top, black on the bottom — watch it shift as the position changes.",
  },
  {
    icon: "🏥",
    title: "Health Bars",
    body: "Each player's health drains as the engine evaluates the position against them. Protect your king and your health!",
  },
  {
    icon: "✨",
    title: "Move Annotations",
    body: "After each move, the engine scores it. Great moves get a star ★, mistakes get ?, and blunders get ??. Review them in the move list.",
  },
  {
    icon: "⚙️",
    title: "Settings",
    body: "Tap the gear icon (top right of the sidebar) to change theme, board colours, difficulty, sound, voice, and more.",
  },
  {
    icon: "📖",
    title: "Study Mode",
    body: "Open Settings → Study Mode to learn chess openings interactively. 30 openings from beginner to advanced, with tips on every move.",
  },
];

interface IntroTourProps {
  theme: "dark" | "light";
  onDismiss?: () => void;
}

export default function IntroTour({ theme, onDismiss }: IntroTourProps) {
  const [step, setStep] = useState(0);

  const isDark = theme === "dark";
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    onDismiss?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className={`relative w-full max-w-sm rounded-2xl shadow-2xl border p-6 flex flex-col gap-5 ${isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-200 text-zinc-900"}`}>

        {/* Step dots */}
        <div className="flex gap-1.5 justify-center">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === step ? (isDark ? "bg-white w-5" : "bg-zinc-900 w-5") : (isDark ? "bg-zinc-600" : "bg-zinc-300")}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-4xl">{current.icon}</span>
          <h2 className="text-lg font-black uppercase tracking-wide">{current.title}</h2>
          <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{current.body}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={dismiss}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-colors ${isDark ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-zinc-200 text-zinc-500 hover:text-zinc-700"}`}
          >
            Skip tour
          </button>
          {isLast ? (
            <button
              onClick={dismiss}
              className="flex-1 py-2 text-sm font-bold rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-colors dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Let&apos;s play!
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-2 text-sm font-bold rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function shouldShowTour(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}
