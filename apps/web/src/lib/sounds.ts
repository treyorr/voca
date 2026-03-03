/**
 * Notification sounds for peer join/leave events.
 *
 * Supports custom sounds stored as base64 data URLs in localStorage,
 * with configurable volume. Falls back to Web Audio API generated tones.
 */

const STORAGE_KEYS = {
    joinSound: 'voca:sound:join',
    leaveSound: 'voca:sound:leave',
    volume: 'voca:sound:volume',
} as const;

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
}

/** Get the notification volume (0-1). Defaults to 0.5. */
export function getVolume(): number {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.volume);
        if (stored !== null) return Math.max(0, Math.min(1, parseFloat(stored)));
    } catch { }
    return 0.5;
}

/** Set the notification volume (0-1). */
export function setVolume(v: number) {
    try {
        localStorage.setItem(STORAGE_KEYS.volume, String(Math.max(0, Math.min(1, v))));
    } catch { }
}

/** Get a custom sound data URL from localStorage. */
export function getCustomSound(type: 'join' | 'leave'): string | null {
    try {
        return localStorage.getItem(type === 'join' ? STORAGE_KEYS.joinSound : STORAGE_KEYS.leaveSound);
    } catch {
        return null;
    }
}

/** Store a custom sound as a base64 data URL. */
export function setCustomSound(type: 'join' | 'leave', dataUrl: string) {
    try {
        localStorage.setItem(
            type === 'join' ? STORAGE_KEYS.joinSound : STORAGE_KEYS.leaveSound,
            dataUrl,
        );
    } catch { }
}

/** Remove a custom sound, reverting to the default tone. */
export function removeCustomSound(type: 'join' | 'leave') {
    try {
        localStorage.removeItem(type === 'join' ? STORAGE_KEYS.joinSound : STORAGE_KEYS.leaveSound);
    } catch { }
}

/**
 * Read a File as a base64 data URL.
 * Returns null if the file is too large (> 512KB).
 */
export function fileToDataUrl(file: File): Promise<string | null> {
    if (file.size > 512 * 1024) return Promise.resolve(null);
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

// ---------- playback ----------

function playCustom(dataUrl: string, volume: number) {
    const audio = new Audio(dataUrl);
    audio.volume = volume;
    audio.play().catch(() => { });
}

function playGeneratedTone(frequencies: number[], durations: number[], volume: number) {
    const ctx = getAudioContext();
    let time = ctx.currentTime;

    for (let i = 0; i < frequencies.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequencies[i], time);

        gain.gain.setValueAtTime(volume * 0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + durations[i]);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + durations[i]);

        time += durations[i] * 0.6;
    }
}

/** Play the join notification sound. */
export function playJoinSound() {
    const vol = getVolume();
    if (vol === 0) return;
    const custom = getCustomSound('join');
    if (custom) {
        playCustom(custom, vol);
    } else {
        playGeneratedTone([523.25, 659.25], [0.12, 0.18], vol); // C5 → E5
    }
}

/** Play the leave notification sound. */
export function playLeaveSound() {
    const vol = getVolume();
    if (vol === 0) return;
    const custom = getCustomSound('leave');
    if (custom) {
        playCustom(custom, vol);
    } else {
        playGeneratedTone([493.88, 392.0], [0.12, 0.2], vol); // B4 → G4
    }
}
