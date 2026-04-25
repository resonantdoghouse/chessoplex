"use client";

import { Move } from "chess.js";
import { getOpeningName } from "@/lib/openings";

type MoveHistoryProps = {
  history: Move[];
  annotations?: string[];
};

function getSpecialLabel(move: Move): string | null {
  if (move.san === "O-O") return "Kingside Castle";
  if (move.san === "O-O-O") return "Queenside Castle";
  if (move.flags.includes("e")) return "En Passant";
  const promMatch = move.san.match(/=([QRBN])/);
  if (promMatch) {
    const labels: Record<string, string> = { Q: "Queen", R: "Rook", B: "Bishop", N: "Knight" };
    return `Promotes to ${labels[promMatch[1]] ?? promMatch[1]}`;
  }
  return null;
}

export default function MoveHistory({
  history,
  annotations = [],
}: MoveHistoryProps) {
  // Group moves into pairs (White, Black) in forward order
  const forwardPairs = [];
  for (let i = 0; i < history.length; i += 2) {
    forwardPairs.push({
      white: history[i],
      whiteAnnotation: annotations[i] || "",
      black: history[i + 1] || null,
      blackAnnotation: annotations[i + 1] || "",
      number: Math.floor(i / 2) + 1,
    });
  }

  // Compute opening name at end of each pair (after both moves, or just white's if last)
  const openingNames = forwardPairs.map((_, idx) => {
    const pairEndIdx = Math.min((idx + 1) * 2, history.length);
    return getOpeningName(history.slice(0, pairEndIdx).map((m) => m.san));
  });

  // Only show label when opening name changes from the previous pair
  const openingLabelsForward: (string | null)[] = forwardPairs.map((_, idx) => {
    const current = openingNames[idx];
    const prev = idx > 0 ? openingNames[idx - 1] : null;
    return current !== prev ? current : null;
  });

  // Reverse to show latest move at the top
  const movePairs = [...forwardPairs].reverse();
  const openingLabels = [...openingLabelsForward].reverse();

  if (history.length === 0) {
    return (
      <div className="w-full flex-grow flex items-center justify-center min-h-[100px] text-zinc-500 italic text-sm font-mono opacity-50">
        Waiting for first move...
      </div>
    );
  }

  const displayAnnotation = (ann: string) =>
    ann === "Mistake" ? "Blunder" : ann;

  const getAnnotationClass = (ann: string) => {
    if (ann === "Blunder" || ann === "Mistake")
      return "text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/30 px-1 ml-1 rounded text-[10px]";
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
          {movePairs.map((pair, idx) => (
            <div key={pair.number}>
              {openingLabels[idx] && (
                <div className="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 px-4 pt-2 pb-1">
                  <span />
                  <span className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400 truncate">
                    {openingLabels[idx]}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-sm font-mono px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150">
                <span className="text-zinc-500 dark:text-zinc-600 shrink-0">
                  {pair.number}.
                </span>
                <span className="text-zinc-800 dark:text-zinc-200 font-medium flex flex-col gap-0.5 overflow-hidden">
                  <span className="flex items-center overflow-hidden whitespace-nowrap">
                    <span className="truncate">{pair.white.san}</span>
                    {pair.whiteAnnotation && (
                      <span className={getAnnotationClass(pair.whiteAnnotation)}>
                        {displayAnnotation(pair.whiteAnnotation)}
                      </span>
                    )}
                  </span>
                  {getSpecialLabel(pair.white) && (
                    <span className="text-[10px] font-sans font-semibold text-amber-600 dark:text-amber-400 truncate leading-none">
                      {getSpecialLabel(pair.white)}
                    </span>
                  )}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 font-medium flex flex-col gap-0.5 overflow-hidden">
                  {pair.black ? (
                    <>
                      <span className="flex items-center overflow-hidden whitespace-nowrap">
                        <span className="truncate">{pair.black.san}</span>
                        {pair.blackAnnotation && (
                          <span className={getAnnotationClass(pair.blackAnnotation)}>
                            {displayAnnotation(pair.blackAnnotation)}
                          </span>
                        )}
                      </span>
                      {getSpecialLabel(pair.black) && (
                        <span className="text-[10px] font-sans font-semibold text-amber-600 dark:text-amber-400 truncate leading-none">
                          {getSpecialLabel(pair.black)}
                        </span>
                      )}
                    </>
                  ) : (
                    ""
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
