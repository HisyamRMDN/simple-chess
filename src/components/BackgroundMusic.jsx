// Persistent background music: single HTML5 <audio> looping a royalty-free
// lo-fi track. Lives at App level so music never resets across screens.
// Autoplay policy: playback starts only after a user click (unlocked flag).
import { useEffect, useRef } from "react";

const BGM_SRC =
  "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"; // lo-fi hip-hop, Pixabay Content License (free)

/** Props: playing (bool), unlocked (bool, first user click happened). */
export default function BackgroundMusic({ playing, unlocked }) {
  const audioRef = useRef(null);

  // Keep one audio element for the whole session; loop + low volume.
  useEffect(() => {
    const audio = new Audio(BGM_SRC);
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Instant on/off; only attempts play after user interaction (autoplay rule).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing && unlocked) {
      audio.play().catch(() => {
        // Stream unreachable or blocked: stay silent, never crash the game.
      });
    } else {
      audio.pause();
    }
  }, [playing, unlocked]);

  return null; // headless: no DOM, controlled purely by props
}
