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

/** Try to move a piece; returns the move object or null if illegal. */
export function makeMove(from, to) {
  try {
    return chess.move({ from, to, promotion: "q" });
  } catch {
    return null;
  }
}

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
