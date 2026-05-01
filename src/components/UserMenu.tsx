"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";
import GameHistoryModal from "./GameHistoryModal";
import StudyProgressModal from "./StudyProgressModal";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showGameHistory, setShowGameHistory] = useState(false);
  const [showStudyProgress, setShowStudyProgress] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Guest";

  return (
    <>
      <div className="relative">
        <button
          onClick={() => (user ? setOpen((v) => !v) : setShowAuth(true))}
          className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 transition-opacity hover:opacity-70 text-zinc-700 dark:text-zinc-300"
          title={user ? displayName : "Sign in"}
        >
          {user && avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-black/10 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
              {user ? displayName[0].toUpperCase() : "?"}
            </div>
          )}
          <span className="text-xs font-semibold max-w-[72px] truncate">
            {user ? displayName : "Sign in"}
          </span>
        </button>

        {open && user && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border p-1 bg-white border-black/10 shadow-xl dark:bg-zinc-900 dark:border-white/10 dark:shadow-2xl">
              <div className="px-3 py-2 text-xs font-semibold truncate text-zinc-700 dark:text-zinc-300 opacity-60">
                {user.email}
              </div>
              <button
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300"
                onClick={() => { setOpen(false); setShowGameHistory(true); }}
              >
                Game History
              </button>
              <button
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300"
                onClick={() => { setOpen(false); setShowStudyProgress(true); }}
              >
                Study Progress
              </button>
              <div className="mx-2 my-1 h-px bg-black/10 dark:bg-white/10" />
              <button
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white/5 text-red-500 dark:text-red-400"
                onClick={() => { signOut(); setOpen(false); }}
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <GameHistoryModal isOpen={showGameHistory} onClose={() => setShowGameHistory(false)} />
      <StudyProgressModal isOpen={showStudyProgress} onClose={() => setShowStudyProgress(false)} />
    </>
  );
}
