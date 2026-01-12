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

  // Dynamic Styles based on UI Mode
  const panelValues = isLightUi
    ? {
        container: "bg-white/95 border-black/10 shadow-xl", // Increased opacity for readability
        text: "text-zinc-950", // Darker text
        subText: "text-zinc-600", // Darker subtext
        cardBg: "bg-zinc-100 border-zinc-200",
        cardBgActive: "bg-white border-zinc-300 shadow-md",
        timerBg: "bg-black/5 border-black/5",
        timerText: "text-zinc-900",
      }
    : {
        container: "bg-zinc-900/60 border-white/10 shadow-2xl",
        text: "text-zinc-100",
        subText: "text-zinc-400", // Lighter subtext for dark mode
        cardBg: "bg-zinc-800/30 border-transparent",
        cardBgActive: "bg-zinc-800/80 shadow-[0_0_15px_rgba(255,255,255,0.1)]",
        timerBg: "bg-black/20 border-white/5",
        timerText: "text-white",
      };

  return (
    <div
      className={`w-full flex-shrink-0 backdrop-blur-md rounded-2xl p-6 border space-y-6 transition-all duration-300 ${panelValues.container}`}
    >
      {/* Opponent Card */}
      <div
        className={`relative flex items-center justify-between p-4 rounded-xl transition-all duration-300 border ${
          turn === "b" && !gameStatus
            ? isLightUi
              ? "bg-white border-red-500 shadow-md shadow-red-500/10"
              : "bg-zinc-800/80 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            : panelValues.cardBg
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-black/50 overflow-hidden border border-red-800/30 shadow-inner p-1 relative">
            <Image
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                opponentName
              )}`}
              alt="Opponent Avatar"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className={`font-bold text-lg ${panelValues.text}`}>
              {opponentName}
            </p>
            <p className={`text-xs font-mono ${panelValues.subText}`}>
              Rating: 1500
            </p>
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
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-lg border ${panelValues.timerBg}`}
      >
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-zinc-500 tracking-[0.2em] font-bold">
            Time Elapsed
          </p>
          <p
            className={`text-4xl font-mono font-black tracking-tight ${
              isPaused ? "text-yellow-500/80" : panelValues.timerText
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
            ? isLightUi
              ? "bg-white border-blue-500 shadow-md shadow-blue-500/10"
              : "bg-zinc-800/80 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            : panelValues.cardBg
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-950 to-black flex items-center justify-center border border-blue-800/30 shadow-inner">
            <span className="text-blue-200/50 font-black text-lg">YOU</span>
          </div>
          <div>
            <p className={`font-bold text-lg ${panelValues.text}`}>You</p>
            <p className={`text-xs font-mono ${panelValues.subText}`}>
              White Pieces
            </p>
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
