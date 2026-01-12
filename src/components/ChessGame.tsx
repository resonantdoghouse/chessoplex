"use client";

import { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard as ChessboardBase } from "react-chessboard";
const Chessboard = ChessboardBase as any;
import GameResultModal from "./GameResultModal";
import GameInfo from "./GameInfo";
import MoveHistory from "./MoveHistory";
import { OPPONENT_NAMES, BOARD_THEMES, BoardTheme } from "@/lib/constants";
import ThemeToggle from "./ThemeToggle";

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
  /* eslint-disable react-hooks/exhaustive-deps */
  const [startTime, setStartTime] = useState<number>(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [gameId, setGameId] = useState(0);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium"
  );
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("default");
  const [showThreats, setShowThreats] = useState(false);
  const [threatenedSquares, setThreatenedSquares] = useState<
    Record<string, React.CSSProperties>
  >({});
  const [showMobileControls, setShowMobileControls] = useState(false);

  // Threat Detection Effect
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
            };
          }
        }
      });
    });
    setThreatenedSquares(newThreats);
  }, [game, showThreats]);

  // Mount & Load Effect
  useEffect(() => {
    setStartTime(Date.now());

    // Auto-Load
    const savedPgn = localStorage.getItem("chess_saved_pgn");
    const savedOpponent = localStorage.getItem("chess_saved_opponent");
    const savedDifficulty = localStorage.getItem("chess_saved_difficulty");
    const savedTheme = localStorage.getItem("chess_saved_theme") as BoardTheme;

    if (savedDifficulty) {
      setDifficulty(savedDifficulty as "Easy" | "Medium" | "Hard");
    }

    if (savedTheme && BOARD_THEMES[savedTheme]) {
      setBoardTheme(savedTheme);
    }

    if (savedPgn && savedOpponent) {
      try {
        const loadedGame = new Chess();
        loadedGame.loadPgn(savedPgn);
        setGame(loadedGame);
        setOpponentName(savedOpponent);

        // Check if the loaded game is already over
        checkGameEnd(loadedGame);

        // FIX: If we loaded a game and it's Black's turn (AI), trigger the move
        // But only if game is NOT over
        if (!loadedGame.isGameOver() && loadedGame.turn() === "b") {
          setTimeout(() => {
            makeRandomMove(loadedGame);
          }, 800);
        }
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

    setMounted(true);
  }, []);

  // Auto-Save Game Effect
  useEffect(() => {
    if (!mounted) return;
    if (game.pgn()) {
      localStorage.setItem("chess_saved_pgn", game.pgn());
      localStorage.setItem("chess_saved_opponent", opponentName);
    }
  }, [game, opponentName, mounted]);

  // Auto-Save Difficulty Effect
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_difficulty", difficulty);
  }, [difficulty, mounted]);

  // Auto-Save Theme Effect
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_theme", boardTheme);
  }, [boardTheme, mounted]);

  function checkGameEnd(currentGame: Chess) {
    if (currentGame.isGameOver()) {
      const endTime = Date.now();
      const durationSeconds = Math.floor(
        (endTime - startTime - totalPausedTime) / 1000
      );
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      const moves = currentGame.moveNumber() - 1;

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
            ? "radial-gradient(circle, rgba(255, 0, 0, 0.5) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0, 0, 0, 0.3) 25%, transparent 25%)", // Increased visibility
        borderRadius: "50%",
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.2)", // Add some shadow for visibility
      };
      return move;
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.6)", // More visible yellow
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string) {
    console.log("onSquareClick:", square);

    if (isPaused) return;

    if (moveFrom === square) {
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    if (moveFrom) {
      const moveResult = handleMove(moveFrom, square);
      if (moveResult) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }
    }

    const piece = game.get(square as Square);
    if (piece && piece.color === game.turn()) {
      setMoveFrom(square);
      getMoveOptions(square);
      return;
    }

    setMoveFrom(null);
    setOptionSquares({});
  }

  function handleMove(source: string, target: string) {
    try {
      const gameCopy = new Chess();
      gameCopy.loadPgn(game.pgn());

      const move = gameCopy.move({
        from: source,
        to: target,
        promotion: "q",
      });

      if (move === null) return false;

      setGame(gameCopy);
      checkGameEnd(gameCopy);

      const delay = getMoveDelay(difficulty);
      setTimeout(() => {
        makeRandomMove(gameCopy);
      }, delay);

      return true;
    } catch (error) {
      // Invalid moves are common (clicking wrong square), so we silence them
      // console.error("Move error:", error);
      return false;
    }
  }

  function getMoveDelay(level: "Easy" | "Medium" | "Hard") {
    switch (level) {
      case "Easy":
        return 1500 + Math.random() * 1000;
      case "Medium":
        return 800 + Math.random() * 500;
      case "Hard":
        return 200 + Math.random() * 300;
      default:
        return 500;
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    console.log("onDrop:", sourceSquare, targetSquare);
    if (isPaused) return false;
    if (!targetSquare) return false;
    return handleMove(sourceSquare, targetSquare);
  }

  function makeRandomMove(startingGame: Chess) {
    if (isPaused) return;

    // Use a clone to ensure we have the latest state and don't mutate props
    const tempGame = new Chess();
    tempGame.loadPgn(startingGame.pgn());

    const possibleMoves = tempGame.moves();
    if (
      tempGame.isGameOver() ||
      tempGame.isDraw() ||
      possibleMoves.length === 0
    )
      return;

    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    tempGame.move(possibleMoves[randomIndex]);

    setGame(tempGame);
    checkGameEnd(tempGame);
  }

  function togglePause() {
    if (isPaused) {
      // Resume
      if (pauseStartTime) {
        const pausedDuration = Date.now() - pauseStartTime;
        setTotalPausedTime((prev) => prev + pausedDuration);
      }
      setPauseStartTime(null);
      setIsPaused(false);
    } else {
      // Pause
      const now = Date.now();
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

    localStorage.removeItem("chess_saved_pgn");
    localStorage.removeItem("chess_saved_opponent");
  }

  if (!mounted) return null;

  return (
    <div className="relative flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center w-full max-w-7xl mx-auto pt-4 lg:pt-0 px-4">
      {/* DEBUG OVERLAY */}

      {/* Dynamic Background Gradient */}
      <div
        className="fixed inset-0 z-[-1] transition-all duration-1000 ease-in-out"
        style={{
          background: BOARD_THEMES[boardTheme].backgroundGradient,
          // Removed blur/brightness as gradients are designed to be backgrounds
        }}
      />

      {/* Desktop Theme Toggle (Hidden on Mobile) */}
      <div className="hidden lg:block absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Chessboard Area - First on Mobile (Order 1) */}
      <div className="w-full lg:flex-1 aspect-square shadow-2xl rounded-xl overflow-hidden border-4 lg:border-8 border-zinc-800/50 dark:border-zinc-800/50 border-zinc-200/50 relative z-0 order-1 lg:order-1">
        <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900 -z-10 pointer-events-none"></div>
        {mounted ? (
          <Chessboard
            key={boardTheme}
            id="BasicBoard"
            position={game.fen()}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            onPieceClick={(_: string, square: string) => onSquareClick(square)} // Use onSquareClick for consistency
            arePiecesDraggable={!isPaused}
            customSquareStyles={{ ...optionSquares, ...threatenedSquares }}
            customDarkSquareStyle={{
              backgroundColor: BOARD_THEMES[boardTheme].dark,
            }}
            customLightSquareStyle={{
              backgroundColor: BOARD_THEMES[boardTheme].light,
            }}
          />
        ) : (
          <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg flex items-center justify-center">
            <span className="text-zinc-400 font-bold">Loading Board...</span>
          </div>
        )}
        {isPaused && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 transition-all duration-500">
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <h2 className="text-4xl lg:text-5xl font-black text-white tracking-wider drop-shadow-lg">
                PAUSED
              </h2>
              <p className="text-zinc-400 font-mono text-xs lg:text-sm">
                Game timer is stopped
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Info Section - Below Board (Order 2 on Mobile) */}
      <div className="w-full lg:hidden flex flex-col gap-4 mt-2 order-2">
        <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-lg">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider leading-none text-zinc-900 dark:text-white drop-shadow-sm">
              Chessoplex
            </h1>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">
              PREMIUM CHESS
            </p>
          </div>
          <ThemeToggle />
        </div>

        <GameInfo
          key={`mobile-${gameId}`}
          turn={game.turn()}
          startTime={startTime}
          gameStatus={gameResult ? gameResult.reason : null}
          isPaused={isPaused}
          totalPausedTime={totalPausedTime}
          opponentName={opponentName}
        />

        {/* DEBUG OVERLAY */}

        <button
          onClick={() => setShowMobileControls(true)}
          className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-black tracking-wider rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <span>⚙️</span> OPEN CONTROLS
        </button>
      </div>

      {/* Sidebar (Desktop) / Drawer (Mobile) - Stats & History */}
      <div
        className={`
            fixed inset-x-0 bottom-0 z-50 p-4 lg:p-0 rounded-t-3xl lg:rounded-none border-t border-white/20 dark:border-white/10 lg:border-none
            bg-white/80 dark:bg-zinc-900/80 lg:bg-transparent lg:dark:bg-transparent backdrop-blur-xl lg:backdrop-blur-none shadow-[0_-10px_40px_rgba(0,0,0,0.3)] lg:shadow-none
            transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)
            flex flex-col gap-4 shrink-0 h-[85vh] lg:h-[calc(100vh-2rem)] lg:sticky lg:top-4 overflow-hidden
            lg:w-96 lg:translate-y-0 lg:order-2
            ${
              showMobileControls
                ? "translate-y-0"
                : "translate-y-[110%] lg:translate-y-0"
            }
        `}
      >
        {/* Mobile Drawer Header */}
        <div className="lg:hidden w-full flex flex-col items-center gap-2 mb-2 sticky top-0 z-50 -mt-2 pt-2 shrink-0">
          <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
          <div className="w-full flex justify-between items-center mt-2">
            <h3 className="font-bold text-lg dark:text-white">Game Controls</h3>
            <button
              onClick={() => setShowMobileControls(false)}
              className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full font-bold w-10 h-10 flex items-center justify-center transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 pr-1 lg:pr-0">
          {/* Desktop Only: Game Info */}
          <div className="hidden lg:block shrink-0">
            <GameInfo
              key={`desktop-${gameId}`}
              turn={game.turn()}
              startTime={startTime}
              gameStatus={gameResult ? gameResult.reason : null}
              isPaused={isPaused}
              totalPausedTime={totalPausedTime}
              opponentName={opponentName}
            />
          </div>

          <div className="flex bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-1 rounded-xl border border-white/20 dark:border-white/10 shrink-0 shadow-lg">
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

          {/* Board Theme Selector */}
          <div className="shrink-0">
            <div className="flex justify-between items-end px-1 pb-1">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Theme
              </span>
              <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
                {BOARD_THEMES[boardTheme].name}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 p-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/10 shadow-lg">
              {Object.entries(BOARD_THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setBoardTheme(key as BoardTheme)}
                  title={theme.name}
                  className={`aspect-square rounded-full border-2 transition-all hover:scale-110 active:scale-95 shadow-sm ${
                    boardTheme === key
                      ? "border-zinc-900 dark:border-white scale-110 shadow-md ring-2 ring-zinc-500/30"
                      : "border-transparent hover:border-black/20 dark:hover:border-white/20"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.light} 50%, ${theme.dark} 50%)`,
                  }}
                  aria-label={`Select ${theme.name} Theme`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowThreats(!showThreats)}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all border shrink-0 ${
              showThreats
                ? "bg-red-500/90 hover:bg-red-600 text-white border-red-400 shadow-md shadow-red-900/20"
                : "bg-white/50 hover:bg-white/80 text-zinc-600 border-black/5 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-400 dark:border-white/5"
            }`}
          >
            {showThreats ? "🛡️ THREATS VISIBLE" : "🛡️ SHOW THREATS"}
          </button>

          {/* Flexible History Container */}
          <div className="flex-grow flex flex-col min-h-[150px] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <MoveHistory history={game.history()} />
          </div>
        </div>

        {/* Action Buttons - Always visible at bottom */}
        <div className="grid grid-cols-2 gap-3 shrink-0 pt-2 lg:pt-0">
          <button
            onClick={togglePause}
            aria-label={isPaused ? "Resume Game" : "Pause Game"}
            className={`py-3 px-6 font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border ${
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
            className="w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-white/10"
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
