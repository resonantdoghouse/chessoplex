"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";

type Props = {
  isLightUi?: boolean;
};

export default function UserMenu({ isLightUi = false }: Props) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const textClass = isLightUi ? "text-zinc-700" : "text-zinc-300";
  const menuBg = isLightUi
    ? "bg-white border-black/10 shadow-xl"
    : "bg-zinc-900 border-white/10 shadow-2xl";

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Guest";

  return (
    <>
      <div className="relative">
        <button
          onClick={() => (user ? setOpen((v) => !v) : setShowAuth(true))}
          className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-opacity hover:opacity-80 ${textClass}`}
          title={user ? displayName : "Sign in"}
        >
          {user && avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              isLightUi ? "bg-black/10 text-zinc-600" : "bg-white/10 text-zinc-300"
            }`}>
              {user ? displayName[0].toUpperCase() : "?"}
            </div>
          )}
          <span className="text-xs font-semibold hidden sm:block">
            {user ? displayName : "Sign in"}
          </span>
        </button>

        {open && user && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className={`absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border p-1 ${menuBg}`}>
              <div className={`px-3 py-2 text-xs font-semibold truncate ${textClass} opacity-60`}>
                {user.email}
              </div>
              <div className={`mx-2 my-1 h-px ${isLightUi ? "bg-black/10" : "bg-white/10"}`} />
              <button
                className={`w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white/5 ${textClass}`}
                onClick={() => { setOpen(false); }}
              >
                Game History
              </button>
              <button
                className={`w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white/5 ${textClass}`}
                onClick={() => { setOpen(false); }}
              >
                Study Progress
              </button>
              <div className={`mx-2 my-1 h-px ${isLightUi ? "bg-black/10" : "bg-white/10"}`} />
              <button
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white/5 text-red-400"
                onClick={() => { signOut(); setOpen(false); }}
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} isLightUi={isLightUi} />
    </>
  );
}
