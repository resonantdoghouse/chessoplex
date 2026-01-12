"use client";

import { useEffect, useRef } from "react";

type MoveHistoryProps = {
  history: string[];
};

export default function MoveHistory({ history }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Group moves into pairs (White, Black)
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      white: history[i],
      black: history[i + 1] || "",
      number: Math.floor(i / 2) + 1,
    });
  }

  if (history.length === 0) {
    return (
      <div className="w-full flex-grow flex items-center justify-center min-h-[100px] text-zinc-500 italic text-sm font-mono opacity-50">
        Waiting for first move...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 py-3 border-b border-white/5 bg-white/5">
        <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-[0.2em]">
          Move History
        </h3>
      </div>
      <div
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent h-full max-h-[300px]"
      >
        <div className="sticky top-0 z-10 grid grid-cols-[3rem_1fr_1fr] gap-2 text-xs font-mono px-4 py-2 text-zinc-500 font-bold bg-zinc-900/90 backdrop-blur-sm border-b border-white/5">
          <span>#</span>
          <span>White</span>
          <span>Black</span>
        </div>
        <div className="divide-y divide-white/5">
          {movePairs.map((pair) => (
            <div
              key={pair.number}
              className="grid grid-cols-[3rem_1fr_1fr] gap-2 text-sm font-mono px-4 py-2 hover:bg-white/5 transition-colors duration-150"
            >
              <span className="text-zinc-600">{pair.number}.</span>
              <span className="text-zinc-200 font-medium">{pair.white}</span>
              <span className="text-zinc-400 font-medium">{pair.black}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
