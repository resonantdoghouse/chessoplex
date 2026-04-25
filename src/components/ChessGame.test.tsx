import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ChessGame from "./ChessGame";
import { ThemeProvider } from "../context/ThemeContext";

// Mock react-chessboard since it uses canvas/DOM interaction that might be tricky in pure jsdom without setup
// However, we want to test interaction logic -> onSquareClick.
// If Chessboard forwards props correctly, we can mock it to expose those props.

vi.mock("react-chessboard", () => ({
  Chessboard: ({ onSquareClick, position }: any) => {
    return (
      <div data-testid="mock-chessboard">
        <div data-testid="board-position">{position}</div>
        <button data-testid="square-e2" onClick={() => onSquareClick("e2")}>
          e2
        </button>
        <button data-testid="square-e4" onClick={() => onSquareClick("e4")}>
          e4
        </button>
      </div>
    );
  },
}));

// Mock Worker
class MockWorker {
  postMessage() {}
  onmessage() {}
  terminate() {}
}
(global as any).Worker = MockWorker;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("ChessGame", () => {
  it("renders standard starting position", async () => {
    render(
      <ThemeProvider>
        <ChessGame />
      </ThemeProvider>
    );
    // Wait for mounted state to update
    expect(await screen.findByText("Chessoplex")).toBeDefined();
    expect(screen.getByTestId("mock-chessboard")).toBeDefined();
  });

  it("allows white to move pieces", async () => {
    render(
      <ThemeProvider>
        <ChessGame />
      </ThemeProvider>
    );

    // Wait for mounted state
    await screen.findByText("Chessoplex");

    // Find the e2 square (White Pawn)
    const e2 = screen.getByTestId("square-e2");

    // Click on e2 to select it
    await act(async () => {
      fireEvent.click(e2);
    });

    // We can't easily check internal state "moveFrom" directly without exposing it or checking side effects
    // But if we click e4 next, it should trigger a move

    const e4 = screen.getByTestId("square-e4");
    await act(async () => {
      fireEvent.click(e4);
    });

    // After move, the board position should change
    // Initial starts with "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    // After e2->e4: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"

    const position = screen.getByTestId("board-position");
    expect(position.textContent).toContain(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR"
    );

    // Turn should be Black now
    expect(screen.getAllByText("Black").length).toBeGreaterThan(0);
  });

  it("loads finished game and shows game over", async () => {
    // Checkmate PGN (Fool's Mate)
    const foolsMatePGN = "1. f3 e5 2. g4 Qh4#";

    // Mock localStorage response
    (window.localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === "chess_saved_pgn") return foolsMatePGN;
      if (key === "chess_saved_opponent") return "Bot 1";
      return null;
    });

    render(
      <ThemeProvider>
        <ChessGame />
      </ThemeProvider>
    );

    // Wait for mount
    await screen.findByText("Chessoplex");

    // If the bug exists, the Game Over modal is NOT shown, so this should fail
    // We look for "Checkmate" text which appears in the modal
    // Note: It might also appear in Debug Menu or Game Info, so we accept finding multiple
    expect((await screen.findAllByText(/Checkmate/i)).length).toBeGreaterThan(
      0
    );
  });
});
