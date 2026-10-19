// Sound layer: synthesizes 3 game sounds with Web Audio API (no MP3 files needed).
// Types: normal move (soft thock), capture (punchy thud), check/checkmate (alert).
let ctx = null;
let enabled = true;

/** Enable or mute all sounds. */
export function setSoundEnabled(value) {
    enabled = value;
}

/** Lazily create (and resume) the shared AudioContext on user gesture. */
function getContext() {
    if (!ctx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return null;
        ctx = new AudioCtor();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
}

/** Play one oscillator tone with a quick decay envelope. */
function playTone({ freq, endFreq = null, delay = 0, duration = 0.12, type = "sine", volume = 0.2 }) {
    const audio = getContext();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
}

/** Guard: skip when muted; never let audio errors break the game. */
function safePlay(fn) {
    if (!enabled) return;
    try {
        fn();
    } catch {
        /* ignore audio failures */
    }
}

/** Short wooden "thock" for a normal move. */
export function playMoveSound() {
    safePlay(() => {
        playTone({ freq: 520, endFreq: 220, duration: 0.09, type: "triangle", volume: 0.25 });
    });
}

/** Lower, punchier thud for capturing an opponent piece. */
export function playCaptureSound() {
    safePlay(() => {
        playTone({ freq: 300, endFreq: 90, duration: 0.16, type: "square", volume: 0.18 });
        playTone({ freq: 600, endFreq: 250, delay: 0.03, duration: 0.1, type: "triangle", volume: 0.2 });
    });
}

/** Rising alert for check; longer fanfare when isMate is true. */
export function playCheckSound(isMate = false) {
    safePlay(() => {
        playTone({ freq: 660, duration: 0.12, type: "sine", volume: 0.22 });
        playTone({ freq: 880, delay: 0.12, duration: 0.15, type: "sine", volume: 0.22 });
        if (isMate) {
            playTone({ freq: 1108, delay: 0.27, duration: 0.3, type: "sine", volume: 0.25 });
        }
    });
}
