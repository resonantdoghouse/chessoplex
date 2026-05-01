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
import { useVoice, sanToSpeech } from "../hooks/useVoice";
import { getOpeningName } from "@/lib/openings";
import IntroTour, { shouldShowTour } from "./IntroTour";
import { useAuth } from "@/context/AuthContext";
import UserMenu from "./UserMenu";

export default function ChessGame({ onStudyMode }: { onStudyMode?: () => void } = {}) {
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
    playCaptureSound,
    sfxEnabled, setSfxEnabled,
    bgPlaying, toggleBgMusic,
    currentSong, setSong,
    currentInstrument, setInstrument,
  } = useAudio();
  const { speak, voiceEnabled, setVoiceEnabled, voiceVolume, setVoiceVolume, verbosity, setVerbosity, voices, selectedVoiceURI, setSelectedVoiceURI, selectedLang, setSelectedLang } = useVoice();
  const [moveAnnotations, setMoveAnnotations] = useState<string[]>([]);
  const { user } = useAuth();
  const lastSpokenAnnotationCountRef = useRef(0);
  const lastSpokenOpeningRef = useRef<string | null>(null);
  const lastEvalRef = useRef<number>(0);
  const tourStartRef = useRef<number>(0);
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
  const [showTutor, setShowTutor] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<"Fastest" | "Fast" | "Normal" | "Slow">("Normal");
  const [tutorSquares, setTutorSquares] = useState<
    Record<string, React.CSSProperties>
  >({});
  const [playerColorSetting, setPlayerColorSetting] = useState<"Random" | "White" | "Black">("Random");
  const [currentPlayerColor, setCurrentPlayerColor] = useState<"w" | "b">("w");
  const [showSettings, setShowSettings] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showTour, setShowTour] = useState(false);
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
    const savedElapsedMs = parseInt(localStorage.getItem("chess_saved_elapsed_ms") || "0", 10);
    setStartTime(Date.now() - savedElapsedMs);

    const savedPgn = localStorage.getItem("chess_saved_pgn");
    const savedOpponent = localStorage.getItem("chess_saved_opponent");
    const savedDifficulty = localStorage.getItem("chess_saved_difficulty");
    const savedTheme = localStorage.getItem("chess_saved_theme") as BoardTheme;
    const savedAnnotations = localStorage.getItem("chess_saved_annotations");
    const savedShowThreats = localStorage.getItem("chess_saved_show_threats") === "true";
    const savedShowTutor   = localStorage.getItem("chess_saved_show_tutor")   === "true";
    const savedAutoPlay    = localStorage.getItem("chess_saved_auto_play")    === "true";
    const savedAutoPlaySpeed = localStorage.getItem("chess_saved_auto_play_speed");
    const savedPlayerColorSetting = localStorage.getItem("chess_saved_player_color_setting") as "Random" | "White" | "Black" | null;
    const savedCurrentPlayerColor = localStorage.getItem("chess_saved_current_player_color") as "w" | "b" | null;

    if (savedDifficulty)
      setDifficulty(savedDifficulty as "Easy" | "Medium" | "Hard");
    if (savedTheme && BOARD_THEMES[savedTheme]) setBoardTheme(savedTheme);
    if (savedShowThreats) setShowThreats(true);
    if (savedShowTutor)   setShowTutor(true);
    if (savedAutoPlay)    setAutoPlay(true);
    if (savedAutoPlaySpeed) setAutoPlaySpeed(savedAutoPlaySpeed as any);
    if (savedPlayerColorSetting) setPlayerColorSetting(savedPlayerColorSetting);
    
    if (savedCurrentPlayerColor) {
      setCurrentPlayerColor(savedCurrentPlayerColor);
    } else {
      let newColor: "w" | "b" = "w";
      const settingToUse = savedPlayerColorSetting || "Random";
      if (settingToUse === "Random") {
        newColor = Math.random() < 0.5 ? "w" : "b";
      } else {
        newColor = settingToUse === "White" ? "w" : "b";
      }
      setCurrentPlayerColor(newColor);
    }

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
    const tourNeeded = shouldShowTour();
    if (tourNeeded) tourStartRef.current = Date.now();
    setShowTour(tourNeeded);
  }, []);

  // Play session analytics tracking
  useEffect(() => {
    let anonId = localStorage.getItem("chess_anon_id");
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem("chess_anon_id", anonId);
    }
    const deviceType = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
    const platform = /android/i.test(navigator.userAgent) ? "android" : /iphone|ipad/i.test(navigator.userAgent) ? "ios" : "web";
    let sessionId: string | null = null;
    const sessionStart = Date.now();

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", anonymousId: anonId, deviceType, platform }),
    })
      .then((r) => r.json())
      .then((d) => { sessionId = d.sessionId; })
      .catch(() => {});

    return () => {
      if (sessionId) {
        navigator.sendBeacon(
          "/api/sessions",
          new Blob([JSON.stringify({ action: "end", sessionId, durationMs: Date.now() - sessionStart })], { type: "application/json" }),
        );
      }
    };
  }, []);

  // Voice announcement — fires when a new annotation is settled
  useEffect(() => {
    if (!voiceEnabled) return;
    if (moveAnnotations.length <= lastSpokenAnnotationCountRef.current) return;
    lastSpokenAnnotationCountRef.current = moveAnnotations.length;

    const moveIdx = moveAnnotations.length - 1;
    const history = game.history({ verbose: true });
    const move = history[moveIdx];
    if (!move) return;

    const annotation = moveAnnotations[moveIdx];

    // Announce opening name when it first appears or changes
    const currentOpening = getOpeningName(history.slice(0, moveIdx + 1).map((m) => m.san));
    const openingChanged = currentOpening && currentOpening !== lastSpokenOpeningRef.current;
    if (openingChanged) lastSpokenOpeningRef.current = currentOpening;

    // "events" mode: only speak when there's an annotation or opening change
    if (verbosity === "events" && !annotation && !openingChanged) return;

    const parts: string[] = [];

    if (verbosity === "full") {
      const color = moveIdx % 2 === 0 ? "White" : "Black";
      parts.push(`${color}, ${sanToSpeech(move.san)}`);
    } else if (verbosity === "brief") {
      parts.push(sanToSpeech(move.san));
    }
    // "events": no move name — only annotation / opening below

    if (annotation) parts.push(annotation);
    if (openingChanged) parts.push(currentOpening!);

    if (parts.length > 0) speak(parts.join(". "));
  }, [moveAnnotations, voiceEnabled, verbosity, game, speak]);

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
      localStorage.setItem(
        "chess_saved_elapsed_ms",
        String(Date.now() - startTime - totalPausedTime),
      );
    }
  }, [game, opponentName, mounted, moveAnnotations, startTime, totalPausedTime]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_difficulty", difficulty);
  }, [difficulty, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_theme", boardTheme);
  }, [boardTheme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_show_threats", String(showThreats));
  }, [showThreats, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_show_tutor", String(showTutor));
  }, [showTutor, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_auto_play", String(autoPlay));
  }, [autoPlay, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_auto_play_speed", autoPlaySpeed);
  }, [autoPlaySpeed, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_player_color_setting", playerColorSetting);
  }, [playerColorSetting, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("chess_saved_current_player_color", currentPlayerColor);
  }, [currentPlayerColor, mounted]);

  // AI Turn Scheduler
  useEffect(() => {
    if (!mounted || isPaused || game.isGameOver() || !engine.isReady || showTour) return;

    if (autoPlay || game.turn() !== currentPlayerColor) {
      let delay = difficulty === "Easy" ? 1000 : difficulty === "Medium" ? 500 : 200;
      if (autoPlay) {
        if (autoPlaySpeed === "Fastest") delay = 200;
        else if (autoPlaySpeed === "Fast") delay = 800;
        else if (autoPlaySpeed === "Normal") delay = 2000;
        else if (autoPlaySpeed === "Slow") delay = 4000;
      }

      const timeoutId = setTimeout(() => {
        makeAITurn(game);
      }, delay);
      return () => clearTimeout(timeoutId);
    }
  }, [game.fen(), autoPlay, autoPlaySpeed, isPaused, difficulty, engine.isReady, mounted, currentPlayerColor, showTour]);

  // Tutor: request best move from engine when it's the player's turn
  useEffect(() => {
    if (!showTutor || !engine.isReady || game.turn() !== currentPlayerColor || game.isGameOver() || isPaused) {
      setTutorSquares({});
      return;
    }

    let cancelled = false;
    engine.evaluatePosition(game.fen(), 12).then((result) => {
      if (cancelled || !result.move) return;
      const from = result.move.substring(0, 2);
      const to   = result.move.substring(2, 4);
      setTutorSquares({
        [from]: { background: "rgba(34, 197, 94, 0.45)" },
        [to]: {
          background:
            "radial-gradient(circle, rgba(34, 197, 94, 0.85) 28%, transparent 28%)",
        },
      });
    });

    return () => { cancelled = true; };
  }, [showTutor, game, engine.isReady, isPaused, currentPlayerColor]);

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

      if (user) {
        fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pgn: currentGame.pgn(),
            result: winner,
            resultReason: reason,
            difficulty,
            playerColor: currentPlayerColor,
            durationMs: endTime - startTime - totalPausedTime,
            moveCount: moves,
            openingName: lastSpokenOpeningRef.current,
            annotations: moveAnnotations,
          }),
        }).catch(() => {});
      }

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
    if (isPaused || game.turn() !== currentPlayerColor || autoPlay) return;

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
      if (move.captured) playCaptureSound(); else playMoveSound();
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

      return true;
    } catch (error) {
      return false;
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (isPaused || game.turn() !== currentPlayerColor || autoPlay) return false;
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
      else if (delta < -1.0) annotation = "Blunder";
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

    const colorMakingMove = tempGame.turn();
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
            if (moveObj.captured) playCaptureSound(); else playMoveSound();
            annotateMove(result.evaluation, result.mate, colorMakingMove);
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
      const fallbackMove = tempGame.move(possibleMoves[randomIndex]);
      if (fallbackMove?.captured) playCaptureSound(); else playMoveSound();
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
      // Snapshot elapsed before the timer freezes so a reload restores correctly
      if (game.pgn()) {
        localStorage.setItem(
          "chess_saved_elapsed_ms",
          String(Date.now() - startTime - totalPausedTime),
        );
      }
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
    setTutorSquares({});
    setOpponentName(
      OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)],
    );

    let newColor: "w" | "b" = "w";
    const settingToUse = playerColorSetting;
    if (settingToUse === "Random") {
      newColor = Math.random() < 0.5 ? "w" : "b";
    } else {
      newColor = settingToUse === "White" ? "w" : "b";
    }
    setCurrentPlayerColor(newColor);

    localStorage.removeItem("chess_saved_pgn");
    localStorage.removeItem("chess_saved_opponent");
    localStorage.removeItem("chess_saved_annotations");
    localStorage.removeItem("chess_saved_elapsed_ms");
    localStorage.removeItem("chess_saved_show_threats");
  }

  if (!mounted) return null;

  const isLightUi = (BOARD_THEMES[boardTheme] as any).uiMode === "light";

  const mobileEvalLabel = (() => {
    if (currentEval.mate !== undefined) {
      return currentEval.mate > 0 ? `M${currentEval.mate}` : `M${Math.abs(currentEval.mate)}`;
    }
    if (currentEval.evaluation !== undefined) {
      const v = currentEval.evaluation;
      if (v === 0) return "0.0";
      const str = Math.abs(v) >= 10 ? "10.0" : Math.abs(v).toFixed(1);
      return v > 0 ? `+${str}` : `-${str}`;
    }
    return "=";
  })();
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
    <>
    <div className="chess-game-layout w-full max-w-7xl mx-auto md:h-full md:max-h-[920px]">
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
        playerColor={currentPlayerColor}
        opponentName={opponentName}
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
              boardOrientation={currentPlayerColor === "w" ? "white" : "black"}
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              onPieceClick={(_: string, square: string) => onSquareClick(square)}
              arePiecesDraggable={!isPaused && game.turn() === currentPlayerColor && !autoPlay}
              customSquareStyles={{ ...tutorSquares, ...threatenedSquares, ...optionSquares }}
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
        {/* Mobile eval — hidden on md+ where EvalBar shows */}
        <div className="md:hidden flex justify-center mt-2">
          <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 tabular-nums">
            {mobileEvalLabel}
          </span>
        </div>
      </div>

      {/* ── Sidebar / controls column ── */}
      <div className="chess-sidebar">

        {/* ── Header: title + settings toggle ── */}
        <div className="flex items-center justify-between px-1 shrink-0">
          <div>
            <h1 className={`text-xl md:text-2xl font-black uppercase tracking-widest transition-colors duration-300 ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>
              Chessoplex
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <UserMenu />
            <button
              onClick={() => setShowSettings(s => !s)}
              aria-label={showSettings ? "Close settings" : "Open settings"}
              className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                showSettings
                  ? theme === "dark"
                    ? "bg-white text-zinc-900 shadow-lg border-2 border-white/30 ring-1 ring-black/20"
                    : "bg-zinc-900 text-white shadow-lg border-2 border-zinc-700 ring-1 ring-black/10"
                  : theme === "dark"
                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 shadow-lg border-2 border-zinc-600/20 ring-1 ring-black/20"
                    : "bg-white text-zinc-600 hover:bg-zinc-50 shadow-lg border-2 border-zinc-200 ring-1 ring-black/5"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showSettings ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* ── Settings panel (collapsible) ── */}
        <div className={`grid transition-all duration-300 ease-in-out shrink-0 ${showSettings ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className={`p-4 grid grid-cols-1 gap-5 rounded-xl border ${panelBaseClass}`}>

              {/* ── Study mode ── */}
              {onStudyMode && (
                <button
                  onClick={() => { setShowSettings(false); onStudyMode(); }}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 border ${
                    theme === "dark"
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/30"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700/30"
                  }`}
                >
                  📖 Study Mode
                </button>
              )}

              {/* ── Appearance ── */}
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest px-1 ${subTextClass}`}>Appearance</p>
                <div className={`flex flex-col gap-3 p-4 rounded-xl border bg-white/40 dark:bg-black/20 ${isLightUi ? "border-black/5" : "border-white/5"}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${textBaseClass}`}>App Theme</span>
                    <ThemeToggle />
                  </div>
                  <div className="h-px w-full bg-black/5 dark:bg-white/5" />
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-bold ${textBaseClass}`}>Board Theme</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${subTextClass}`}>
                        {BOARD_THEMES[boardTheme].name}
                      </span>
                    </div>
                    <div className="grid grid-cols-8 gap-1.5 mt-1">
                      {Object.entries(BOARD_THEMES).map(([key, t]) => (
                        <button
                          key={key}
                          onClick={() => setBoardTheme(key as BoardTheme)}
                          title={t.name}
                          aria-label={`Select ${t.name} theme`}
                          className={`aspect-square rounded-full border-2 transition-all hover:scale-110 active:scale-95 shadow-sm ${boardTheme === key ? `scale-110 shadow-md ring-2 ${isLightUi ? "border-zinc-900 ring-zinc-500/30" : "border-zinc-900 dark:border-white ring-zinc-500/30"}` : `border-transparent hover:border-black/20 ${!isLightUi ? "dark:hover:border-white/20" : ""}`}`}
                          style={{ background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Gameplay ── */}
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest px-1 ${subTextClass}`}>Gameplay</p>
                <div className={`flex flex-col gap-3 p-4 rounded-xl border bg-white/40 dark:bg-black/20 ${isLightUi ? "border-black/5" : "border-white/5"}`}>
                  <div className="flex flex-col gap-2">
                    <span className={`text-sm font-bold ${textBaseClass}`}>Play As (Next Game)</span>
                    <div className="flex p-1 rounded-xl border bg-black/5 dark:bg-white/5 border-transparent">
                      {(["Random", "White", "Black"] as const).map((colorOpt) => (
                        <button
                          key={colorOpt}
                          onClick={() => setPlayerColorSetting(colorOpt)}
                          className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${playerColorSetting === colorOpt ? (isLightUi ? "bg-white text-zinc-900 shadow-md" : "bg-zinc-700 text-white shadow-md") : `hover:bg-black/5 dark:hover:bg-white/5 ${subTextClass}`}`}
                        >
                          {colorOpt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-px w-full bg-black/5 dark:bg-white/5" />
                  <div className="flex flex-col gap-2">
                    <span className={`text-sm font-bold ${textBaseClass}`}>Engine Difficulty</span>
                    <div className="flex p-1 rounded-xl border bg-black/5 dark:bg-white/5 border-transparent">
                      {(["Easy", "Medium", "Hard"] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${difficulty === level ? (isLightUi ? "bg-white text-zinc-900 shadow-md" : "bg-zinc-700 text-white shadow-md") : `hover:bg-black/5 dark:hover:bg-white/5 ${subTextClass}`}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-px w-full bg-black/5 dark:bg-white/5" />
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-bold ${textBaseClass}`}>AutoPlay AI Match</span>
                      <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 ${autoPlay ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${autoPlay ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {autoPlay && (
                      <div className="flex p-1 mt-1 rounded-xl border bg-black/5 dark:bg-white/5 border-transparent animate-in slide-in-from-top-2 duration-200">
                        {(["Fastest", "Fast", "Normal", "Slow"] as const).map((speed) => (
                          <button
                            key={speed}
                            onClick={() => setAutoPlaySpeed(speed)}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${autoPlaySpeed === speed ? "bg-blue-500 text-white shadow-md" : `hover:bg-black/5 dark:hover:bg-white/5 ${subTextClass}`}`}
                          >
                            {speed}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Assistance ── */}
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest px-1 ${subTextClass}`}>Assistance</p>
                <div className={`flex flex-col gap-3 p-4 rounded-xl border bg-white/40 dark:bg-black/20 ${isLightUi ? "border-black/5" : "border-white/5"}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${textBaseClass}`}>Threat Indicators</span>
                    <button onClick={() => setShowThreats(!showThreats)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${showThreats ? 'bg-red-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${showThreats ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${textBaseClass}`}>Engine Tutor</span>
                    <button onClick={() => setShowTutor(!showTutor)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${showTutor ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${showTutor ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="h-px w-full bg-black/5 dark:bg-white/5" />
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-bold ${textBaseClass}`}>Voice Announcer</span>
                      <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${voiceEnabled ? 'bg-violet-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${voiceEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {voiceEnabled && (
                      <div className="flex flex-col gap-3 pt-2 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-3 px-1">
                          <span className={`text-[10px] font-bold ${subTextClass} w-6`}>VOL</span>
                          <input
                            type="range" min={0} max={1} step={0.05} value={voiceVolume}
                            onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                            className="flex-1 h-1.5 accent-violet-500 cursor-pointer"
                          />
                          <span className={`text-[10px] font-bold ${subTextClass} w-8 text-right`}>{Math.round(voiceVolume * 100)}%</span>
                        </div>
                        <div className="flex p-1 rounded-xl border bg-black/5 dark:bg-white/5 border-transparent">
                          {(["full", "brief", "events"] as const).map((level) => (
                            <button
                              key={level}
                              onClick={() => setVerbosity(level)}
                              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${verbosity === level ? "bg-violet-500 text-white shadow-md" : `hover:bg-black/5 dark:hover:bg-white/5 ${subTextClass}`}`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                        {voices.length > 0 && (() => {
                          const langCodes = Array.from(new Set(voices.map((v) => v.lang.split("-")[0]))).sort();
                          const filteredVoices = voices.filter((v) => v.lang.startsWith(selectedLang));
                          return (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 px-1">
                                <span className={`text-[10px] font-bold ${subTextClass} w-6 shrink-0`}>LANG</span>
                                <select
                                  value={selectedLang}
                                  onChange={(e) => {
                                    const lang = e.target.value;
                                    setSelectedLang(lang);
                                    const first = voices.find((v) => v.lang.startsWith(lang));
                                    if (first) setSelectedVoiceURI(first.voiceURI);
                                  }}
                                  className={`flex-1 text-[10px] font-bold rounded-lg px-2 py-1.5 border-0 outline-none cursor-pointer bg-black/5 dark:bg-white/10 ${subTextClass}`}
                                >
                                  {langCodes.map((code) => (
                                    <option key={code} value={code}>{code.toUpperCase()}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-2 px-1">
                                <span className={`text-[10px] font-bold ${subTextClass} w-6 shrink-0`}>VOICE</span>
                                <select
                                  value={selectedVoiceURI}
                                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                                  className={`flex-1 text-[10px] font-bold rounded-lg px-2 py-1.5 border-0 outline-none cursor-pointer bg-black/5 dark:bg-white/10 ${subTextClass}`}
                                >
                                  {filteredVoices.map((v) => (
                                    <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Audio ── */}
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest px-1 ${subTextClass}`}>Audio</p>
                <div className={`flex flex-col gap-3 p-4 rounded-xl border h-full bg-white/40 dark:bg-black/20 ${isLightUi ? "border-black/5" : "border-white/5"}`}>
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
                </div>
              </div>

              {/* ── System ── */}
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest px-1 ${subTextClass}`}>System</p>
                <div className={`flex flex-col gap-3 p-4 rounded-xl border bg-white/40 dark:bg-black/20 ${isLightUi ? "border-black/5" : "border-white/5"}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${textBaseClass}`}>Clear Preferences</span>
                      <span className={`text-[10px] font-medium mt-0.5 ${subTextClass}`}>Reset all saved settings and game data</span>
                    </div>
                    {confirmClear ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${subTextClass}`}>Sure?</span>
                        <button
                          onClick={() => { localStorage.clear(); window.location.reload(); }}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors"
                        >
                          YES
                        </button>
                        <button
                          onClick={() => setConfirmClear(false)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-colors ${isLightUi ? "bg-zinc-200 text-zinc-700 hover:bg-zinc-300" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClear(true)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Pause / New game ── */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <button
            onClick={togglePause}
            aria-label={isPaused ? "Resume game" : "Pause game"}
            className={`py-3 px-4 font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border ${isPaused ? "bg-gradient-to-br from-yellow-500 to-yellow-700 text-white border-yellow-400/50 shadow-yellow-900/40" : isLightUi ? "bg-white hover:bg-zinc-50 text-zinc-900 border-black/10" : "bg-white hover:bg-zinc-100 text-zinc-800 border-black/10 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:border-white/10"}`}
          >
            {isPaused ? "RESUME" : "PAUSE"}
          </button>
          <button
            onClick={resetGame}
            aria-label="Start new game"
            className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-white/10"
          >
            NEW GAME
          </button>
        </div>

        {/* ── Game info: opponent, timer, player ── */}
        <GameInfo
          key={gameId}
          turn={game.turn()}
          playerColor={currentPlayerColor}
          startTime={startTime}
          gameStatus={gameResult ? gameResult.reason : null}
          isPaused={isPaused || showTour}
          totalPausedTime={totalPausedTime}
          opponentName={opponentName}
          isLightUi={isLightUi}
          currentEval={currentEval}
        />

        {/* ── Move history (dominant — fills remaining space) ── */}
        <div className={`min-h-[200px] md:flex-1 rounded-2xl border shadow-2xl ring-1 ring-black/5 overflow-hidden ${isLightUi ? "bg-white/80 border-black/10" : "bg-white/70 dark:bg-zinc-900/70 border-white/20 dark:border-white/10 backdrop-blur-xl"}`}>
          <MoveHistory
            history={game.history({ verbose: true })}
            annotations={moveAnnotations}
          />
        </div>

      </div>
    </div>

    {showTour && <IntroTour theme={theme} onDismiss={() => {
      setStartTime(prev => prev + (Date.now() - tourStartRef.current));
      setShowTour(false);
    }} />}
    </>
  );
}
