"use client";
import { useEffect, useState } from "react";

type Game = {
  id: string;
  result: string;
  difficulty: string;
  player_color: string;
  move_count: number;
  duration_ms: number;
  opening_name: string;
  created_at: string;
};

type Props = { isOpen: boolean; onClose: () => void };

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function outcome(result: string, playerColor: string) {
  if (result === "draw") return { label: "Draw", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" };
  const won = (result === "white" && playerColor === "w") || (result === "black" && playerColor === "b");
  return won
    ? { label: "Win", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" }
    : { label: "Loss", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" };
}

export default function GameHistoryModal({ isOpen, onClose }: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/games")
      .then((r) => r.json())
      .then((d) => setGames(d.games ?? []))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border shadow-2xl bg-white border-black/10 dark:bg-zinc-900 dark:border-white/10 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-black/10 dark:border-white/10 shrink-0">
          <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Game History</h2>
          <button onClick={onClose} className="text-zinc-400 hover:opacity-70 text-xl leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : games.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No games recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-black/5 dark:border-white/5">
                  <th className="px-4 py-2 font-semibold">Result</th>
                  <th className="px-4 py-2 font-semibold">Opening</th>
                  <th className="px-4 py-2 font-semibold hidden sm:table-cell">Difficulty</th>
                  <th className="px-4 py-2 font-semibold hidden sm:table-cell">Moves</th>
                  <th className="px-4 py-2 font-semibold hidden sm:table-cell">Time</th>
                  <th className="px-4 py-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => {
                  const o = outcome(g.result, g.player_color);
                  return (
                    <tr key={g.id} className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/2 dark:hover:bg-white/2">
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${o.cls}`}>{o.label}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 max-w-[130px] truncate">{g.opening_name || "—"}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{g.difficulty}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{g.move_count}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{formatDuration(g.duration_ms)}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                        {new Date(g.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
