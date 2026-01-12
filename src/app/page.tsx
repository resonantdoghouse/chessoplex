import ChessGame from "../components/ChessGame";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black p-4 lg:p-8">
      <h1 className="mb-8 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 tracking-widest uppercase drop-shadow-2xl">
        Chessoplex
      </h1>
      <ChessGame />
    </main>
  );
}
