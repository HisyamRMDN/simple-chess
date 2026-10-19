// Landing hero: first screen (centered, minimal). Play -> setup screen.
import React from "react";
import { Play, Settings } from "lucide-react";

/** Props: onPlay(), onSettings(). Mount/unmount animated via .screen-enter. */
export default function LandingMenu({ onPlay, onSettings }) {
    return (
        <div className="screen-enter fixed inset-0 z-50 grid place-items-center bg-zinc-950 px-4">
            <div className="flex flex-col items-center text-center">
                <p className="hero-rise text-6xl leading-none text-zinc-100" aria-hidden="true">
                    ♞
                </p>
                <h1 className="hero-rise hero-rise--1 mt-4 text-6xl font-extrabold tracking-tight text-zinc-50 sm:text-7xl" style={{ animationDelay: "80ms" }}>
                    VIBE CHESS
                </h1>
                <p className="hero-rise mt-3 max-w-md text-sm text-zinc-400 sm:text-base" style={{ animationDelay: "160ms" }}>
                    Catur cepat melawan Stockfish atau teman — atur mode, waktu, dan warna bidakmu.
                </p>
                <div className="hero-rise mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
                    <button
                        type="button"
                        onClick={onPlay}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-base font-bold text-zinc-950 transition hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-[0_10px_24px_rgba(251,191,36,0.35)]">
                        <Play size={20} strokeWidth={2.4} aria-hidden="true" />
                        Mulai Bermain
                    </button>
                    <button
                        type="button"
                        onClick={onSettings}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-transparent px-6 py-3.5 text-base font-semibold text-zinc-200 transition hover:-translate-y-0.5 hover:border-amber-400 hover:text-amber-300">
                        <Settings size={20} strokeWidth={2} aria-hidden="true" />
                        Pengaturan
                    </button>
                </div>
            </div>
        </div>
    );
}
