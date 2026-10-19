// Main App component: game state + status + reset + sound effects + board themes + blitz timer.
import React, { useEffect, useRef, useState } from "react";
import Board from "./components/Board.jsx";
import LandingMenu from "./components/LandingMenu.jsx";
import MainMenu from "./components/MainMenu.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import BackgroundMusic from "./components/BackgroundMusic.jsx";
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
  // Global app theme: "light" | "dark" (board colors untouched).
  const [mode, setMode] = useState("light");
  // Blitz clocks (seconds left). Keys: "w" = white, "b" = black.
  // null = no clock (∞ mode from the menu).
  const [clocks, setClocks] = useState({ w: 5 * 60, b: 5 * 60 });
  // Loser color on timeout: "w" | "b" | null. Locks the board while set.
  const [timeoutLoser, setTimeoutLoser] = useState(null);
  // Game starts ticking only after the first move is made.
  const [gameStarted, setGameStarted] = useState(false);
  // AI mode: true = Stockfish plays opposite color; false = local 2 players.
  const [vsAI, setVsAI] = useState(false);
  // Screen flow: "landing" -> "setup" -> "game".
  const [screen, setScreen] = useState("landing");
  // Settings modal visibility (openable from landing + game screens).
  const [showSettings, setShowSettings] = useState(false);
  // BGM + SFX switches. BGM starts only after the first user click.
  const [bgmOn, setBgmOn] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  // Player color (null until a game starts; board/timer hidden).
  const [playerColor, setPlayerColor] = useState(null);
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

  const aiColor = playerColor === "w" ? "b" : "w";

  /** Tick the active player's clock once per second (skipped in ∞ mode). */
  useEffect(() => {
    const id = setInterval(() => {
      if (!gameStarted || overRef.current) return;
      const active = turnRef.current;
      setClocks((prev) => {
        if (prev[active] === null || prev[active] <= 0) return prev;
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

  // In AI mode the engine plays the opposite color. If the player is Black,
  // Stockfish (White) automatically takes the first move on game start.
  // The engine runs inside a Web Worker, so the UI stays responsive.
  const aiLevelRef = useRef(aiLevel);
  aiLevelRef.current = aiLevel;
  useEffect(() => {
    if (!vsAI || playerColor === null || gameOver || game.getTurn() !== aiColor) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, vsAI, gameOver, aiColor, playerColor]);

  // Unlock audio on the very first user click anywhere (autoplay policy).
  useEffect(() => {
    function unlock() {
      setAudioUnlocked(true);
      window.removeEventListener("pointerdown", unlock);
    }
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // Apply global light/dark mode to <html> so CSS variables switch.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  /** Handle square click: select a piece or move to a legal target. */
  function handleSquareClick(square) {
    // Locked: not in game screen, game over, AI thinking, or AI's turn.
    if (screen !== "game" || playerColor === null || gameOver || aiThinking) return;
    if (vsAI && game.getTurn() !== playerColor) return;
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
      // In AI mode the player only controls their own color.
      const piece = game.getPiece(square);
      if (vsAI && piece && piece.color !== playerColor) {
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

  /** Start the game from the setup config; setup unmounts (not hidden). */
  function handleStartGame(config) {
    stopEngine();
    const startSeconds =
      config.timeMinutes === null ? null : config.timeMinutes * 60;
    // Local mode: no AI, both sides human (board stays unflipped).
    setVsAI(config.mode === "ai");
    setPlayerColor(config.color);
    setScreen("game");
    game.resetGame();
    setSelectedSquare(null);
    setLegalTargets([]);
    setPendingPromo(null);
    setFen(game.getFen());
    setClocks({ w: startSeconds, b: startSeconds });
    setTimeoutLoser(null);
    setGameStarted(false);
    setAiThinking(false);
  }

  /** Reset the game to the starting position. */
  function handleReset() {
    stopEngine();
    game.resetGame();
    setSelectedSquare(null);
    setLegalTargets([]);
    setPendingPromo(null);
    setFen(game.getFen());
    setClocks((prev) => {
      const initial = prev.w === null && prev.b === null ? null : START_SECONDS;
      return { w: initial, b: initial };
    });
    setTimeoutLoser(null);
    setGameStarted(false);
    setAiThinking(false);
  }

  /** Back to the landing screen (menu remounts, board hidden, clocks stopped). */
  function handleBackToMenu() {
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
    setVsAI(false);
    setPlayerColor(null);
    setScreen("landing");
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

  // Timers sit next to the player's own color: bottom = player, top = AI.
  const topColor = playerColor === "w" ? "b" : "w";
  const bottomColor = playerColor === "w" ? "w" : "b";
  const colorLabel = (c) => (c === "w" ? "Putih" : "Hitam");
  const timeLabel =
    clocks.w === null ? "Tanpa batas" : `Blitz ${clocks.w !== null ? Math.round((clocks.w + clocks.b) / 120) : ""} mnt`;

  // Overlays mount only on their screen (unmounted, not hidden).
  const showLanding = screen === "landing";
  const showSetup = screen === "setup";
  const showGame = screen === "game";

  return (
    <main className="app">
      {/* Persistent BGM: mounted once, survives all screen changes */}
      <BackgroundMusic playing={bgmOn} unlocked={audioUnlocked} />
      {showLanding && (
        <LandingMenu
          onPlay={() => setScreen("setup")}
          onSettings={() => setShowSettings(true)}
        />
      )}
      {showSetup && (
        <MainMenu
          onStartGame={handleStartGame}
          onBack={() => setScreen("landing")}
        />
      )}
      {showSettings && (
        <SettingsModal
          bgmOn={bgmOn}
          soundOn={soundOn}
          darkMode={mode === "dark"}
          onToggleBgm={() => setBgmOn((v) => !v)}
          onToggleSound={() => setSoundOn((v) => !v)}
          onToggleMode={() => setMode(mode === "light" ? "dark" : "light")}
          onClose={() => setShowSettings(false)}
        />
      )}

      <header className="app__header">
        <div className="app__header-text">
          <h1>Vibe Chess</h1>
          <p className="app__subtitle">
            {playerColor === null
              ? "Atur permainan untuk mulai · React"
              : `${vsAI ? `Main vs AI (kamu ${playerColor === "w" ? "Putih" : "Hitam"})` : "Lokal 2 pemain"} · ${timeLabel}`}
          </p>
        </div>
        <button
          className="mode-toggle"
          type="button"
          onClick={() => setShowSettings(true)}
          title="Buka Pengaturan"
          aria-label="Buka Pengaturan"
        >
          ⚙️
        </button>
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

      {showGame && (
      <div className="game">
        <div className="game__board-col">
          {clocks[topColor] !== null && (
          <Timer
            label={colorLabel(topColor)}
            seconds={clocks[topColor]}
            active={gameStarted && !gameOver && turn === topColor}
            expired={timeoutLoser === topColor}
          />
          )}

          <div className="board-wrap">
            <Board
              board={board}
              selectedSquare={selectedSquare}
              legalTargets={legalTargets}
              checkSquare={checkSquare}
              theme={theme}
              flipped={playerColor === "b"}
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

          {clocks[bottomColor] !== null && (
          <Timer
            label={`${colorLabel(bottomColor)}${vsAI ? " (Kamu)" : ""}`}
            seconds={clocks[bottomColor]}
            active={gameStarted && !gameOver && turn === bottomColor}
            expired={timeoutLoser === bottomColor}
          />
          )}
        </div>

        <InfoPanel history={history} />
      </div>
      )}

      <footer className="app__footer">
        {showGame && (
        <button className="btn" type="button" onClick={handleReset}>
          Reset Game
        </button>
        )}
        {showGame && (
        <button
          className="btn btn--ghost"
          type="button"
          onClick={handleBackToMenu}
        >
          Menu Utama
        </button>
        )}
        <button className="btn btn--ghost" type="button" onClick={handleSoundToggle}>
          {soundOn ? "Mute Sound" : "Unmute Sound"}
        </button>
      </footer>
    </main>
  );
}
