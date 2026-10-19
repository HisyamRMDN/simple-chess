// Post-match scoreboard: covers the screen when the game ends (checkmate,
// draw, or timeout). Shows result, stats, Stockfish accuracy, and actions.
import React from "react";
import { RotateCcw, Home, Loader2, Trophy, Scale, Timer, Swords, Cookie } from "lucide-react";

/** Format seconds as MM:SS (null = no clock). */
function formatTime(seconds) {
    if (seconds === null || seconds === undefined) return "∞";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Props:
 *  title ("PUTIH MENANG"|"HITAM MENANG"|"SERI"), reason (subtitle),
 *  totalMoves, clocks {w,b}, capturedByWhite, capturedByBlack,
 *  accuracy {w, b} (percent or null while analyzing),
 *  analyzing (bool), onRematch(), onMenu(). */
export default function PostMatchScreen({ title, reason, totalMoves, clocks, capturedByWhite, capturedByBlack, accuracy, analyzing, onRematch, onMenu }) {
    const isDraw = title === "SERI";
    const TitleIcon = isDraw ? Scale : Trophy;
    const stats = [
        { icon: Swords, label: "Total Langkah", value: String(totalMoves) },
        { icon: Timer, label: "Sisa Waktu P / H", value: `${formatTime(clocks.w)} / ${formatTime(clocks.b)}` },
        { icon: Cookie, label: "Dimakan Putih / Hitam", value: `${capturedByWhite} / ${capturedByBlack}` },
    ];

    return (
        <div className="screen-enter fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-center shadow-2xl sm:p-8">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-400/15">
                    <TitleIcon size={28} className="text-amber-400" aria-hidden="true" />
                </div>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-50 sm:text-4xl">{title}</h1>
                <p className="mt-1 text-sm text-zinc-400">{reason}</p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                    {stats.map((s) => (
                        <div key={s.label} className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-2 py-3">
                            <s.icon size={18} className="mx-auto text-zinc-400" aria-hidden="true" />
                            <p className="mt-1.5 text-sm font-bold text-zinc-50">{s.value}</p>
                            <p className="mt-0.5 text-[11px] leading-tight text-zinc-400">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                    {["w", "b"].map((c) => (
                        <div key={c} className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Akurasi {c === "w" ? "Putih" : "Hitam"}</p>
                            {analyzing || accuracy[c] === null ? (
                                <p className="mt-1 flex items-center justify-center gap-2 text-lg font-bold text-zinc-300">
                                    <Loader2 size={18} className="animate-spin" aria-hidden="true" />…
                                </p>
                            ) : (
                                <p className="mt-1 text-2xl font-extrabold text-amber-400">{accuracy[c]}%</p>
                            )}
                        </div>
                    ))}
                </div>
                {analyzing && <p className="mt-2 text-xs text-zinc-500">Stockfish menganalisis permainan…</p>}

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={onRematch}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-base font-bold text-zinc-950 transition hover:-translate-y-0.5 hover:bg-amber-500">
                        <RotateCcw size={18} strokeWidth={2.4} aria-hidden="true" />
                        Main Lagi
                    </button>
                    <button
                        type="button"
                        onClick={onMenu}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-transparent px-5 py-3 text-base font-semibold text-zinc-200 transition hover:-translate-y-0.5 hover:border-amber-400 hover:text-amber-300">
                        <Home size={18} strokeWidth={2} aria-hidden="true" />
                        Menu Utama
                    </button>
                </div>
            </div>
        </div>
    );
}
