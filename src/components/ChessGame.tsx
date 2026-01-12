"use client";

import { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import GameResultModal from "./GameResultModal";
import GameInfo from "./GameInfo";
import MoveHistory from "./MoveHistory";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [mounted, setMounted] = useState(false);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<
    Record<string, React.CSSProperties>
  >({});

  // Game stats state
  const [gameResult, setGameResult] = useState<{
    winner: "white" | "black" | "draw";
    reason: string;
  } | null>(null);
  const [gameStats, setGameStats] = useState<{
    moves: number;
    duration: string;
  } | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setStartTime(Date.now());
  }, []);

  function checkGameEnd(currentGame: Chess) {
    if (currentGame.isGameOver()) {
      const endTime = Date.now();
      const durationSeconds = Math.floor(
        (endTime - startTime - totalPausedTime) / 1000
      );
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      const moves = currentGame.moveNumber() - 1; // moveNumber is 1-based and increments after white moves

      let winner: "white" | "black" | "draw" = "draw";
      let reason = "";

      if (currentGame.isCheckmate()) {
        winner = currentGame.turn() === "w" ? "black" : "white";
        reason = "Checkmate";
      } else if (currentGame.isDraw()) {
        winner = "draw";
        if (currentGame.isStalemate()) reason = "Stalemate";
        else if (currentGame.isThreefoldRepetition())
          reason = "Threefold Repetition";
        else if (currentGame.isInsufficientMaterial())
          reason = "Insufficient Material";
        else reason = "Draw";
      }

      setGameResult({ winner, reason });
      setGameStats({ moves, duration });
      setIsModalOpen(true);
    }
  }

  function getMoveOptions(square: string) {
    const moves = game.moves({
      square: square as Square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};
    moves.map((move) => {
      const targetSquare = move.to as Square;
      const piece = game.get(targetSquare);
      newSquares[targetSquare] = {
        background:
          piece && piece.color !== game.turn()
            ? "radial-gradient(circle, rgba(0,0,0,.5) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.5) 25%, transparent 25%)",
        borderRadius: "50%",
      };
      return move;
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick({ square }: { square: string }) {
    if (isPaused) return;

    // If we click the same square twice, reset
    if (moveFrom === square) {
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    // Attempt to move
    if (moveFrom) {
      const moveResult = handleMove(moveFrom, square);
      // If move was successful, reset state (handled in handleMove somewhat, but let's be explicitly clear)
      if (moveResult) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }
    }

    // If we are clicking a new piece to possibly move
    const piece = game.get(square as Square);
    if (piece && piece.color === game.turn()) {
      setMoveFrom(square);
      getMoveOptions(square);
      return;
    }

    // Clicked empty square or opponent piece without a valid move source -> reset
    setMoveFrom(null);
    setOptionSquares({});
  }

  function handleMove(source: string, target: string) {
    try {
      const move = game.move({
        from: source,
        to: target,
        promotion: "q", // always promote to queen for simplicity for now
      });

      if (move === null) return false;

      // Update state with new FEN to trigger re-render
      const newGame = new Chess(game.fen());
      setGame(newGame);

      checkGameEnd(newGame);

      // Schedule computer move if game isn't over
      setTimeout(() => {
        makeRandomMove(newGame);
      }, 300);

      return true;
    } catch (error) {
      return false;
    }
  }

  function onDrop({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
  }) {
    if (isPaused) return false;
    if (!targetSquare) return false;
    return handleMove(sourceSquare, targetSquare);
  }

  function makeRandomMove(currentGameState: Chess) {
    if (isPaused) return;

    const possibleMoves = currentGameState.moves();
    if (
      currentGameState.isGameOver() ||
      currentGameState.isDraw() ||
      possibleMoves.length === 0
    )
      return;

    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    currentGameState.move(possibleMoves[randomIndex]);
    const nextGame = new Chess(currentGameState.fen());
    setGame(nextGame);
    checkGameEnd(nextGame);
  }

  function togglePause() {
    console.log(
      "togglePause called. isPaused:",
      isPaused,
      "pauseStartTime:",
      pauseStartTime
    );
    if (isPaused) {
      // Resume
      if (pauseStartTime) {
        const pausedDuration = Date.now() - pauseStartTime;
        console.log("Calculated pausedDuration:", pausedDuration);
        setTotalPausedTime((prev) => {
          console.log(
            "Updating totalPausedTime. Prev:",
            prev,
            "New:",
            prev + pausedDuration
          );
          return prev + pausedDuration;
        });
      } else {
        console.error("pauseStartTime is null during resume!");
      }
      setPauseStartTime(null);
      setIsPaused(false);
    } else {
      // Pause
      const now = Date.now();
      console.log("Pausing at:", now);
      setPauseStartTime(now);
      setIsPaused(true);
    }
  }

  function resetGame() {
    setGame(new Chess());
    setMoveFrom(null);
    setOptionSquares({});
    setStartTime(Date.now());
    setIsModalOpen(false);
    setGameResult(null);
    setGameStats(null);
    setTotalPausedTime(0);
    setPauseStartTime(null);
    setIsPaused(false);
  }

  if (!mounted) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-7xl mx-auto">
      {/* Chessboard Area - Glassy container */}
      <div className="w-full lg:flex-1 max-w-[85vh] aspect-square shadow-2xl rounded-xl overflow-hidden border-8 border-zinc-800/50 relative">
        <div className="absolute inset-0 bg-zinc-900 -z-10"></div>
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
            onSquareClick: onSquareClick,
            squareStyles: optionSquares,
            // Improve board aesthetics if possible via options, but strict props limit us.
            // We can check react-chessboard props for custom dark/light squares but let's stick to defaults for now as they are robust.
          }}
        />
        {isPaused && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 transition-all duration-500">
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <h2 className="text-5xl font-black text-white tracking-wider drop-shadow-lg">
                PAUSED
              </h2>
              <p className="text-zinc-400 font-mono text-sm">
                Game timer is stopped
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Stats & History */}
      <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 h-full max-h-[85vh]">
        <GameInfo
          turn={game.turn()}
          startTime={startTime}
          gameStatus={gameResult ? gameResult.reason : null}
          isPaused={isPaused}
          totalPausedTime={totalPausedTime}
        />

        <div className="flex-grow overflow-hidden flex flex-col min-h-0 bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
          <MoveHistory history={game.history()} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={togglePause}
            className={`w-full py-4 px-6 font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border ${
              isPaused
                ? "bg-gradient-to-br from-yellow-500 to-yellow-700 text-white border-yellow-400/50 shadow-yellow-900/40"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-white/10"
            }`}
          >
            {isPaused ? "RESUME" : "PAUSE"}
          </button>
          <button
            onClick={resetGame}
            className="w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-white/10"
          >
            NEW GAME
          </button>
        </div>
      </div>

      <GameResultModal
        isOpen={isModalOpen}
        gameResult={gameResult}
        stats={gameStats}
        onReset={resetGame}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
