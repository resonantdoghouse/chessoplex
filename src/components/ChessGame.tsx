"use client";

import { useState, useEffect, useRef } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard as ChessboardBase } from "react-chessboard";
const Chessboard = ChessboardBase as any;
import GameOverModal from "./GameOverModal";
import GameInfo from "./GameInfo";
import MoveHistory from "./MoveHistory";
import EvalBar from "./EvalBar";
import AudioControls from "./AudioControls";
import { OPPONENT_NAMES, BOARD_THEMES, BoardTheme } from "@/lib/constants";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { useEngine } from "../hooks/useEngine";
import { useAudio } from "../hooks/useAudio";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [mounted, setMounted] = useState(false);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [optionSquares, setOptionSquares] = useState<
    Record<string, React.CSSProperties>
  >({});

  const engine = useEngine();
  const {
    playMoveSound,
    sfxEnabled, setSfxEnabled,
    bgPlaying, toggleBgMusic,
    currentSong, setSong,
    currentInstrument, setInstrument,
  } = useAudio();
  const [moveAnnotations, setMoveAnnotations] = useState<string[]>([]);
  const lastEvalRef = useRef<number>(0);
  const [currentEval, setCurrentEval] = useState<{ evaluation?: number; mate?: number }>({});

  // Game stats state
  const [gameResult, setGameResult] = useState<{
    winner: "w" | "b" | "draw";
    reason: string;
  } | null>(null);
  const [gameStats, setGameStats] = useState<{
    moves: number;
    duration: string;
  } | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const { theme } = useTheme();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [gameId, setGameId] = useState(0);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium",
  );
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("default");
  const [showThreats, setShowThreats] = useState(false);
  const [threatenedSquares, setThreatenedSquares] = useState<
    Record<string, React.CSSProperties>
  >({});
  // Threat Detection Effect
  useEffect(() => {
    if (!showThreats) {
      setThreatenedSquares({});
      return;
    }

    const newThreats: Record<string, React.CSSProperties> = {};
    const currentTurn = game.turn();
    const opponentColor = currentTurn === "w" ? "b" : "w";

    const rows = ["1", "2", "3", "4", "5", "6", "7", "8"];
    const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];

    cols.forEach((col) => {
      rows.forEach((row) => {
        const square = (col + row) as Square;
        const piece = game.get(square);

        if (piece && piece.color === currentTurn) {
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

    const savedPgn = localStorage.getItem("chess_saved_pgn");
    const savedOpponent = localStorage.getItem("chess_saved_opponent");
    const savedDifficulty = localStorage.getItem("chess_saved_difficulty");
    const savedTheme = localStorage.getItem("chess_saved_theme") as BoardTheme;
    const savedAnnotations = localStorage.getItem("chess_saved_annotations");

    if (savedDifficulty)
      setDifficulty(savedDifficulty as "Easy" | "Medium" | "Hard");
    if (savedTheme && BOARD_THEMES[savedTheme]) setBoardTheme(savedTheme);
    if (savedAnnotations) {
      try {
        setMoveAnnotations(JSON.parse(savedAnnotations));
      } catch (e) {}
    }

    if (savedPgn && savedOpponent) {
      try {
        const loadedGame = new Chess();
        loadedGame.loadPgn(savedPgn);
        setGame(loadedGame);
        setOpponentName(savedOpponent);

        checkGameEnd(loadedGame);

        if (!loadedGame.isGameOver() && loadedGame.turn() === "b") {
          setTimeout(() => {
            makeAITurn(loadedGame);
          }, 800);
        }
      } catch (e) {
        setOpponentName(
          OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)],
        );
      }
    } else {
      setOpponentName(
        OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)],
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
      localStorage.setItem(
        "chess_saved_annotations",
        JSON.stringify(moveAnnotations),
      );
    }
  }, [game, opponentName, mounted, moveAnnotations]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_difficulty", difficulty);
  }, [difficulty, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_theme", boardTheme);
  }, [boardTheme, mounted]);

  function checkGameEnd(currentGame: Chess) {
    if (currentGame.isGameOver()) {
      const endTime = Date.now();
      const durationSeconds = Math.floor(
        (endTime - startTime - totalPausedTime) / 1000,
      );
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      const moves = currentGame.moveNumber() - 1;

      let winner: "w" | "b" | "draw" = "draw";
      let reason = "";

      if (currentGame.isCheckmate()) {
        winner = currentGame.turn() === "w" ? "b" : "w";
        reason = "Checkmate";
      } else if (currentGame.isDraw()) {
        winner = "draw";
        if (currentGame.isStalemate()) reason = "Stalemate";
        else if (currentGame.isThreefoldRepetition())
          reason = "Threefold Repetition";
        else if (currentGame.isInsufficientMaterial())
          reason = "Insufficient Material";
        else reason = "50-Move Rule";
      }

      setGameResult({ winner, reason });
      setGameStats({ moves, duration });
      setIsModalOpen(true);
      return true;
    }
    return false;
  }

  function getMoveOptions(square: string) {
    const moves = game.moves({ square: square as Square, verbose: true });
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
            : "radial-gradient(circle, rgba(0, 0, 0, 0.3) 25%, transparent 25%)",
        borderRadius: "50%",
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.2)",
      };
      return move;
    });
    newSquares[square] = { background: "rgba(255, 255, 0, 0.6)" };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string) {
    if (isPaused || game.turn() === "b") return;

    if (moveFrom === square) {
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    if (moveFrom) {
      handleMove(moveFrom, square);
      setMoveFrom(null);
      setOptionSquares({});
      return;
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

  async function handleMove(source: string, target: string) {
    try {
      const gameCopy = new Chess(game.fen());
      // Re-apply history
      gameCopy.loadPgn(game.pgn());

      const move = gameCopy.move({ from: source, to: target, promotion: "q" });
      if (move === null) return false;

      // Optimistically update UI
      setGame(gameCopy);
      playMoveSound();
      const isEnded = checkGameEnd(gameCopy);

      if (isEnded) {
        return true; // Cancel engine evaluation/move immediately
      }

      // Evaluate the move they just made to annotate it
      if (engine.isReady) {
        // Quick evaluation of the resulting position
        const result = await engine.evaluatePosition(gameCopy.fen(), 5);
        annotateMove(result.evaluation, result.mate, move.color);
        setCurrentEval({ evaluation: result.evaluation, mate: result.mate });
      } else {
        setMoveAnnotations((prev) => [...prev, ""]);
      }

      const delay =
        difficulty === "Easy" ? 1000 : difficulty === "Medium" ? 500 : 200;
      setTimeout(() => {
        makeAITurn(gameCopy);
      }, delay);

      return true;
    } catch (error) {
      return false;
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (isPaused || game.turn() === "b") return false;
    if (!targetSquare) return false;
    return handleMove(sourceSquare, targetSquare);
  }

  function annotateMove(
    newEval: number | undefined,
    mate: number | undefined,
    color: string,
  ) {
    let annotation = "";

    // Very naive annotation logic
    if (game.moveNumber() <= 4) {
      annotation = "Book Move";
    } else if (newEval !== undefined) {
      // evaluation is from the perspective of white
      let delta = newEval - lastEvalRef.current;
      if (color === "b") delta = -delta; // Black wants evaluation to drop

      if (delta < -2.5) annotation = "Blunder";
      else if (delta < -1.0) annotation = "Mistake";
      else if (delta > 2.0) annotation = "Great Move";

      lastEvalRef.current = newEval;
    } else if (mate !== undefined) {
      let currentMateDirection = mate > 0 ? "w" : "b";
      if (currentMateDirection !== color) {
        annotation = "Blunder"; // Gave away mate
      }
    }

    setMoveAnnotations((prev) => {
      const arr = [...prev];
      arr.push(annotation);
      return arr;
    });
  }

  async function makeAITurn(startingGame: Chess) {
    if (isPaused) return;

    const tempGame = new Chess();
    tempGame.loadPgn(startingGame.pgn());

    const possibleMoves = tempGame.moves();
    if (tempGame.isGameOver() || possibleMoves.length === 0) return;

    let moveMade = false;

    if (engine.isReady) {
      const depth = engine.setDifficulty(difficulty);
      const result = await engine.evaluatePosition(tempGame.fen(), depth || 10);

      if (result.move) {
        try {
          const from = result.move.substring(0, 2);
          const to = result.move.substring(2, 4);
          const promotion = result.move.length > 4 ? result.move[4] : undefined;

          const moveObj = tempGame.move({ from, to, promotion });
          if (moveObj) {
            moveMade = true;
            playMoveSound();
            annotateMove(result.evaluation, result.mate, "b");
            setCurrentEval({ evaluation: result.evaluation, mate: result.mate });
          }
        } catch (e) {
          console.error("Engine move error", e);
        }
      }
    }

    if (!moveMade) {
      // Fallback or random move if engine fails
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      tempGame.move(possibleMoves[randomIndex]);
      playMoveSound();
      setMoveAnnotations((prev) => [...prev, ""]);
    }

    setGame(tempGame);
    checkGameEnd(tempGame);
  }

  function togglePause() {
    if (isPaused) {
      if (pauseStartTime)
        setTotalPausedTime((prev) => prev + (Date.now() - pauseStartTime));
      setPauseStartTime(null);
      setIsPaused(false);
    } else {
      setPauseStartTime(Date.now());
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
    lastEvalRef.current = 0;
    setMoveAnnotations([]);
    setCurrentEval({});
    setOpponentName(
      OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)],
    );

    localStorage.removeItem("chess_saved_pgn");
    localStorage.removeItem("chess_saved_opponent");
    localStorage.removeItem("chess_saved_annotations");
  }

  if (!mounted) return null;

  const isLightUi = (BOARD_THEMES[boardTheme] as any).uiMode === "light";
  const panelBaseClass = isLightUi
    ? "bg-white/90 border-black/10 shadow-xl"
    : "bg-white/80 dark:bg-zinc-900/80 border-white/20 dark:border-white/10";
  const textBaseClass = isLightUi
    ? "text-zinc-950"
    : "text-zinc-900 dark:text-white";
  const subTextClass = isLightUi
    ? "text-zinc-600"
    : "text-zinc-500 dark:text-zinc-400";

  return (
    <div className="chess-game-layout w-full max-w-7xl mx-auto">
      {/* Background gradient */}
      <div
        className="fixed inset-0 z-[-1] transition-all duration-1000 ease-in-out"
        style={{
          background:
            theme === "dark"
              ? BOARD_THEMES[boardTheme].gradientDark
              : (BOARD_THEMES[boardTheme] as any).gradientLight ||
                BOARD_THEMES[boardTheme].gradientDark,
        }}
      />

      <GameOverModal
        isOpen={!!gameResult}
        gameStatus={gameResult ? gameResult.reason : null}
        winner={gameResult ? gameResult.winner : null}
        onRestart={resetGame}
        isLightUi={isLightUi}
      />

      {/* ── Board column ── */}
      <div className="chess-board-column">
        <div className="chess-board-group">
          {/* Eval bar — shown md+ via CSS */}
          <div className="chess-eval-bar">
            <EvalBar
              evaluation={currentEval.evaluation}
              mate={currentEval.mate}
              isLightUi={isLightUi}
            />
          </div>

          {/* Chess board */}
          <div className={`chess-board-area shadow-2xl rounded-xl overflow-hidden border-4 md:border-8 border-zinc-800/50 dark:border-zinc-800/50 border-zinc-200/50 z-0`}>
            <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900 -z-10 pointer-events-none" />
            <Chessboard
              key={boardTheme}
              id="BasicBoard"
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              onPieceClick={(_: string, square: string) => onSquareClick(square)}
              arePiecesDraggable={!isPaused && game.turn() === "w"}
              customSquareStyles={{ ...optionSquares, ...threatenedSquares }}
              customDarkSquareStyle={{ backgroundColor: BOARD_THEMES[boardTheme].dark }}
              customLightSquareStyle={{ backgroundColor: BOARD_THEMES[boardTheme].light }}
            />
            {isPaused && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                  <h2 className="text-4xl font-black text-white tracking-wider drop-shadow-lg">
                    PAUSED
                  </h2>
                  <p className="text-zinc-400 font-mono text-xs">Game timer is stopped</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sidebar / controls column ── */}
      <div className="chess-sidebar">
        {/* Title */}
        <div className="flex items-center justify-between px-1 shrink-0">
          <div>
            <h1
              className={`text-2xl md:text-3xl font-black uppercase tracking-widest drop-shadow-2xl transition-colors duration-300 ${isLightUi ? "text-zinc-900" : "text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400"}`}
            >
              Chessoplex
            </h1>
            <p className={`text-[10px] font-bold tracking-wider ${subTextClass}`}>
              PREMIUM CHESS
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Game info */}
        <GameInfo
          key={gameId}
          turn={game.turn()}
          startTime={startTime}
          gameStatus={gameResult ? gameResult.reason : null}
          isPaused={isPaused}
          totalPausedTime={totalPausedTime}
          opponentName={opponentName}
          isLightUi={isLightUi}
        />

        {/* Difficulty */}
        <div className={`flex p-1 rounded-xl border shrink-0 shadow-lg ${panelBaseClass}`}>
          {(["Easy", "Medium", "Hard"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              aria-label={`Select ${level} Difficulty`}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${difficulty === level ? (isLightUi ? "bg-zinc-900 text-white shadow-md" : "bg-zinc-800 text-white shadow-md dark:bg-white dark:text-zinc-900") : `hover:bg-black/5 ${subTextClass} ${!isLightUi ? "dark:hover:bg-white/5" : ""}`}`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Board theme */}
        <div className="shrink-0">
          <div className="flex justify-between items-end px-1 pb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${subTextClass}`}>
              Theme
            </span>
            <span className={`text-xs font-black uppercase tracking-widest ${textBaseClass}`}>
              {BOARD_THEMES[boardTheme].name}
            </span>
          </div>
          <div className={`grid grid-cols-4 gap-2 p-3 rounded-xl border shadow-lg ${panelBaseClass}`}>
            {Object.entries(BOARD_THEMES).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => setBoardTheme(key as BoardTheme)}
                title={theme.name}
                className={`aspect-square rounded-full border-2 transition-all hover:scale-110 active:scale-95 shadow-sm ${boardTheme === key ? `scale-110 shadow-md ring-2 ${isLightUi ? "border-zinc-900 ring-zinc-500/30" : "border-zinc-900 dark:border-white ring-zinc-500/30"}` : `border-transparent hover:border-black/20 ${!isLightUi ? "dark:hover:border-white/20" : ""}`}`}
                style={{ background: `linear-gradient(135deg, ${theme.light} 50%, ${theme.dark} 50%)` }}
                aria-label={`Select ${theme.name} Theme`}
              />
            ))}
          </div>
        </div>

        {/* Audio controls */}
        <AudioControls
          sfxEnabled={sfxEnabled}
          onToggleSfx={() => setSfxEnabled(!sfxEnabled)}
          bgPlaying={bgPlaying}
          onToggleBgMusic={toggleBgMusic}
          currentSong={currentSong}
          onSetSong={setSong}
          currentInstrument={currentInstrument}
          onSetInstrument={setInstrument}
          isLightUi={isLightUi}
        />

        {/* Show threats */}
        <button
          onClick={() => setShowThreats(!showThreats)}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all border shrink-0 ${showThreats ? "bg-red-500/90 hover:bg-red-600 text-white border-red-400 shadow-md shadow-red-900/20" : `${isLightUi ? "bg-white/50 hover:bg-white/80 text-zinc-600 border-black/5" : "bg-white/50 hover:bg-white/80 text-zinc-600 border-black/5 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-400 dark:border-white/5"}`}`}
        >
          {showThreats ? "🛡️ THREATS VISIBLE" : "🛡️ SHOW THREATS"}
        </button>

        {/* Move history */}
        <div
          className={`min-h-[150px] md:flex-1 rounded-2xl border shadow-2xl ring-1 ring-black/5 overflow-hidden ${isLightUi ? "bg-white/80 border-black/10" : "bg-white/70 dark:bg-zinc-900/70 border-white/20 dark:border-white/10 backdrop-blur-xl"}`}
        >
          <MoveHistory
            history={game.history({ verbose: true })}
            annotations={moveAnnotations}
          />
        </div>

        {/* Pause / New game */}
        <div className="grid grid-cols-2 gap-3 shrink-0 pb-2 md:pb-0">
          <button
            onClick={togglePause}
            aria-label={isPaused ? "Resume Game" : "Pause Game"}
            className={`py-3 px-6 font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border ${isPaused ? "bg-gradient-to-br from-yellow-500 to-yellow-700 text-white border-yellow-400/50 shadow-yellow-900/40" : `${isLightUi ? "bg-white hover:bg-zinc-50 text-zinc-900 border-black/10" : "bg-white hover:bg-zinc-100 text-zinc-800 border-black/10 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:border-white/10"}`}`}
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
    </div>
  );
}
