// Game logic layer: wraps chess.js, no DOM/React access here.
import { Chess } from "chess.js";

let chess = new Chess();

/** Reset to the starting position. */
export function resetGame() {
  chess = new Chess();
}

/** Return the 8x8 board matrix (rank 8 first). Cells are {square, type, color} or null. */
export function getBoard() {
  return chess.board();
}

/** Return legal target squares for a piece on the given square. */
export function getLegalMoves(square) {
  return chess.moves({ square, verbose: true }).map((move) => move.to);
}

/** Try to move a piece; `promotion` is "q"|"r"|"b"|"n". Returns move or null. */
export function makeMove(from, to, promotion = "q") {
  try {
    return chess.move({ from, to, promotion });
  } catch {
    return null;
  }
}

/** True if moving from→to is a pawn promotion (needs piece choice). */
export function isPromotionMove(from, to) {
  return chess
    .moves({ square: from, verbose: true })
    .some((m) => m.to === to && m.promotion);
}

/** Promotion piece choices with Indonesian labels. */
export const PROMOTION_CHOICES = [
  { id: "q", label: "Menteri" },
  { id: "r", label: "Benteng" },
  { id: "n", label: "Kuda" },
  { id: "b", label: "Gajah" },
]

/** Return the color to move: "w" or "b". */
export function getTurn() {
  return chess.turn();
}

/** Return a short status text: checkmate, draw, check, or empty string. */
export function getStatus() {
  if (chess.isCheckmate()) return "Checkmate!";
  if (chess.isDraw()) return "Draw";
  if (chess.isCheck()) return "Check!";
  return "";
}

/** Return FEN string, useful as a React state trigger. */
export function getFen() {
  return chess.fen();
}

/** Return the square of the king currently in check, or null. */
export function getCheckSquare() {
  if (!chess.isCheck()) return null;
  const color = chess.turn(); // side to move is the side in check
  const board = chess.board();
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.type === "k" && cell.color === color) return cell.square;
    }
  }
  return null;
}

/** Return verbose move history: [{color, san, captured, ...}] in play order. */

/** Return the piece on a square: {type, color} or null. */
export function getPiece(square) {
  return chess.get(square);
}

/** Return all legal moves (verbose) for the side to move. */
export function getAllMoves() {
  return chess.moves({ verbose: true });
}
export function getHistory() {
  return chess.history({ verbose: true });
}

/** Try to move using a UCI string like "e2e4" or "e7e8q"; returns move or null. */
export function makeMoveUci(uci) {
  try {
    return chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.slice(4) || "q",
    });
  } catch {
    return null;
  }
}
