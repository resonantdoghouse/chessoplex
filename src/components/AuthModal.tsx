"use client";
import { useState } from "react";
type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getSupabase = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const supabase = await getSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/api/auth/callback` },
    });
  };

  const signInWithEmail = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border shadow-2xl p-6 bg-white/95 border-black/10 dark:bg-zinc-900/95 dark:border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lg leading-none text-zinc-500 dark:text-zinc-400 hover:opacity-70"
        >
          ✕
        </button>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📬</div>
            <p className="font-bold text-lg text-zinc-900 dark:text-white">Check your email</p>
            <p className="text-sm mt-1 text-zinc-500 dark:text-zinc-400">
              We sent a magic link to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="font-bold text-xl text-zinc-900 dark:text-white">Save your progress</p>
              <p className="text-sm mt-1 text-zinc-500 dark:text-zinc-400">
                Sign in to sync games, study history, and stats across devices.
              </p>
            </div>

            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 font-semibold text-sm border transition-opacity bg-white border-black/10 text-zinc-800 hover:bg-zinc-50 dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/15 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-4 text-zinc-500 dark:text-zinc-400">
              <div className="flex-1 h-px bg-current opacity-20" />
              <span className="text-xs">or</span>
              <div className="flex-1 h-px bg-current opacity-20" />
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signInWithEmail()}
                className="flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none bg-black/5 border-black/10 text-zinc-900 placeholder-zinc-400 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-zinc-500"
              />
              <button
                onClick={signInWithEmail}
                disabled={loading || !email}
                className="rounded-xl px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <button
              onClick={onClose}
              className="w-full mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400 hover:opacity-70"
            >
              Continue as guest
            </button>
          </>
        )}
      </div>
    </div>
  );
}
