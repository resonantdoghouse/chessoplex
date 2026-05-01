"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard as ChessboardBase } from "react-chessboard";
const Chessboard = ChessboardBase as any;
import {
  STUDY_OPENINGS,
  STUDY_CATEGORIES,
  StudyOpening,
  isUserTurn,
} from "@/lib/studyOpenings";
import { useTheme } from "../hooks/useTheme";
import { BOARD_THEMES, BoardTheme } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

type MobileView = "list" | "detail" | "practice";
type FilterColor = "all" | "white" | "black";

interface PracticeSession {
  chess: Chess;
  moveIndex: number;
  status: "waiting" | "correct" | "wrong" | "complete" | "tutor";
  tip: string;
  showHint: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  intermediate: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  advanced: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

const STUDY_COLOR_STYLE: Record<string, string> = {
  white: "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
  black: "bg-zinc-800 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100",
};

function getHintSquares(chess: Chess, san: string): Record<string, React.CSSProperties> {
  try {
    const moves = chess.moves({ verbose: true });
    const match = moves.find((m) => m.san === san);
    if (!match) return {};
    return {
      [match.from]: { background: "rgba(255, 210, 0, 0.5)", borderRadius: "4px" },
      [match.to]: { background: "rgba(255, 210, 0, 0.5)", borderRadius: "4px" },
    };
  } catch {
    return {};
  }
}

function initSession(opening: StudyOpening): PracticeSession {
  return {
    chess: new Chess(),
    moveIndex: 0,
    status: "waiting",
    tip: opening.moves[0]?.tip ?? "",
    showHint: true,
  };
}

// ── Sub-components ──────────────────────────────────────────────────────────

function OpeningCard({
  opening,
  isSelected,
  onClick,
}: {
  opening: StudyOpening;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group ${
        isSelected
          ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-700/50 border border-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-800 dark:text-zinc-200"}`}>
            {opening.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{opening.eco}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DIFFICULTY_COLORS[opening.difficulty]}`}>
            {opening.difficulty}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STUDY_COLOR_STYLE[opening.studyColor]}`}>
            {opening.studyColor === "white" ? "♙ White" : "♟ Black"}
          </span>
        </div>
      </div>
    </button>
  );
}

function OpeningDetail({
  opening,
  onStart,
  onBack,
  isMobile,
}: {
  opening: StudyOpening;
  onStart: () => void;
  onBack?: () => void;
  isMobile?: boolean;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {isMobile && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          >
            ←
          </button>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{opening.name}</h2>
        </div>
      )}

      {!isMobile && (
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">{opening.name}</h2>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs font-mono px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300">
          {opening.eco}
        </span>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${DIFFICULTY_COLORS[opening.difficulty]}`}>
          {opening.difficulty.charAt(0).toUpperCase() + opening.difficulty.slice(1)}
        </span>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${STUDY_COLOR_STYLE[opening.studyColor]}`}>
          {opening.studyColor === "white" ? "♙ Play as White" : "♟ Play as Black"}
        </span>
        <span className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
          {opening.moves.length} moves
        </span>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
        {opening.description}
      </p>

      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
          Key Ideas
        </h3>
        <ul className="space-y-2">
          {opening.keyIdeas.map((idea, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="text-indigo-400 mt-0.5 shrink-0">▸</span>
              {idea}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onStart}
        className="mt-auto w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
      >
        Start Practice →
      </button>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TipBox({
  status,
  tip,
  movePlayed,
}: {
  status: PracticeSession["status"];
  tip: string;
  movePlayed?: string;
}) {
  const colors = {
    waiting: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200",
    correct: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200",
    wrong: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-200",
    tutor: "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400",
    complete: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200",
  };
  const icons = { waiting: "💡", correct: "✓", wrong: "✗", tutor: "🤖", complete: "🎉" };

  return (
    <div className={`rounded-xl border p-3 text-sm leading-relaxed transition-all duration-300 ${colors[status]}`}>
      <span className="font-semibold mr-1">{icons[status]}</span>
      {status === "wrong" && <span className="font-semibold">Wrong move. </span>}
      {status === "correct" && movePlayed && <span className="font-semibold">{movePlayed}! </span>}
      {tip}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function StudyMode({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [boardThemeKey, setBoardThemeKey] = useState<BoardTheme>("default");

  // Read the board theme the user has selected in the game
  useEffect(() => {
    const saved = localStorage.getItem("chess_saved_theme") as BoardTheme | null;
    if (saved && BOARD_THEMES[saved]) setBoardThemeKey(saved);
  }, []);

  const boardTheme = BOARD_THEMES[boardThemeKey];
  const boardGradient =
    theme === "dark"
      ? boardTheme.gradientDark
      : (boardTheme as any).gradientLight ?? boardTheme.gradientDark;

  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [selectedOpening, setSelectedOpening] = useState<StudyOpening | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterColor, setFilterColor] = useState<FilterColor>("all");
  const [lastMove, setLastMove] = useState<string>("");
  const [clickFrom, setClickFrom] = useState<string | null>(null);
  const [legalSquares, setLegalSquares] = useState<Record<string, React.CSSProperties>>({});
  const practiceStartRef = useRef<number>(0);
  const hintsUsedRef = useRef<number>(0);

  // Save study session to Supabase when a practice run completes
  useEffect(() => {
    if (session?.status !== "complete" || !user || !selectedOpening) return;
    fetch("/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openingId: selectedOpening.id,
        openingName: selectedOpening.name,
        completed: true,
        hintsUsed: hintsUsedRef.current,
        movesCorrect: session.moveIndex,
        totalMoves: selectedOpening.moves.length,
        durationMs: Date.now() - practiceStartRef.current,
      }),
    }).catch(() => {});
  }, [session?.status]);

  // Merge hint squares + legal move squares for the board
  const customSquareStyles = useMemo(() => {
    const hint =
      session?.showHint && session.status === "waiting" && selectedOpening
        ? getHintSquares(session.chess, selectedOpening.moves[session.moveIndex]?.san ?? "")
        : {};
    return { ...legalSquares, ...hint };
  }, [session, selectedOpening, legalSquares]);

  const getLegalSquares = useCallback((square: string, chess: Chess) => {
    const moves = chess.moves({ square: square as Square, verbose: true });
    if (moves.length === 0) return {};
    const styles: Record<string, React.CSSProperties> = {
      [square]: { background: "rgba(255, 255, 0, 0.3)", borderRadius: "4px" },
    };
    for (const m of moves) {
      styles[m.to] = chess.get(m.to as Square)
        ? { background: "radial-gradient(circle, rgba(255,0,0,0.4) 65%, transparent 65%)", borderRadius: "50%" }
        : { background: "radial-gradient(circle, rgba(0,0,0,0.15) 25%, transparent 25%)", borderRadius: "50%" };
    }
    return styles;
  }, []);

  const filteredOpenings = useMemo(() => {
    return STUDY_OPENINGS.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        q === "" ||
        o.name.toLowerCase().includes(q) ||
        o.eco.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q);
      const matchColor = filterColor === "all" || o.studyColor === filterColor;
      return matchSearch && matchColor;
    });
  }, [searchQuery, filterColor]);

  const grouped = useMemo(() => {
    const result: Record<string, StudyOpening[]> = {};
    for (const cat of STUDY_CATEGORIES) {
      const items = filteredOpenings.filter((o) => o.category === cat);
      if (items.length > 0) result[cat] = items;
    }
    return result;
  }, [filteredOpenings]);

  // Auto-play tutor's move
  const playTutorMove = useCallback(
    (opening: StudyOpening, session: PracticeSession, fromMoveIndex: number) => {
      const move = opening.moves[fromMoveIndex];
      if (!move) return;

      setTimeout(() => {
        setSession((prev) => {
          if (!prev) return prev;
          const newChess = new Chess(prev.chess.fen());
          try {
            newChess.move(move.san);
          } catch {
            return prev;
          }
          const nextIdx = fromMoveIndex + 1;
          const isComplete = nextIdx >= opening.moves.length;
          return {
            ...prev,
            chess: newChess,
            moveIndex: nextIdx,
            status: isComplete ? "complete" : "waiting",
            tip: isComplete
              ? "Opening complete! You've mastered this line."
              : opening.moves[nextIdx]?.tip ?? "",
            showHint: !isComplete,
          };
        });
      }, 700);
    },
    []
  );

  const startPractice = useCallback(
    (opening: StudyOpening) => {
      const s = initSession(opening);
      setSession(s);
      setLastMove("");
      practiceStartRef.current = Date.now();
      hintsUsedRef.current = 0;
      setMobileView("practice");

      // If the first move is the tutor's (e.g. studying Black openings), auto-play it
      if (!isUserTurn(opening, 0)) {
        setSession((prev) => {
          if (!prev) return prev;
          return { ...prev, status: "tutor" };
        });
        playTutorMove(opening, s, 0);
      }
    },
    [playTutorMove]
  );

  // Plain functions (not useCallback) so the board always gets a fresh closure
  // with the current state — same pattern as ChessGame.tsx
  function tryMove(sourceSquare: string, targetSquare: string): boolean {
    if (!selectedOpening || !session) return false;
    if (session.status !== "waiting") return false;
    if (!isUserTurn(selectedOpening, session.moveIndex)) return false;

    const expectedSan = selectedOpening.moves[session.moveIndex]?.san;
    if (!expectedSan) return false;

    const testChess = new Chess(session.chess.fen());
    let playedMove;
    try {
      playedMove = testChess.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    } catch {
      return false;
    }
    if (!playedMove) return false;

    if (playedMove.san === expectedSan) {
      const nextIdx = session.moveIndex + 1;
      const isComplete = nextIdx >= selectedOpening.moves.length;

      setLastMove(playedMove.san);

      if (isComplete) {
        setSession({ chess: testChess, moveIndex: nextIdx, status: "complete", tip: "Opening complete! You've mastered this line.", showHint: false });
        return true;
      }

      const nextIsTutor = !isUserTurn(selectedOpening, nextIdx);
      const nextTip = selectedOpening.moves[nextIdx]?.tip ?? "";
      const updatedSession: PracticeSession = {
        chess: testChess,
        moveIndex: nextIdx,
        status: nextIsTutor ? "tutor" : "correct",
        tip: nextTip,
        showHint: !nextIsTutor,
      };
      setSession(updatedSession);

      if (nextIsTutor) {
        playTutorMove(selectedOpening, updatedSession, nextIdx);
      } else {
        setTimeout(() => {
          setSession((prev) => (!prev || prev.status !== "correct" ? prev : { ...prev, status: "waiting" }));
        }, 1000);
      }
      return true;
    } else {
      const currentTip = selectedOpening.moves[session.moveIndex]?.tip ?? "";
      setSession((prev) => prev ? { ...prev, status: "wrong", tip: "Not quite. " + currentTip } : prev);
      setTimeout(() => {
        setSession((prev) => prev ? { ...prev, status: "waiting", tip: currentTip } : prev);
      }, 1500);
      return false;
    }
  }

  function onSquareClick(square: string) {
    if (!selectedOpening || !session) return;
    if (session.status !== "waiting") return;
    if (!isUserTurn(selectedOpening, session.moveIndex)) return;

    if (clickFrom === square) {
      setClickFrom(null);
      setLegalSquares({});
      return;
    }

    if (clickFrom) {
      const moved = tryMove(clickFrom, square);
      setClickFrom(null);
      setLegalSquares({});
      if (!moved) {
        // Re-select if they clicked their own piece
        const piece = session.chess.get(square as Square);
        const turn = session.chess.turn();
        const userColor = selectedOpening.studyColor === "white" ? "w" : "b";
        if (piece && piece.color === userColor && turn === userColor) {
          setClickFrom(square);
          setLegalSquares(getLegalSquares(square, session.chess));
        }
      }
      return;
    }

    const piece = session.chess.get(square as Square);
    const turn = session.chess.turn();
    const userColor = selectedOpening.studyColor === "white" ? "w" : "b";
    if (piece && piece.color === userColor && turn === userColor) {
      setClickFrom(square);
      setLegalSquares(getLegalSquares(square, session.chess));
    }
  }

  function handleReset() {
    if (!selectedOpening) return;
    setClickFrom(null);
    setLegalSquares({});
    startPractice(selectedOpening);
  }

  // Board orientation
  const boardOrientation = selectedOpening?.studyColor === "black" ? "black" : "white";

  // Move history from current chess game
  const moveHistory = useMemo(() => {
    if (!session) return [];
    const history = session.chess.history();
    const pairs: string[] = [];
    for (let i = 0; i < history.length; i += 2) {
      const move = `${Math.floor(i / 2) + 1}. ${history[i]}${history[i + 1] ? " " + history[i + 1] : ""}`;
      pairs.push(move);
    }
    return pairs;
  }, [session]);

  // ── Sidebar (opening list) ─────────────────────────────────────────────────

  const SidebarList = (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Openings</h1>
        <button
          onClick={onBack}
          className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-400 font-medium transition-colors"
        >
          ← Play
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-2 shrink-0">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search openings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 focus:outline-none"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-3 shrink-0">
        {(["all", "white", "black"] as FilterColor[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilterColor(f)}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterColor === f
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600"
            }`}
          >
            {f === "all" ? "All" : f === "white" ? "♙ White" : "♟ Black"}
          </button>
        ))}
      </div>

      {/* Opening list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {Object.entries(grouped).map(([cat, openings]) => (
          <div key={cat}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 px-1">
              {cat}
            </p>
            <div className="space-y-0.5">
              {openings.map((o) => (
                <OpeningCard
                  key={o.id}
                  opening={o}
                  isSelected={selectedOpening?.id === o.id}
                  onClick={() => {
                    setSelectedOpening(o);
                    setSession(null);
                    setMobileView("detail");
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-8">No openings match your search.</p>
        )}
      </div>
    </div>
  );

  // ── Practice area ──────────────────────────────────────────────────────────

  const PracticeArea = selectedOpening && session && (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {/* Mobile back */}
      <div className="md:hidden flex items-center gap-2 shrink-0">
        <button
          onClick={() => { setMobileView("detail"); setSession(null); }}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{selectedOpening.name}</span>
      </div>

      {/* Progress */}
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Move {session.moveIndex} / {selectedOpening.moves.length}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
            {session.status === "complete" ? "✓ Complete!" : session.status === "tutor" ? "🤖 Tutor's turn…" : session.status === "waiting" ? (isUserTurn(selectedOpening, session.moveIndex) ? "Your turn" : "Waiting…") : ""}
          </span>
        </div>
        <ProgressBar current={session.moveIndex} total={selectedOpening.moves.length} />
      </div>

      {/* Board — takes available space */}
      <div className="flex-1 min-h-0 flex items-center justify-center rounded-xl overflow-hidden" style={{ background: boardGradient }}>
        <div className="w-full max-w-sm md:max-w-none aspect-square p-2">
          <Chessboard
            position={session.chess.fen()}
            onPieceDrop={tryMove}
            boardOrientation={boardOrientation}
            customSquareStyles={customSquareStyles}
            customLightSquareStyle={{ backgroundColor: boardTheme.light }}
            customDarkSquareStyle={{ backgroundColor: boardTheme.dark }}
            onSquareClick={onSquareClick}
            onPieceClick={(_: string, square: string) => onSquareClick(square)}
            areArrowsAllowed={false}
            arePremovesAllowed={false}
          />
        </div>
      </div>

      {/* Tip */}
      <div className="shrink-0">
        <TipBox status={session.status} tip={session.tip} movePlayed={lastMove} />
      </div>

      {/* Move history (compact) */}
      {moveHistory.length > 0 && (
        <div className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-x-3 gap-y-0.5">
          {moveHistory.map((pair, i) => (
            <span key={i}>{pair}</span>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setSession((prev) => { if (!prev) return prev; if (!prev.showHint) hintsUsedRef.current++; return { ...prev, showHint: !prev.showHint }; })}
          disabled={session.status !== "waiting" || !isUserTurn(selectedOpening, session.moveIndex)}
          className="flex-1 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {session.showHint ? "Hide Hint" : "💡 Hint"}
        </button>
        <button
          onClick={handleReset}
          className="flex-1 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        >
          ↺ Restart
        </button>
        {session.status === "complete" && (
          <button
            onClick={() => { setSession(null); setMobileView("list"); }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            More →
          </button>
        )}
      </div>
    </div>
  );

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-3 overflow-hidden">

      {/* ── Sidebar (always on desktop, only on mobile list view) ── */}
      <div
        className={`${
          mobileView === "list" ? "flex" : "hidden"
        } md:flex flex-col md:w-64 lg:w-72 xl:w-80 shrink-0 bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden`}
        style={{ maxHeight: "100%" }}
      >
        {SidebarList}
      </div>

      {/* ── Main content area ── */}
      <div className="flex-1 min-w-0 overflow-hidden">

        {/* Mobile: detail view */}
        {mobileView === "detail" && selectedOpening && !session && (
          <div className="md:hidden h-full bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-y-auto">
            <OpeningDetail
              opening={selectedOpening}
              onStart={() => startPractice(selectedOpening)}
              onBack={() => setMobileView("list")}
              isMobile
            />
          </div>
        )}

        {/* Mobile: practice view */}
        {mobileView === "practice" && selectedOpening && session && (
          <div className="md:hidden h-full bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {PracticeArea}
          </div>
        )}

        {/* Desktop: split detail + practice */}
        <div className="hidden md:flex h-full gap-3">

          {/* Detail panel (shown when no active session) */}
          {!session && (
            <div className="flex-1 bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-y-auto">
              {selectedOpening ? (
                <OpeningDetail
                  opening={selectedOpening}
                  onStart={() => startPractice(selectedOpening)}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <div className="text-5xl mb-2">♟</div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Select an Opening</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                    Choose an opening from the sidebar to see its details and start an interactive practice session.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Practice board + tips (shown during session) */}
          {session && selectedOpening && (
            <>
              {/* Board column */}
              <div className="flex-1 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden" style={{ background: boardGradient }}>
                <div className="w-full aspect-square max-h-full p-3">
                  <Chessboard
                    position={session.chess.fen()}
                    onPieceDrop={tryMove}
                    onSquareClick={onSquareClick}
                    onPieceClick={(_: string, square: string) => onSquareClick(square)}
                    boardOrientation={boardOrientation}
                    customSquareStyles={customSquareStyles}
                    customLightSquareStyle={{ backgroundColor: boardTheme.light }}
                    customDarkSquareStyle={{ backgroundColor: boardTheme.dark }}
                    areArrowsAllowed={false}
                    arePremovesAllowed={false}
                  />
                </div>
              </div>

              {/* Tips & progress column */}
              <div className="w-64 lg:w-72 xl:w-80 shrink-0 bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-700 flex flex-col gap-4 overflow-hidden">
                {/* Opening title + back */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">{selectedOpening.name}</h2>
                    <button
                      onClick={() => { setSession(null); }}
                      className="shrink-0 text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 ml-2"
                    >
                      ← Back
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DIFFICULTY_COLORS[selectedOpening.difficulty]}`}>
                      {selectedOpening.difficulty}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STUDY_COLOR_STYLE[selectedOpening.studyColor]}`}>
                      {selectedOpening.studyColor === "white" ? "♙ White" : "♟ Black"}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Move {session.moveIndex} / {selectedOpening.moves.length}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {Math.round((session.moveIndex / selectedOpening.moves.length) * 100)}%
                    </span>
                  </div>
                  <ProgressBar current={session.moveIndex} total={selectedOpening.moves.length} />
                </div>

                {/* Status */}
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {session.status === "complete" && "🎉 Opening complete!"}
                  {session.status === "tutor" && "🤖 Tutor is playing…"}
                  {(session.status === "waiting" || session.status === "correct") &&
                    isUserTurn(selectedOpening, session.moveIndex) &&
                    "Your turn — make a move"}
                  {session.status === "wrong" && "✗ Wrong move — try again"}
                </div>

                {/* Tip */}
                <TipBox status={session.status} tip={session.tip} movePlayed={lastMove} />

                {/* Move history */}
                {moveHistory.length > 0 && (
                  <div className="flex-1 overflow-y-auto">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                      Moves Played
                    </p>
                    <div className="space-y-0.5">
                      {moveHistory.map((pair, i) => (
                        <p key={i} className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">{pair}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div className="flex flex-col gap-2 shrink-0 mt-auto">
                  <button
                    onClick={() => setSession((prev) => { if (!prev) return prev; if (!prev.showHint) hintsUsedRef.current++; return { ...prev, showHint: !prev.showHint }; })}
                    disabled={session.status !== "waiting" || !isUserTurn(selectedOpening, session.moveIndex)}
                    className="py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {session.showHint ? "Hide Hint" : "💡 Show Hint"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                  >
                    ↺ Restart Opening
                  </button>
                  {session.status === "complete" && (
                    <button
                      onClick={() => { setSession(null); setMobileView("list"); }}
                      className="py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      Browse More →
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
