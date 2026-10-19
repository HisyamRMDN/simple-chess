// Stockfish engine layer: loads the engine from CDN in a Web Worker
// (off the main thread, so the UI never freezes while the AI thinks)
// and speaks UCI protocol to request the best move.
const CDN_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js";

let workerPromise = null;

/** Fetch the CDN script and boot it as a Worker via a Blob URL.
 *  A plain cross-origin `new Worker(CDN_URL)` is blocked by the
 *  same-origin policy, so fetch+Blob is the standard workaround
 *  (cdnjs serves CORS headers, which makes the fetch succeed). */
function loadWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const response = await fetch(CDN_URL);
      if (!response.ok) throw new Error(`Stockfish CDN error: ${response.status}`);
      const code = await response.text();
      const blob = new Blob([code], { type: "application/javascript" });
      const worker = new Worker(URL.createObjectURL(blob));
      // Boot UCI and wait until the engine answers "uciok".
      await sendAndWait(worker, "uci", (msg) => msg === "uciok");
      return worker;
    })().catch((err) => {
      workerPromise = null; // allow retry on next attempt
      throw err;
    });
  }
  return workerPromise;
}

/** Post one command and resolve when a message satisfies `isDone`. */
function sendAndWait(worker, command, isDone, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.removeEventListener("message", onMessage);
      reject(new Error("Stockfish timeout"));
    }, timeoutMs);
    function onMessage(e) {
      const msg = typeof e.data === "string" ? e.data : "";
      if (isDone(msg)) {
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        resolve(msg);
      }
    }
    worker.addEventListener("message", onMessage);
    worker.postMessage(command);
  });
}

/** Ask Stockfish for a static evaluation of a FEN position (centipawns,
 *  from White's perspective). Uses a shallow depth so batch analysis of a
 *  whole game stays fast. Returns null if the engine is unreachable. */
export async function getEvaluation(fen, depth = 8) {
  try {
    const worker = await loadWorker();
    return await captureScore(worker, fen, depth);
  } catch {
    return null;
  }
}

/** Run one search and capture the last `info ... score cp/mate` line. */
function captureScore(worker, fen, depth) {
  return new Promise((resolve) => {
    let lastCp = null;
    let lastMate = null;
    const timer = setTimeout(() => {
      worker.removeEventListener("message", onMessage);
      resolve(lastMate !== null ? mateToCp(lastMate) : lastCp);
    }, 8000);
    function onMessage(e) {
      const msg = typeof e.data === "string" ? e.data : "";
      const m = msg.match(/score (cp|mate) (-?\d+)/);
      if (msg.startsWith("info") && m) {
        if (m[1] === "cp") lastCp = parseInt(m[2], 10);
        else lastMate = parseInt(m[2], 10);
      }
      if (msg.startsWith("bestmove")) {
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        resolve(lastMate !== null ? mateToCp(lastMate) : lastCp);
      }
    }
    worker.addEventListener("message", onMessage);
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth}`);
  }).catch(() => null);
}

/** Convert a mate-in-N score to a large centipawn value (sign = side to mate). */
function mateToCp(mate) {
  if (mate === 0) return 0;
  return Math.sign(mate) * (100000 - Math.abs(mate) * 1000);
}

/** Tell the engine to stop the current search (used on reset). */
export async function stopEngine() {
  try {
    const worker = await workerPromise;
    if (worker) worker.postMessage("stop");
  } catch {
    // Engine not loaded yet; nothing to stop.
  }
}

/** Available AI difficulty levels (beginner → hardest).
 *  `skill` maps to Stockfish's UCI "Skill Level" (0–20, lower = more blunders),
 *  `depth` is the search depth, and `blunder` is the offline-fallback
 *  random-move chance so weak levels stay weak without the engine too. */
export const AI_LEVELS = [
  { id: "beginner", label: "Pemula", skill: 0, depth: 2, blunder: 0.6 },
  { id: "easy", label: "Mudah", skill: 5, depth: 5, blunder: 0.3 },
  { id: "medium", label: "Menengah", skill: 10, depth: 8, blunder: 0.1 },
  { id: "hard", label: "Sulit", skill: 15, depth: 12, blunder: 0 },
  { id: "expert", label: "Tersulit", skill: 20, depth: 16, blunder: 0 },
];

/** Ask Stockfish for the best move in the given FEN position.
 *  `level` is one of AI_LEVELS ({skill, depth}).
 *  Returns UCI string like "e7e5" or "e7e8q" (promotion included). */
export async function getBestMove(fen, level = AI_LEVELS[2]) {
  const worker = await loadWorker();
  // Message order on a Worker is FIFO, so skill applies to the next search.
  worker.postMessage(`setoption name Skill Level value ${level.skill}`);
  worker.postMessage(`position fen ${fen}`);
  const reply = await sendAndWait(
    worker,
    `go depth ${level.depth}`,
    (msg) => msg.startsWith("bestmove"),
    level.depth >= 15 ? 180000 : 60000
  );
  const parts = reply.split(" ");
  if (parts.length < 2 || parts[1] === "(none)") {
    throw new Error("No legal move found");
  }
  return parts[1];
}
