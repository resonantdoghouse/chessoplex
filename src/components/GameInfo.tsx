"use client";

import { useEffect, useState } from "react";

type GameInfoProps = {
  turn: "w" | "b";
  startTime: number;
  gameStatus: string | null;
  isPaused: boolean;
  totalPausedTime: number;
  opponentName: string;
};

export default function GameInfo({
  turn,
  startTime,
  gameStatus,
  isPaused,
  totalPausedTime,
  opponentName,
}: GameInfoProps) {
  const [elapsed, setElapsed] = useState("0:00");

  useEffect(() => {
    if (gameStatus) return;

    const interval = setInterval(() => {
      // If paused, we don't update the visual timer, it stays frozen
      if (isPaused) return;

      const now = Date.now();
      // Calculate effective duration: (Current Time - Start Time) - (Total Paused Time)
      // Note: When we are in the middle of a pause (isPaused=true), totalPausedTime in the parent
      // might not be updating every millisecond, it updates on resume.
      // So visually freezing here is correct.
      const diff = Math.max(
        0,
        Math.floor((now - startTime - totalPausedTime) / 1000)
      );

      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setElapsed(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 100); // 100ms for smoother updates if we added ms later

    return () => clearInterval(interval);
  }, [startTime, gameStatus, isPaused, totalPausedTime]);

  // Helper for status badge
  const statusColor = gameStatus ? "text-yellow-400" : "text-emerald-400";
  const statusText = gameStatus || "In Progress";

  return (
    <div className="w-full flex-shrink-0 bg-zinc-900/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl space-y-6">
      {/* Opponent Card */}
      <div
        className={`relative flex items-center justify-between p-4 rounded-xl transition-all duration-300 border ${
          turn === "b" && !gameStatus
            ? "bg-zinc-800/80 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            : "bg-zinc-800/30 border-transparent"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-black/50 overflow-hidden border border-red-800/30 shadow-inner p-1">
            <img
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                opponentName
              )}`}
              alt="Opponent Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-bold text-zinc-100 text-lg">{opponentName}</p>
            <p className="text-xs text-zinc-500 font-mono">Rating: 1500</p>
          </div>
        </div>
        {turn === "b" && !gameStatus && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
        )}
      </div>

      {/* Timer & Status Display */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 rounded-lg border border-white/5">
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-zinc-500 tracking-[0.2em] font-bold">
            Time Elapsed
          </p>
          <p
            className={`text-4xl font-mono font-black tracking-tight ${
              isPaused ? "text-yellow-500/80" : "text-white"
            }`}
          >
            {elapsed}
          </p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] uppercase text-zinc-500 tracking-[0.2em] font-bold">
            Status
          </p>
          <span
            className={`text-sm font-bold uppercase tracking-wider ${statusColor}`}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Player Card */}
      <div
        className={`relative flex items-center justify-between p-4 rounded-xl transition-all duration-300 border ${
          turn === "w" && !gameStatus
            ? "bg-zinc-800/80 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            : "bg-zinc-800/30 border-transparent"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-950 to-black flex items-center justify-center border border-blue-800/30 shadow-inner">
            <span className="text-blue-200/50 font-black text-lg">YOU</span>
          </div>
          <div>
            <p className="font-bold text-zinc-100 text-lg">You</p>
            <p className="text-xs text-zinc-500 font-mono">White Pieces</p>
          </div>
        </div>
        {turn === "w" && !gameStatus && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
