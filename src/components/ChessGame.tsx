"use client";

import { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import GameResultModal from "./GameResultModal";
import GameInfo from "./GameInfo";
import MoveHistory from "./MoveHistory";
import { OPPONENT_NAMES } from "@/lib/constants";
import ThemeToggle from "./ThemeToggle"; // Pre-emptively adding for next step

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [mounted, setMounted] = useState(false);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState("");
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
  const [gameId, setGameId] = useState(0);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium"
  );
  const [showThreats, setShowThreats] = useState(false);
  const [threatenedSquares, setThreatenedSquares] = useState<
    Record<string, React.CSSProperties>
  >({});

  useEffect(() => {
    if (!showThreats) {
      setThreatenedSquares({});
      return;
    }

    const newThreats: Record<string, React.CSSProperties> = {};
    const board = game.board();
    const currentTurn = game.turn();
    const opponentColor = currentTurn === "w" ? "b" : "w";

    // Iterate through all squares
    const rows = ["1", "2", "3", "4", "5", "6", "7", "8"];
    const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];

    cols.forEach((col) => {
      rows.forEach((row) => {
        const square = (col + row) as Square;
        const piece = game.get(square);

        // If square has our piece and is attacked by opponent
        if (piece && piece.color === currentTurn) {
          // chess.js v1+ support isAttacked
          if (game.isAttacked(square, opponentColor)) {
            newThreats[square] = {
              background:
                "radial-gradient(circle, rgba(255, 0, 0, 0.5) 50%, transparent 50%)",
              // Or full square: backgroundColor: "rgba(255, 0, 0, 0.3)"
            };
          }
        }
      });
    });
    setThreatenedSquares(newThreats);
  }, [game, showThreats]);

  useEffect(() => {
    setMounted(true);
    setStartTime(Date.now());

    // Auto-Load
    const savedPgn = localStorage.getItem("chess_saved_pgn");
    const savedOpponent = localStorage.getItem("chess_saved_opponent");

    if (savedPgn && savedOpponent) {
      try {
        const loadedGame = new Chess();
        loadedGame.loadPgn(savedPgn);
        setGame(loadedGame);
        setOpponentName(savedOpponent);
        // Optionally check if game is over to show modal?
        // For now, let's just load the state.
        // If the game was saved in a 'game over' state, checkGameEnd below would trigger modal if we called it,
        // but we don't want to show modal immediately on reload if user dismissed it.
      } catch (e) {
        console.error("Failed to load saved game:", e);
        // Fallback to new game
        setOpponentName(
          OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)]
        );
      }
    } else {
      setOpponentName(
        OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)]
      );
    }
  }, []);

  // Auto-Save
  useEffect(() => {
    if (!mounted) return;
    if (game.pgn()) {
      localStorage.setItem("chess_saved_pgn", game.pgn());
      localStorage.setItem("chess_saved_opponent", opponentName);
    }
  }, [game, opponentName, mounted]);

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

      // Update state with PGN to preserve history
      const newGame = new Chess();
      newGame.loadPgn(game.pgn());
      setGame(newGame);

      checkGameEnd(newGame);

      // Schedule computer move if game isn't over
      const delay = getMoveDelay(difficulty);
      setTimeout(() => {
        makeRandomMove(newGame);
      }, delay);

      return true;
    } catch (error) {
      console.error("Move error:", error);
      return false;
    }
  }

  function getMoveDelay(level: "Easy" | "Medium" | "Hard") {
    switch (level) {
      case "Easy":
        return 1500 + Math.random() * 1000; // Slow: 1.5s - 2.5s
      case "Medium":
        return 800 + Math.random() * 500; // Medium: 0.8s - 1.3s
      case "Hard":
        return 200 + Math.random() * 300; // Fast: 0.2s - 0.5s
      default:
        return 500;
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

    const nextGame = new Chess();
    nextGame.loadPgn(currentGameState.pgn());

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
    setGameId((prev) => prev + 1);
    setOpponentName(
      OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)]
    );

    // Clear saved game (but keep difficulty!)
    localStorage.removeItem("chess_saved_pgn");
    localStorage.removeItem("chess_saved_opponent");
    // Do NOT clear chess_saved_difficulty
  }

  if (!mounted) return null;

  return (
    <div className="relative flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-7xl mx-auto pt-16 lg:pt-0">
      <div className="absolute top-0 right-0 z-50">
        <ThemeToggle />
      </div>

      {/* Chessboard Area - Glassy container */}
      <div className="w-full lg:flex-1 max-w-[85vh] aspect-square shadow-2xl rounded-xl overflow-hidden border-8 border-zinc-800/50 dark:border-zinc-800/50 border-zinc-200/50 relative">
        <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900 -z-10"></div>
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
            onSquareClick: onSquareClick,
            squareStyles: { ...optionSquares, ...threatenedSquares },
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
          key={gameId}
          turn={game.turn()}
          startTime={startTime}
          gameStatus={gameResult ? gameResult.reason : null}
          isPaused={isPaused}
          totalPausedTime={totalPausedTime}
          opponentName={opponentName}
        />

        <div className="flex bg-white/50 dark:bg-black/30 p-1 rounded-xl border border-black/5 dark:border-white/5">
          {(["Easy", "Medium", "Hard"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              aria-label={`Select ${level} Difficulty`}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                difficulty === level
                  ? "bg-zinc-800 text-white shadow-md dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowThreats(!showThreats)}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all border ${
            showThreats
              ? "bg-red-500/90 hover:bg-red-600 text-white border-red-400 shadow-md shadow-red-900/20"
              : "bg-white/50 hover:bg-white/80 text-zinc-600 border-black/5 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-400 dark:border-white/5"
          }`}
        >
          {showThreats ? "🛡️ THREATS VISIBLE" : "🛡️ SHOW THREATS"}
        </button>

        <div className="flex-grow overflow-hidden flex flex-col min-h-[300px] lg:min-h-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-black/10 dark:border-white/10 shadow-xl">
          <MoveHistory history={game.history()} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={togglePause}
            aria-label={isPaused ? "Resume Game" : "Pause Game"}
            className={`py-4 px-6 font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border ${
              isPaused
                ? "bg-gradient-to-br from-yellow-500 to-yellow-700 text-white border-yellow-400/50 shadow-yellow-900/40"
                : "bg-white hover:bg-zinc-100 text-zinc-800 border-black/10 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:border-white/10"
            }`}
          >
            {isPaused ? "RESUME" : "PAUSE"}
          </button>
          <button
            onClick={resetGame}
            aria-label="Start New Game"
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
