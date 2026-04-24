# Chessoplex

A premium chess app built with Next.js — play against a Stockfish AI engine with a polished, responsive interface, classical background music, and ASMR piece-movement sounds.

## Features

### Chess Engine
- **Stockfish AI** via WebAssembly Web Worker — three difficulty levels: Easy, Medium, Hard
- Full chess rules via **chess.js**: castling, en passant, promotion (auto-queen), draw detection (stalemate, threefold repetition, insufficient material, 50-move rule)
- **Drag-and-drop** or **click-to-move** piece interaction
- **Move highlighting** — legal move dots, selected piece highlight, capture indicators
- **Threat detection** — toggle overlay showing pieces currently under attack
- **Move annotations** — engine evaluates each move and labels Blunders, Mistakes, and Great Moves
- **Move history** panel with per-move annotation badges
- **Stockfish evaluation bar** — vertical bar beside the board showing the engine's positional assessment, with numeric label (+1.4, M3, etc.)

### Audio
- **ASMR wood SFX** — every piece move plays a synthesised wood-slide + surface-placement sound using the Web Audio API (no audio files required)
- **Classical background music** — four looping pieces synthesised entirely in the browser:
  - Bach C Major Prelude BWV 846
  - Gymnopédie No. 1 (Satie)
  - Moonlight Sonata 1st Movement (Beethoven)
  - Pachelbel Canon in D
- **Four instrument timbres** to choose from:
  - **Piano** — multi-harmonic additive synthesis with inharmonicity and hammer noise
  - **Strings** — detuned triangle oscillators with delayed LFO vibrato
  - **Marimba** — fast exponential decay with characteristic 4th harmonic and mallet noise
  - **Harpsichord** — plucked string simulation with jack-click transient
- **Convolution reverb** — synthetic stereo impulse response applied to all background music (55% dry / 45% wet)
- Song and instrument switching with smooth fade-out/fade-in transitions; previous song stops cleanly on change
- **Compact audio strip above the board on mobile** for immediate access; full controls panel at the top of the sidebar on desktop

### UI & Layout
- **Fully responsive** — viewport-locked layout on desktop and tablet (board + sidebar side-by-side, no scrolling); natural scroll on mobile with board fitted to viewport width
- **Board themes** — multiple colour schemes selectable via a swatch picker
- **Dark/light mode** toggle with smooth transitions and theme-specific UI styling
- **Game timer** with pause/resume support
- **Game Over modal** with result, reason, move count, and duration
- **Auto-save** — game state (PGN, difficulty, theme, annotations) persisted to localStorage and restored on reload

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **chess.js** — game logic and move validation
- **react-chessboard** — board UI
- **Stockfish 16** — WASM chess engine running in a Web Worker
- **Web Audio API** — all sound synthesised in-browser (no audio file assets)
- **Tailwind CSS** — utility styling with custom CSS for the responsive grid layout

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Root page, viewport layout
│   └── globals.css       # Tailwind base + responsive chess layout classes
├── components/
│   ├── ChessGame.tsx     # Main game component
│   ├── AudioControls.tsx # Song, instrument, SFX toggles
│   ├── EvalBar.tsx       # Stockfish evaluation bar
│   ├── GameInfo.tsx      # Turn, timer, opponent name
│   ├── GameOverModal.tsx # End-of-game result overlay
│   ├── MoveHistory.tsx   # Scrollable move list with annotations
│   └── ThemeToggle.tsx   # Dark/light mode switch
├── hooks/
│   ├── useAudio.ts       # Web Audio API synthesis (music + SFX)
│   ├── useEngine.ts      # Stockfish Web Worker interface
│   └── useTheme.ts       # Dark/light theme state
└── lib/
    └── constants.ts      # Board themes, opponent names
```

## Deployment

Deploy instantly on [Vercel](https://vercel.com/new):

```bash
npm run build
```

See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more options.
