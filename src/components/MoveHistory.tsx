"use client";

import { useEffect } from "react";
import { Move } from "chess.js";

type MoveHistoryProps = {
  history: Move[];
  annotations?: string[];
};

export default function MoveHistory({
  history,
  annotations = [],
}: MoveHistoryProps) {
  // Group moves into pairs (White, Black)
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      white: history[i],
      whiteAnnotation: annotations[i] || "",
      black: history[i + 1] || null,
      blackAnnotation: annotations[i + 1] || "",
      number: Math.floor(i / 2) + 1,
    });
  }

  // Reverse to show latest move at the top
  movePairs.reverse();

  if (history.length === 0) {
    return (
      <div className="w-full flex-grow flex items-center justify-center min-h-[100px] text-zinc-500 italic text-sm font-mono opacity-50">
        Waiting for first move...
      </div>
    );
  }

  const getAnnotationClass = (ann: string) => {
    if (ann === "Blunder")
      return "text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/30 px-1 ml-1 rounded text-[10px]";
    if (ann === "Mistake")
      return "text-orange-500 dark:text-orange-400 font-bold bg-orange-100 dark:bg-orange-900/30 px-1 ml-1 rounded text-[10px]";
    if (ann === "Great Move")
      return "text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-900/30 px-1 ml-1 rounded text-[10px]";
    if (ann === "Book Move")
      return "text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-1 ml-1 rounded text-[10px]";
    return "";
  };

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
        <h3 className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-[0.2em]">
          Move History
        </h3>
      </div>
      <div className="flex-grow overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent h-full max-h-[300px]">
        <div className="sticky top-0 z-10 grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-xs font-mono px-4 py-2 text-zinc-600 dark:text-zinc-500 font-bold bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-b border-black/5 dark:border-white/5">
          <span>#</span>
          <span>White</span>
          <span>Black</span>
        </div>
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {movePairs.map((pair) => (
            <div
              key={pair.number}
              className="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-sm font-mono px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150"
            >
              <span className="text-zinc-500 dark:text-zinc-600 shrink-0">
                {pair.number}.
              </span>
              <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate flex items-center overflow-hidden whitespace-nowrap">
                <span className="truncate">{pair.white.san}</span>
                {pair.whiteAnnotation && (
                  <span className={getAnnotationClass(pair.whiteAnnotation)}>
                    {pair.whiteAnnotation}
                  </span>
                )}
              </span>
              <span className="text-zinc-600 dark:text-zinc-400 font-medium truncate flex items-center overflow-hidden whitespace-nowrap">
                {pair.black ? (
                  <>
                    <span className="truncate">{pair.black.san}</span>
                    {pair.blackAnnotation && (
                      <span
                        className={getAnnotationClass(pair.blackAnnotation)}
                      >
                        {pair.blackAnnotation}
                      </span>
                    )}
                  </>
                ) : (
                  ""
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
