// Main App component: game state + status + reset + sound effects + board themes + blitz timer.
import React, { useEffect, useRef, useState } from "react";
import Board from "./components/Board.jsx";
import PromotionModal from "./components/PromotionModal.jsx";
import Timer from "./components/Timer.jsx";
import InfoPanel from "./components/InfoPanel.jsx";
import * as game from "./game.js";
import { getBestMove, stopEngine, AI_LEVELS } from "./stockfish.js";
import { playMoveSound, playCaptureSound, playCheckSound, setSoundEnabled } from "./sound.js";

/** Available board themes for the dropdown. */
const THEMES = [
  { id: "classic", label: "Klasik (Hijau - Krem)" },
  { id: "wood", label: "Kayu (Cokelat)" },
  { id: "dark", label: "Dark Mode" },
];

/** Starting time per player in seconds (Blitz 5+0). */
const START_SECONDS = 5 * 60;

export default function App() {
  // fen triggers re-render after each move; board derived from game layer.
  const [fen, setFen] = useState(game.getFen());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [soundOn, setSoundOn] = useState(true);
  const [theme, setTheme] = useState("classic");
  // Blitz clocks (seconds left). Keys: "w" = white, "b" = black.
  const [clocks, setClocks] = useState({ w: START_SECONDS, b: START_SECONDS });
  // Loser color on timeout: "w" | "b" | null. Locks the board while set.
  const [timeoutLoser, setTimeoutLoser] = useState(null);
  // Game starts ticking only after the first move is made.
  const [gameStarted, setGameStarted] = useState(false);
  // AI mode: when on, the player is White and Stockfish plays Black.
  const [vsAI, setVsAI] = useState(false);
  // Difficulty level id (see AI_LEVELS in stockfish.js), default Menengah.
  const [aiLevel, setAiLevel] = useState("medium");
  // True while Stockfish is thinking; locks the board and shows a hint.
  const [aiThinking, setAiThinking] = useState(false);
  // Pending promotion: {from, to} held while the choice modal is open.
  // The move is NOT executed until the player picks a piece.
  const [pendingPromo, setPendingPromo] = useState(null);
  // Mutable ref so the interval always sees the latest turn/game-over state.
  const turnRef = useRef(game.getTurn());
  const overRef = useRef(false);

  const board = game.getBoard();
  const turn = game.getTurn();
  const status = game.getStatus();
  // Verbose history drives the sidebar (captured pieces + SAN list).
  const history = game.getHistory();
  // Square of the king in check (if any) — gets the red pulse action.
  const checkSquare = game.getCheckSquare();
  // Game over by checkmate/draw OR by timeout.
  const chessOver = status === "Checkmate!" || status === "Draw";
  const gameOver = chessOver || timeoutLoser !== null;
  turnRef.current = turn;
  overRef.current = gameOver;

  /** Tick the active player's clock once per second. */
  useEffect(() => {
    const id = setInterval(() => {
      if (!gameStarted || overRef.current) return;
      const active = turnRef.current;
      setClocks((prev) => {
        if (prev[active] <= 0) return prev;
        const next = { ...prev, [active]: prev[active] - 1 };
        if (next[active] <= 0) setTimeoutLoser(active);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [gameStarted]);

  /** Play the right sound for a completed move. */
  function playSoundFor(move) {
    const status = game.getStatus();
    if (status === "Checkmate!") playCheckSound(true);
    else if (status === "Check!") playCheckSound(false);
    else if (move.flags.includes("c") || move.flags.includes("e")) playCaptureSound();
    else playMoveSound();
  }

  // Whenever it is Black's turn in AI mode, ask Stockfish at the chosen
  // difficulty for the best move and play it. The engine runs inside a
  // Web Worker, so the UI stays responsive while it thinks.
  const aiLevelRef = useRef(aiLevel);
  aiLevelRef.current = aiLevel;
  useEffect(() => {
    if (!vsAI || gameOver || game.getTurn() !== "b") return;
    let cancelled = false;
    const level =
      AI_LEVELS.find((l) => l.id === aiLevelRef.current) ?? AI_LEVELS[2];
    setAiThinking(true);
    getBestMove(game.getFen(), level)
      .then((uci) => {
        if (cancelled) return;
        const move = game.makeMoveUci(uci);
        if (move) {
          playSoundFor(move);
          setFen(game.getFen());
        }
      })
      .catch(() => {
        // Engine failed (e.g. offline CDN): fall back to local play
        // so the game stays playable instead of stalling.
        if (cancelled) return;
        const fallback = pickFallbackMove(level);
        if (fallback) {
          playSoundFor(fallback);
          setFen(game.getFen());
        }
      })
      .finally(() => {
        if (!cancelled) setAiThinking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fen, vsAI, gameOver]);

  /** Handle square click: select a piece or move to a legal target. */
  function handleSquareClick(square) {
    // Locked: game over, AI is thinking, or Black's turn in AI mode.
    if (gameOver || aiThinking) return;
    if (vsAI && game.getTurn() !== "w") return;
    // Promotion choice open: only the modal decides the next action.
    if (pendingPromo) return;
    if (selectedSquare && legalTargets.includes(square)) {
      // Pawn reaching the last rank: pause and ask which piece to promote to.
      if (game.isPromotionMove(selectedSquare, square)) {
        setPendingPromo({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        setLegalTargets([]);
        return;
      }
      const move = game.makeMove(selectedSquare, square);
      setSelectedSquare(null);
      setLegalTargets([]);
      setFen(game.getFen());
      if (move) {
        setGameStarted(true);
        playSoundFor(move);
      }
    } else {
      // In AI mode the player only controls White pieces.
      const piece = game.getPiece(square);
      if (vsAI && piece && piece.color !== "w") {
        setSelectedSquare(null);
        setLegalTargets([]);
        return;
      }
      const moves = game.getLegalMoves(square);
      setSelectedSquare(moves.length > 0 ? square : null);
      setLegalTargets(moves);
    }
  }

  /** Toggle sound on/off. */
  function handleSoundToggle() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  }

  /** Run the pending promotion with the chosen piece ("q"|"r"|"n"|"b"). */
  function handlePromotionPick(piece) {
    if (!pendingPromo) return;
    const move = game.makeMove(pendingPromo.from, pendingPromo.to, piece);
    setPendingPromo(null);
    setFen(game.getFen());
    if (move) {
      setGameStarted(true);
      playSoundFor(move);
    }
  }

  /** Cancel the pending promotion; the pawn stays on its square. */
  function handlePromotionCancel() {
    setPendingPromo(null);
  }

  /** Reset the game to the starting position. */
  function handleReset() {
    stopEngine();
    game.resetGame();
    setSelectedSquare(null);
    setLegalTargets([]);
    setPendingPromo(null);
    setFen(game.getFen());
    setClocks({ w: START_SECONDS, b: START_SECONDS });
    setTimeoutLoser(null);
    setGameStarted(false);
    setAiThinking(false);
  }

  /** Toggle AI mode: player is White, Stockfish plays Black. */
  function handleModeToggle() {
    const next = !vsAI;
    stopEngine();
    setVsAI(next);
    // Fresh position so the AI always starts from the opening.
    game.resetGame();
    setSelectedSquare(null);
    setLegalTargets([]);
    setPendingPromo(null);
    setFen(game.getFen());
    setClocks({ w: START_SECONDS, b: START_SECONDS });
    setTimeoutLoser(null);
    setGameStarted(false);
    setAiThinking(false);
  }

  // Local fallback if the CDN engine is unreachable: weak levels sometimes
  // play a random move (blunder), stronger levels prefer captures,
  // otherwise play a random legal move (keeps the game going offline).
  function pickFallbackMove(level = AI_LEVELS[2]) {
    const moves = game.getAllMoves();
    if (moves.length === 0) return null;
    if (Math.random() < level.blunder) {
      const pick = moves[Math.floor(Math.random() * moves.length)];
      return game.makeMove(pick.from, pick.to);
    }
    const captures = moves.filter(
      (m) => m.flags.includes("c") || m.flags.includes("e")
    );
    const pool = captures.length > 0 ? captures : moves;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    // Preserve Stockfish-style promotion choice if the fallback move promotes.
    const promotion = pick.promotion || "q";
    return game.makeMove(pick.from, pick.to, promotion);
  }

  /** Timeout message, e.g. "Waktu Habis, Putih Kalah". */
  const timeoutMessage =
    timeoutLoser !== null
      ? `Waktu Habis, ${timeoutLoser === "w" ? "Putih" : "Hitam"} Kalah`
      : "";

  return (
    <main className="app">
      <header className="app__header">
        <h1>Chess Vibe</h1>
        <p className="app__subtitle">
          {vsAI ? "Main vs AI (kamu Putih) · React" : "Local multiplayer · React"}
        </p>
      </header>

      <section className="status" aria-live="polite">
        <span className="status__turn">
          {turn === "w" ? "White to move" : "Black to move"}
        </span>
        <span className={`status__state${status === "Check!" || status === "Checkmate!" ? " status__state--alert" : ""}`}>{timeoutMessage || status}</span>
        {aiThinking && <span className="status__ai">AI berpikir…</span>}
      </section>

      <label className="theme-picker">
        <span className="theme-picker__label">Tema</span>
        <select
          className="theme-picker__select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          aria-label="Board theme"
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {vsAI && (
        <label className="theme-picker">
          <span className="theme-picker__label">Level AI</span>
          <select
            className="theme-picker__select"
            value={aiLevel}
            onChange={(e) => {
              setAiLevel(e.target.value);
              stopEngine();
            }}
            aria-label="AI difficulty level"
          >
            {AI_LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="game">
        <div className="game__board-col">
          <Timer
            label="Hitam"
            seconds={clocks.b}
            active={gameStarted && !gameOver && turn === "b"}
            expired={timeoutLoser === "b"}
          />

          <div className="board-wrap">
            <Board
              board={board}
              selectedSquare={selectedSquare}
              legalTargets={legalTargets}
              checkSquare={checkSquare}
              theme={theme}
              onSquareClick={handleSquareClick}
            />
            {pendingPromo && (
              <PromotionModal
                color={turn}
                target={pendingPromo.to}
                onPick={handlePromotionPick}
                onCancel={handlePromotionCancel}
              />
            )}
          </div>

          <Timer
            label="Putih"
            seconds={clocks.w}
            active={gameStarted && !gameOver && turn === "w"}
            expired={timeoutLoser === "w"}
          />
        </div>

        <InfoPanel history={history} />
      </div>

      <footer className="app__footer">
        <button className="btn" type="button" onClick={handleReset}>
          Reset Game
        </button>
        <button
          className={`btn ${vsAI ? "" : "btn--ghost"}`}
          type="button"
          onClick={handleModeToggle}
        >
          {vsAI ? "Mode: vs AI" : "Main vs AI"}
        </button>
        <button className="btn btn--ghost" type="button" onClick={handleSoundToggle}>
          {soundOn ? "Mute Sound" : "Unmute Sound"}
        </button>
      </footer>
    </main>
  );
}
