// InfoPanel: sidebar with captured pieces and move history (real-time).
import React, { useEffect, useRef } from "react";

// Unicode glyphs for captured pieces, keyed by color then type.
const GLYPHS = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

// Material values for tidy sorting (queen first, pawn last).
const VALUES = { q: 9, r: 5, b: 3, n: 3, p: 1 };

/** Sort captured types by material value, descending. */
function sortCaptured(types) {
  return [...types].sort((a, b) => (VALUES[b] ?? 0) - (VALUES[a] ?? 0));
}

/** Row of captured-piece icons, or a placeholder when empty. */
function CapturedRow({ color, types, label }) {
  const sorted = sortCaptured(types);
  return (
    <div className="captured">
      <span className="captured__label">{label}</span>
      <span className={`captured__pieces piece--${color === "w" ? "white" : "black"}`}>
        {sorted.length === 0 ? (
          <span className="captured__empty">—</span>
        ) : (
          sorted.map((type, i) => <span key={`${type}-${i}`}>{GLYPHS[color][type]}</span>)
        )}
      </span>
    </div>
  );
}

/** Group flat SAN list into rows: [{num, white, black}]. */
function pairMoves(history) {
  const rows = [];
  history.forEach((move, i) => {
    if (i % 2 === 0) rows.push({ num: i / 2 + 1, white: move.san, black: null });
    else rows[rows.length - 1].black = move.san;
  });
  return rows;
}

/** Scrollable SAN history that auto-scrolls to the newest move. */
function MoveHistory({ history }) {
  const listRef = useRef(null);
  const rows = pairMoves(history);

  // Auto-scroll to bottom whenever a new move arrives.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history.length]);

  return (
    <div className="history">
      <h2 className="panel__title">Move History</h2>
      <div className="history__list" ref={listRef}>
        {rows.length === 0 ? (
          <p className="history__empty">No moves yet.</p>
        ) : (
          <ol className="history__rows">
            {rows.map((row) => (
              <li key={row.num} className="history__row">
                <span className="history__num">{row.num}.</span>
                <span className="history__san">{row.white}</span>
                <span className="history__san">{row.black ?? ""}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

/** Sidebar panel: captured pieces (by capturer) + move history. */
export default function InfoPanel({ history }) {
  // Pieces captured BY white are black pieces, and vice versa.
  const capturedByWhite = history
    .filter((m) => m.color === "w" && m.captured)
    .map((m) => m.captured);
  const capturedByBlack = history
    .filter((m) => m.color === "b" && m.captured)
    .map((m) => m.captured);

  return (
    <aside className="panel" aria-label="Game information">
      <section className="panel__section">
        <h2 className="panel__title">Captured Pieces</h2>
        <CapturedRow color="b" types={capturedByWhite} label="Oleh Putih" />
        <CapturedRow color="w" types={capturedByBlack} label="Oleh Hitam" />
      </section>
      <section className="panel__section panel__section--grow">
        <MoveHistory history={history} />
      </section>
    </aside>
  );
}
