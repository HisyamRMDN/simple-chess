// Setup screen: Mode -> Waktu -> Warna, then Start. Shown only after Play.
// Sends { mode: "local"|"ai", timeMinutes: 3|5|10|null, color: "w"|"b" }
// to the parent via onStartGame. Back button returns to landing.
import React, { useState } from "react";
import {
  Users,
  Bot,
  Timer,
  Infinity as InfinityIcon,
  Crown,
  Shuffle,
  Play,
  ArrowLeft,
} from "lucide-react";

const MODES = [
  { id: "local", label: "Lokal", hint: "2 pemain", icon: Users },
  { id: "ai", label: "Bot", hint: "vs Stockfish", icon: Bot },
];

const TIMES = [
  { id: 3, label: "3", hint: "Blitz" },
  { id: 5, label: "5", hint: "Blitz" },
  { id: 10, label: "10", hint: "Rapid" },
  { id: null, label: "∞", hint: "Tanpa waktu", icon: InfinityIcon },
];

const COLORS = [
  { id: "w", label: "Putih", icon: Crown },
  { id: "b", label: "Hitam", icon: Crown },
  { id: "random", label: "Acak", icon: Shuffle },
];

/** Props: onStartGame(config), onBack(). Mount/unmount animated via .screen-enter. */
export default function MainMenu({ onStartGame, onBack }) {
  const [mode, setMode] = useState("ai");
  const [timeMinutes, setTimeMinutes] = useState(5);
  const [color, setColor] = useState("w");

  function handleStart() {
    const resolvedColor =
      color === "random" ? (Math.random() < 0.5 ? "w" : "b") : color;
    onStartGame({ mode, timeMinutes, color: resolvedColor });
  }

  return (
    <div className="screen-enter menu" role="dialog" aria-label="Pengaturan Permainan">
      <div className="menu__card">
        <button className="menu__back" type="button" onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" /> Kembali
        </button>
        <p className="menu__logo" aria-hidden="true">
          ♞
        </p>
        <h1 className="menu__title">Vibe Chess</h1>
        <p className="menu__subtitle">Atur permainan, lalu tekan Mulai</p>

        <div className="menu__bento">
          <section className="menu__group" aria-label="Mode permainan">
            <p className="menu__label">Mode</p>
            <div className="menu__choices">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    className={`menu__btn${active ? " menu__btn--active" : ""}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setMode(m.id)}
                  >
                    <Icon size={26} strokeWidth={1.8} aria-hidden="true" />
                    <span className="menu__btn-label">{m.label}</span>
                    <span className="menu__btn-hint">{m.hint}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="menu__group" aria-label="Waktu permainan">
            <p className="menu__label">
              <Timer size={14} strokeWidth={2} aria-hidden="true" /> Waktu (menit)
            </p>
            <div className="menu__choices menu__choices--time">
              {TIMES.map((t) => {
                const active = timeMinutes === t.id;
                return (
                  <button
                    key={String(t.id)}
                    className={`menu__btn menu__btn--time${active ? " menu__btn--active" : ""}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTimeMinutes(t.id)}
                  >
                    <span className="menu__time">
                      {t.icon ? <t.icon size={24} strokeWidth={1.8} aria-hidden="true" /> : t.label}
                    </span>
                    <span className="menu__btn-hint">{t.hint}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="menu__group" aria-label="Warna bidak">
            <p className="menu__label">Warna</p>
            <div className="menu__choices">
              {COLORS.map((c) => {
                const Icon = c.icon;
                const active = color === c.id;
                return (
                  <button
                    key={c.id}
                    className={`menu__btn${active ? " menu__btn--active" : ""}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setColor(c.id)}
                  >
                    <span
                      className={`menu__piece-icon menu__piece-icon--${c.id}`}
                      aria-hidden="true"
                    >
                      <Icon size={26} strokeWidth={1.8} />
                    </span>
                    <span className="menu__btn-label">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <button className="menu__start" type="button" onClick={handleStart}>
          <Play size={18} strokeWidth={2.2} aria-hidden="true" /> Mulai
        </button>
      </div>
    </div>
  );
}

