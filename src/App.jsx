// Main App component: game state + status + reset + sound effects + board themes + blitz timer.
import React, { useEffect, useRef, useState } from "react";
import Board from "./components/Board.jsx";
import Timer from "./components/Timer.jsx";
import * as game from "./game.js";
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
  // Mutable ref so the interval always sees the latest turn/game-over state.
  const turnRef = useRef(game.getTurn());
  const overRef = useRef(false);

  const board = game.getBoard();
  const turn = game.getTurn();
  const status = game.getStatus();
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

  /** Handle square click: select a piece or move to a legal target. */
  function handleSquareClick(square) {
    if (gameOver) return;
    if (selectedSquare && legalTargets.includes(square)) {
      // makeMove returns the move object; flags contain "c"/"e" on captures.
      const move = game.makeMove(selectedSquare, square);
      setSelectedSquare(null);
      setLegalTargets([]);
      setFen(game.getFen());
      if (move) {
        setGameStarted(true);
        const status = game.getStatus();
        if (status === "Checkmate!") playCheckSound(true);
        else if (status === "Check!") playCheckSound(false);
        else if (move.flags.includes("c") || move.flags.includes("e")) playCaptureSound();
        else playMoveSound();
      }
    } else {
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

  /** Reset the game to the starting position. */
  function handleReset() {
    game.resetGame();
    setSelectedSquare(null);
    setLegalTargets([]);
    setFen(game.getFen());
    setClocks({ w: START_SECONDS, b: START_SECONDS });
    setTimeoutLoser(null);
    setGameStarted(false);
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
        <p className="app__subtitle">Local multiplayer · React</p>
      </header>

      <section className="status" aria-live="polite">
        <span className="status__turn">
          {turn === "w" ? "White to move" : "Black to move"}
        </span>
        <span className="status__state">{timeoutMessage || status}</span>
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

      <Timer
        label="Hitam"
        seconds={clocks.b}
        active={gameStarted && !gameOver && turn === "b"}
        expired={timeoutLoser === "b"}
      />

      <Board
        board={board}
        selectedSquare={selectedSquare}
        legalTargets={legalTargets}
        theme={theme}
        onSquareClick={handleSquareClick}
      />

      <Timer
        label="Putih"
        seconds={clocks.w}
        active={gameStarted && !gameOver && turn === "w"}
        expired={timeoutLoser === "w"}
      />

      <footer className="app__footer">
        <button className="btn" type="button" onClick={handleReset}>
          Reset Game
        </button>
        <button className="btn btn--ghost" type="button" onClick={handleSoundToggle}>
          {soundOn ? "Mute Sound" : "Unmute Sound"}
        </button>
      </footer>
    </main>
  );
}
