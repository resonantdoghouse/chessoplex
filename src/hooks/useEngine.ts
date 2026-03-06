import { useState, useEffect, useRef, useCallback } from "react";

export interface EngineMessage {
  move?: string;
  evaluation?: number;
  mate?: number;
}

export function useEngine() {
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  
  // Pending evaluations
  const resolveTaskRef = useRef<((val: EngineMessage) => void) | null>(null);

  useEffect(() => {
    const worker = new Worker("/stockfish/stockfish.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const line = e.data;
      if (line === "uciok") {
        setIsReady(true);
      } else if (line.startsWith("bestmove")) {
        const move = line.split(" ")[1];
        if (resolveTaskRef.current) {
          resolveTaskRef.current({ move });
          // Don't clear immediately if we also expect evaluation, but usually bestmove is last.
        }
      } else if (line.startsWith("info depth")) {
        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);
        
        let evaluation, mate;
        if (cpMatch) {
          evaluation = parseInt(cpMatch[1], 10) / 100; // in pawns
        } else if (mateMatch) {
          mate = parseInt(mateMatch[1], 10);
        }
        
        // We can update the last known evaluation for this sequence
        workerRef.current!.lastEval = { evaluation, mate };
      }
    };

    worker.postMessage("uci");
    worker.postMessage("isready");

    return () => {
      worker.terminate();
    };
  }, []);

  const evaluatePosition = useCallback(
    (fen: string, depth: number = 10): Promise<EngineMessage> => {
      return new Promise((resolve) => {
        if (!workerRef.current) {
          resolve({});
          return;
        }
        
        // Clear previous state
        workerRef.current.lastEval = {};
        resolveTaskRef.current = (result) => {
          resolve({
            move: result.move,
            evaluation: workerRef.current!.lastEval?.evaluation,
            mate: workerRef.current!.lastEval?.mate,
          });
        };

        workerRef.current.postMessage("stop");
        workerRef.current.postMessage("position fen " + fen);
        workerRef.current.postMessage("go depth " + depth);
      });
    },
    []
  );

  const setDifficulty = useCallback((level: string) => {
    if (!workerRef.current) return;
    let skill = 10;
    let depth = 10;
    if (level === "Easy") { skill = 1; depth = 5; }
    else if (level === "Medium") { skill = 10; depth = 10; }
    else if (level === "Hard") { skill = 20; depth = 15; }
    
    workerRef.current.postMessage(`setoption name Skill Level value ${skill}`);
    return depth;
  }, []);

  return { isReady, evaluatePosition, setDifficulty };
}
