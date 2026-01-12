"use client";

import { useEffect, useState } from "react";

type GameOverModalProps = {
  isOpen: boolean;
  gameStatus: string | null; // e.g., "Checkmate", "Draw", "Stalemate"
  winner: "w" | "b" | "draw" | null;
  onRestart: () => void;
  isLightUi?: boolean;
};

export default function GameOverModal({
  isOpen,
  gameStatus,
  winner,
  onRestart,
  isLightUi = false,
}: GameOverModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300); // Wait for exit animation
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const isWin = winner === "w";
  const isLoss = winner === "b";
  const isDraw = winner === "draw";

  // Dynamic Styles
  const modalBg = isLightUi
    ? "bg-white/95 border-black/10 shadow-2xl"
    : "bg-zinc-900/90 border-white/10 shadow-2xl backdrop-blur-xl";

  const textColor = isLightUi ? "text-zinc-900" : "text-white";
  const subTextColor = isLightUi ? "text-zinc-500" : "text-zinc-400";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 backdrop-blur-sm"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className={`absolute inset-0 bg-black/40`} />

      <div
        className={`relative w-full max-w-sm rounded-3xl p-8 text-center border transform transition-all duration-500 ${modalBg} ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div className="mb-6">
          {isWin && <span className="text-6xl">🏆</span>}
          {isLoss && <span className="text-6xl">💀</span>}
          {isDraw && <span className="text-6xl">🤝</span>}
        </div>

        <h2 className={`text-3xl font-black uppercase mb-2 ${textColor}`}>
          {isDraw ? "Draw" : isWin ? "You Won!" : "Game Over"}
        </h2>

        <p
          className={`font-medium mb-8 uppercase tracking-widest text-sm ${subTextColor}`}
        >
          {gameStatus || "Match Ended"}
        </p>

        <button
          onClick={onRestart}
          className={`w-full py-4 text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 ${
            isLightUi
              ? "bg-zinc-900 text-white hover:bg-zinc-800"
              : "bg-white text-zinc-900 hover:bg-zinc-200"
          }`}
        >
          New Game
        </button>
      </div>
    </div>
  );
}
