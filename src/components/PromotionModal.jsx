// Promotion picker: vertical stack of 4 choices placed exactly on the
// promotion square (like lichess) — no pop-up offset, no separate title.
import React, { useEffect } from "react";
import { PROMOTION_CHOICES } from "../game.js";

const GLYPHS = {
    w: { q: "♕", r: "♖", n: "♘", b: "♗" },
    b: { q: "♛", r: "♜", n: "♞", b: "♝" },
};

/** Props: color ("w"|"b"), target square ("e8"), onPick(piece), onCancel. */
export default function PromotionModal({ color, target, onPick, onCancel }) {
    // Close on Escape so a pending promotion can be cancelled by keyboard.
    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") onCancel();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onCancel]);

    // Grid position of the target square: columns a→h map to 1→8,
    // rank "8"→row 1, rank "1"→row 8.
    const col = "abcdefgh".indexOf(target[0]) + 1;
    const row = 9 - parseInt(target[1], 10);
    // White promotes on rank 8 (row 1): stack grows downward into the board.
    // Black promotes on rank 1 (row 8): stack grows upward into the board.
    const growDown = target[1] === "8";

    return (
        <div className="promo-overlay" role="presentation" onClick={onCancel}>
            <div
                className="promo"
                role="dialog"
                aria-label="Pilih promosi pion"
                style={{
                    gridColumnStart: col,
                    gridRowStart: growDown ? row : row - 3,
                }}
                onClick={(e) => e.stopPropagation()}>
                {/* Cancel (✕) closes without moving; pawn stays on its square. */}
                <button className="promo__btn promo__btn--cancel" type="button" title="Batal" aria-label="Batal" onClick={onCancel}>
                    ✕
                </button>
                {PROMOTION_CHOICES.map((choice) => (
                    <button
                        key={choice.id}
                        className={`promo__btn piece--${color === "w" ? "white" : "black"}`}
                        type="button"
                        title={choice.label}
                        aria-label={choice.label}
                        onClick={() => onPick(choice.id)}>
                        {GLYPHS[color][choice.id]}
                    </button>
                ))}
            </div>
        </div>
    );
}
