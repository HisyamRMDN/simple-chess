// Timer component: displays one player's clock in MM:SS format.
import React from "react";

/** Format seconds as MM:SS. */
export function formatTime(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(clamped / 60)).padStart(2, "0");
  const seconds = String(clamped % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/** Single chess clock; props: label, seconds, active (running), expired. */
export default function Timer({ label, seconds, active, expired }) {
  let className = "timer";
  if (active) className += " timer--active";
  if (expired) className += " timer--expired";
  return (
    <div className={className} aria-live="polite">
      <span className="timer__label">{label}</span>
      <span className="timer__time">{formatTime(seconds)}</span>
    </div>
  );
}
