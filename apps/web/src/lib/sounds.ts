/**
 * Notification sounds for peer join/leave events.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(frequencies: number[], durations: number[], volume = 0.15) {
    const ctx = getAudioContext();
    let time = ctx.currentTime;

    for (let i = 0; i < frequencies.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequencies[i], time);

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + durations[i]);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + durations[i]);

        time += durations[i] * 0.6; // slight overlap for smoother sound
    }
}

/** Ascending two-note chime for peer join. */
export function playJoinSound() {
    playTone([523.25, 659.25], [0.12, 0.18], 0.13); // C5 → E5
}

/** Descending two-note tone for peer leave. */
export function playLeaveSound() {
    playTone([493.88, 392.0], [0.12, 0.2], 0.1); // B4 → G4
}
