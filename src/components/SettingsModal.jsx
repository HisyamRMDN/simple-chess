// Settings modal: global preferences (BGM, sound FX, app theme).
// Rendered conditionally; unmounted on close.
import React from "react";
import { X, Music, Volume2, Moon, Sun } from "lucide-react";

/** Props: bgmOn, soundOn, darkMode, onToggleBgm(), onToggleSound(), onToggleMode(), onClose(). */
export default function SettingsModal({ bgmOn, soundOn, darkMode, onToggleBgm, onToggleSound, onToggleMode, onClose }) {
    return (
        <div className="screen-enter fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" role="presentation" onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl" role="dialog" aria-label="Pengaturan" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-50">Pengaturan</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup pengaturan"
                        className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={onToggleBgm}
                        aria-pressed={bgmOn}
                        className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 transition hover:border-amber-400">
                        <span className="flex items-center gap-3 text-sm font-medium text-zinc-100">
                            <Music size={18} aria-hidden="true" />
                            Musik Latar (BGM)
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${bgmOn ? "bg-amber-400 text-zinc-950" : "bg-zinc-700 text-zinc-300"}`}>{bgmOn ? "On" : "Off"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onToggleSound}
                        aria-pressed={soundOn}
                        className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 transition hover:border-amber-400">
                        <span className="flex items-center gap-3 text-sm font-medium text-zinc-100">
                            <Volume2 size={18} aria-hidden="true" />
                            Efek Suara
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${soundOn ? "bg-amber-400 text-zinc-950" : "bg-zinc-700 text-zinc-300"}`}>{soundOn ? "On" : "Off"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onToggleMode}
                        aria-pressed={darkMode}
                        className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 transition hover:border-amber-400">
                        <span className="flex items-center gap-3 text-sm font-medium text-zinc-100">
                            {darkMode ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
                            Mode Gelap
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${darkMode ? "bg-amber-400 text-zinc-950" : "bg-zinc-700 text-zinc-300"}`}>{darkMode ? "On" : "Off"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
