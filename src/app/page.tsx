import ChessGame from "../components/ChessGame";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-8">
      <h1 className="mb-8 text-4xl font-bold text-white tracking-widest uppercase">
        Chessoplex
      </h1>
      <ChessGame />
    </main>
  );
}
