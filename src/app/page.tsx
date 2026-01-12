import ChessGame from "../components/ChessGame";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] transition-colors duration-500 from-zinc-100 via-zinc-200 to-zinc-300 dark:from-zinc-800 dark:via-zinc-900 dark:to-black">
      <h1 className="hidden lg:block mb-8 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br tracking-widest uppercase drop-shadow-2xl from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-400">
        Chessoplex
      </h1>
      <ChessGame />
    </main>
  );
}
