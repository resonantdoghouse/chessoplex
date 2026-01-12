"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function onDrop({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
  }) {
    console.log(`Attempting move: ${sourceSquare} -> ${targetSquare}`);
    if (!targetSquare) return false;
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to queen for simplicity for now
      });

      console.log("Move result:", move);
      if (move === null) return false;

      // Update state with new FEN to trigger re-render
      const newGame = new Chess(game.fen());
      setGame(newGame);

      // Schedule computer move if game isn't over
      setTimeout(() => {
        makeRandomMove(newGame);
      }, 300);

      return true;
    } catch (error) {
      return false;
    }
  }

  function makeRandomMove(currentGameState: Chess) {
    const possibleMoves = currentGameState.moves();
    if (
      currentGameState.isGameOver() ||
      currentGameState.isDraw() ||
      possibleMoves.length === 0
    )
      return;

    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    currentGameState.move(possibleMoves[randomIndex]);
    setGame(new Chess(currentGameState.fen()));
  }

  function resetGame() {
    setGame(new Chess());
  }

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-[600px] aspect-square">
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
          }}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
}
