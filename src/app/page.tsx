"use client";

import dynamic from "next/dynamic";

const ChessGame = dynamic(() => import("../components/ChessGame"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-start p-3 min-h-dvh overflow-y-auto md:h-dvh md:overflow-hidden md:justify-center md:p-4 lg:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] transition-colors duration-500 from-zinc-100 via-zinc-200 to-zinc-300 dark:from-zinc-800 dark:via-zinc-900 dark:to-black">
      <ChessGame />
    </main>
  );
}
