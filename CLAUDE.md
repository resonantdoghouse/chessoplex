# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint
npm test          # Run Vitest test suite
npx vitest run src/components/ChessGame.test.tsx  # Run a single test file
```

## Architecture

Chessoplex is a **Next.js 14 App Router** chess app. `ChessGame` is the central component — it's loaded dynamically with `ssr: false` from `app/page.tsx` because it depends on browser APIs (Web Audio, Web Workers, localStorage).

### State and data flow

`ChessGame.tsx` owns all game state and wires together three custom hooks:

- **`useEngine`** (`hooks/useEngine.ts`) — wraps a Stockfish 16 WASM Web Worker loaded from `public/stockfish/`. Exposes `evaluatePosition(fen, depth)` (returns a Promise resolved on `bestmove`) and `setDifficulty`. Evaluation data (`info depth` lines) is accumulated in a ref and merged into the `bestmove` resolution.

- **`useAudio`** (`hooks/useAudio.ts`) — all sound is synthesised via the Web Audio API with no audio file assets. Contains note-event arrays for four classical pieces (Bach, Gymnopédie, Moonlight, Pachelbel) and four instrument synthesis models (piano, strings, marimba, harpsichord) with convolution reverb. The hook manages the `AudioContext`, scheduling loops, and SFX.

- **`useTheme`** / `ThemeContext` — dark/light mode; board colour schemes are defined in `lib/constants.ts` as `BOARD_THEMES`.

### Key behaviours

- **Move annotation**: after every move `ChessGame` calls `evaluatePosition` on the post-move position; the eval delta vs. the previous move classifies it as Blunder / Mistake / Great Move.
- **Auto-save**: game PGN, difficulty, board theme, and annotations are persisted to `localStorage` and restored on mount. The restore happens inside a `useEffect` that checks for a saved PGN and replays it.
- **Threat detection**: computed synchronously in a `useEffect` watching `game` + `showThreats`; iterates all squares and uses `chess.js` move generation to find which squares are attacked.

### Component layout

- `EvalBar` — vertical bar driven by `currentEval` prop from `ChessGame`
- `AudioControls` — rendered above the board (mobile) or at the top of the sidebar (desktop)
- `GameOverModal` — shown when `gameResult` is set; `GameResultModal` is an alternative/unused variant
- `MoveHistory` — receives `moveAnnotations[]` alongside the PGN history

### Responsive layout

CSS grid classes are defined in `app/globals.css`. Desktop is a viewport-locked two-column layout (board + sidebar); mobile scrolls naturally with the board fitted to viewport width. The breakpoint logic is in `app/page.tsx` via Tailwind classes (`md:h-dvh md:overflow-hidden`).

### Testing

Tests use **Vitest** + **@testing-library/react** with jsdom. `react-chessboard` is mocked to expose `onSquareClick` via test buttons. `Worker` and `matchMedia` must also be mocked — see the existing test file for the pattern. Run the full suite with `npm test`.
