"use client";

import dynamic from "next/dynamic";

const ChessGame = dynamic(() => import("../components/ChessGame"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex flex-col justify-start p-3 min-h-dvh overflow-y-auto md:h-dvh md:overflow-hidden md:p-4 lg:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] transition-colors duration-500 from-zinc-100 via-zinc-200 to-zinc-300 dark:from-zinc-800 dark:via-zinc-900 dark:to-black">
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        <ChessGame />
      </div>
    </main>
  );
}
