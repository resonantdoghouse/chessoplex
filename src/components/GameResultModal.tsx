"use client";

import { useEffect, useState } from "react";

type GameResult = {
  winner: "white" | "black" | "draw";
  reason: string;
};

type GameStats = {
  moves: number;
  duration: string;
};

type GameResultModalProps = {
  isOpen: boolean;
  gameResult: GameResult | null;
  stats: GameStats | null;
  onReset: () => void;
  onClose: () => void;
};

export default function GameResultModal({
  isOpen,
  gameResult,
  stats,
  onReset,
  onClose,
}: GameResultModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300); // Wait for animation
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const isWin = gameResult?.winner === "white";
  const isDraw = gameResult?.winner === "draw";

  let title = "Victory!";
  let titleColor = "text-yellow-400";
  let createGradient = "from-yellow-500/20 to-orange-500/20"; // Warm/Victory

  if (isDraw) {
    title = "Draw";
    titleColor = "text-gray-300";
    createGradient = "from-gray-500/20 to-zinc-500/20"; // Neutral/Draw
  } else if (!isWin) {
    title = "Defeat";
    titleColor = "text-red-400";
    createGradient = "from-red-500/20 to-pink-500/20"; // Cool/Defeat
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all duration-300 ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${createGradient} pointer-events-none`}
        />

        <div className="relative text-center space-y-6">
          <div className="space-y-2">
            <h2
              className={`text-4xl font-bold ${titleColor} mb-2 drop-shadow-lg`}
            >
              {title}
            </h2>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
              {gameResult?.reason}
            </p>
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-4 py-4 rounded-xl bg-black/20 backdrop-brightness-75">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Moves
                </span>
                <p className="text-2xl font-mono text-zinc-200">
                  {stats.moves}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Time
                </span>
                <p className="text-2xl font-mono text-zinc-200">
                  {stats.duration}
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={onReset}
              className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              Play Again
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors text-sm"
            >
              Close Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
