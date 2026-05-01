"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const ChessGame = dynamic(() => import("../components/ChessGame"), { ssr: false });
const StudyMode = dynamic(() => import("../components/StudyMode"), { ssr: false });

type AppMode = "play" | "study";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("play");

  return (
    <main className="flex flex-col justify-start p-3 min-h-dvh overflow-y-auto md:h-dvh md:overflow-hidden md:p-4 lg:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] transition-colors duration-500 from-zinc-100 via-zinc-200 to-zinc-300 dark:from-zinc-800 dark:via-zinc-900 dark:to-black">
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        {mode === "play" ? (
          <ChessGame onStudyMode={() => setMode("study")} />
        ) : (
          <div className="w-full h-full max-w-7xl overflow-hidden">
            <StudyMode onBack={() => setMode("play")} />
          </div>
        )}
      </div>
    </main>
  );
}
