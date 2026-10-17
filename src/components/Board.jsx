// UI component: renders the 8x8 board with highlights (replaces ui.js).
import React from "react";

const PIECES = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

/** Board grid; props: board matrix, selectedSquare, legalTargets, theme, onSquareClick. */
export default function Board({ board, selectedSquare, legalTargets, theme, onSquareClick }) {
  return (
    <div className={`board board--${theme}`} role="grid" aria-label="Chess board">
      {board.map((row, rankIndex) =>
        row.map((cell, fileIndex) => {
          const name = "abcdefgh"[fileIndex] + (8 - rankIndex);
          const isLight = (rankIndex + fileIndex) % 2 === 0;
          let className = `square ${isLight ? "square--light" : "square--dark"}`;
          if (name === selectedSquare) className += " square--selected";
          if (legalTargets.includes(name)) className += " square--move";
          return (
            <div
              key={name}
              className={className}
              role="gridcell"
              onClick={() => onSquareClick(name)}
            >
              {cell && (
                <span
                  className={`piece piece--${cell.color === "w" ? "white" : "black"}`}
                >
                  {PIECES[cell.color][cell.type]}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
