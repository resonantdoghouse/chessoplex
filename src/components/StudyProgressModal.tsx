"use client";
import { useEffect, useState } from "react";

type Session = {
  id: string;
  opening_name: string;
  completed: boolean;
  moves_correct: number;
  total_moves: number;
  hints_used: number;
  duration_ms: number;
  created_at: string;
};

type Props = { isOpen: boolean; onClose: () => void };

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export default function StudyProgressModal({ isOpen, onClose }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/study")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const completed = sessions.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border shadow-2xl bg-white border-black/10 dark:bg-zinc-900 dark:border-white/10 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-black/10 dark:border-white/10 shrink-0">
          <div>
            <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Study Progress</h2>
            {sessions.length > 0 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {completed} of {sessions.length} sessions completed
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:opacity-70 text-xl leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No study sessions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-black/5 dark:border-white/5">
                  <th className="px-4 py-2 font-semibold">Opening</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold hidden sm:table-cell">Accuracy</th>
                  <th className="px-4 py-2 font-semibold hidden sm:table-cell">Hints</th>
                  <th className="px-4 py-2 font-semibold hidden sm:table-cell">Time</th>
                  <th className="px-4 py-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const accuracy = s.total_moves > 0 ? Math.round((s.moves_correct / s.total_moves) * 100) : null;
                  return (
                    <tr key={s.id} className="border-b border-black/5 dark:border-white/5 last:border-0">
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 max-w-[130px] truncate">{s.opening_name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          s.completed
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                          {s.completed ? "Done" : "Partial"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                        {accuracy !== null ? `${accuracy}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{s.hints_used}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{formatDuration(s.duration_ms)}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString()}
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
