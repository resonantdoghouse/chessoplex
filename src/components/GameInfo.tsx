"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type GameInfoProps = {
  turn: "w" | "b";
  startTime: number;
  gameStatus: string | null;
  isPaused: boolean;
  totalPausedTime: number;
  opponentName: string;
  isLightUi?: boolean;
};

export default function GameInfo({
  turn,
  startTime,
  gameStatus,
  isPaused,
  totalPausedTime,
  opponentName,
  isLightUi = false,
}: GameInfoProps) {
  const [elapsed, setElapsed] = useState("0:00");

  useEffect(() => {
    if (gameStatus) return;

    const interval = setInterval(() => {
      if (isPaused) return;
      const diff = Math.max(
        0,
        Math.floor((Date.now() - startTime - totalPausedTime) / 1000)
      );
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setElapsed(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, gameStatus, isPaused, totalPausedTime]);

  const panelBg = isLightUi
    ? "bg-white/90 border-black/10 shadow-sm"
    : "bg-white/5 dark:bg-zinc-900/60 border-white/10 shadow-sm";

  const textPrimary = isLightUi ? "text-zinc-900" : "text-white";
  const textSub     = isLightUi ? "text-zinc-500" : "text-zinc-400";

  const opponentActive = turn === "b" && !gameStatus;
  const playerActive   = turn === "w" && !gameStatus;

  return (
    <div className="flex flex-col gap-2 shrink-0">

      {/* Opponent strip */}
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
        opponentActive
          ? "border-red-500/50 bg-red-500/5 shadow-md shadow-red-900/10"
          : panelBg
      }`}>
        <div className="relative w-9 h-9 shrink-0 rounded-full overflow-hidden bg-black/40 border border-zinc-700/50 p-0.5">
          <Image
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(opponentName)}`}
            alt="Opponent avatar"
            fill
            sizes="36px"
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm leading-tight truncate ${textPrimary}`}>
            {opponentName}
          </p>
          <p className={`text-[10px] font-mono leading-tight ${textSub}`}>Black</p>
        </div>
        {opponentActive && (
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
      </div>

      {/* Timer */}
      <div className={`px-4 py-3 rounded-xl border ${panelBg}`}>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-0.5 ${textSub}`}>
              Time Elapsed
            </p>
            <p className={`text-5xl font-mono font-black tracking-tight leading-none tabular-nums ${
              isPaused ? "text-yellow-500/80" : isLightUi ? "text-zinc-900" : "text-white"
            }`}>
              {elapsed}
            </p>
          </div>
          <div className="text-right pb-0.5">
            {gameStatus ? (
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                {gameStatus}
              </span>
            ) : (
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isPaused
                  ? "text-yellow-500/80"
                  : playerActive
                    ? "text-emerald-400"
                    : "text-red-400"
              }`}>
                {isPaused ? "Paused" : playerActive ? "Your Turn" : "Thinking…"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Player strip */}
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
        playerActive
          ? "border-blue-500/50 bg-blue-500/5 shadow-md shadow-blue-900/10"
          : `${panelBg} opacity-60`
      }`}>
        <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-blue-900 to-black flex items-center justify-center border border-blue-800/30">
          <span className="text-blue-200/60 font-black text-[9px]">YOU</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm leading-tight ${textPrimary}`}>You</p>
          <p className={`text-[10px] font-mono leading-tight ${textSub}`}>White</p>
        </div>
        {playerActive && (
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
        )}
      </div>

    </div>
  );
}
