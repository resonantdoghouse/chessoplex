"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "../hooks/useTheme";

type GameInfoProps = {
  turn: "w" | "b";
  playerColor: "w" | "b";
  startTime: number;
  gameStatus: string | null;
  isPaused: boolean;
  totalPausedTime: number;
  opponentName: string;
  isLightUi?: boolean;
  currentEval?: { evaluation?: number; mate?: number };
};

function computeHealth(evalPawns: number | undefined, mate: number | undefined, color: "w" | "b"): number {
  if (mate !== undefined) {
    const isDelivering = (color === "w" && mate > 0) || (color === "b" && mate < 0);
    if (isDelivering) return 100;
    // Being mated: urgency scales with distance — closer = lower health
    return Math.max(3, Math.min(18, Math.abs(mate) * 3));
  }
  if (evalPawns !== undefined) {
    // Logistic win-probability: 50% at equality, ~73% at +1.5, ~88% at +3, ~96% at +6
    const advantage = color === "w" ? evalPawns : -evalPawns;
    const winProb = 1 / (1 + Math.exp(-advantage / 3.0));
    return Math.round(winProb * 100);
  }
  return 50; // equal game before first eval
}

function HealthBar({ health, active }: { health: number; active: boolean }) {
  const color =
    health >= 55 ? "#22c55e" : health >= 35 ? "#eab308" : "#ef4444";
  const critical = health <= 20;
  return (
    <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mt-1.5">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${critical && active ? "animate-pulse" : ""}`}
        style={{ width: `${health}%`, background: color, boxShadow: critical ? `0 0 6px ${color}` : undefined }}
      />
    </div>
  );
}

export default function GameInfo({
  turn,
  playerColor,
  startTime,
  gameStatus,
  isPaused,
  totalPausedTime,
  opponentName,
  isLightUi = false,
  currentEval = {},
}: GameInfoProps) {
  const { theme } = useTheme();
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

  const opponentColor  = playerColor === "w" ? "b" : "w";
  const opponentActive = turn === opponentColor && !gameStatus;
  const playerActive   = turn === playerColor && !gameStatus;

  const playerHealth   = computeHealth(currentEval.evaluation, currentEval.mate, playerColor);
  const opponentHealth = computeHealth(currentEval.evaluation, currentEval.mate, opponentColor);

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
          <p className={`text-[10px] font-mono leading-tight ${textSub}`}>{opponentColor === "w" ? "White" : "Black"}</p>
          <HealthBar health={opponentHealth} active={opponentActive} />
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
              isPaused ? (theme === "dark" ? "text-yellow-500" : "text-amber-700") : (isLightUi || theme === "light") ? "text-zinc-900" : "text-white"
            }`}>
              {elapsed}
            </p>
          </div>
          <div className="text-right pb-0.5">
            {gameStatus ? (
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-yellow-400">
                {gameStatus}
              </span>
            ) : (
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isPaused
                  ? "text-amber-700 dark:text-yellow-500"
                  : playerActive
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400"
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
          <p className={`text-[10px] font-mono leading-tight ${textSub}`}>{playerColor === "w" ? "White" : "Black"}</p>
          <HealthBar health={playerHealth} active={playerActive} />
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
