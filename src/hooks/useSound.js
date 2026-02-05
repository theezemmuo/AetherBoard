import { useRef, useCallback } from 'react';

/**
 * Hook for synthesizing mechanical keyboard sounds using Web Audio API.
 * Zero assets required - purely procedural audio.
 */
export function useSound() {
    const audioContextRef = useRef(null);

    // Initialize AudioContext on first user interaction (lazy load)
    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }, []);

    const playClick = useCallback((profile = 'clicky', keyCode) => {
        initAudio();
        const ctx = audioContextRef.current;
        if (!ctx) return;

        const t = ctx.currentTime;

        // Master Gain
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(0.05, t); // Volume control

        // Calculate unique pitch offset based on keyCode string
        let hash = 0;
        if (keyCode) {
            const str = String(keyCode);
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
        }

        // Normalize hash to a small pitch deviation (+/- 15%)
        const uniqueOffset = (hash % 100) / 400;

        // Combine random jitter with deterministic key offset
        const randomJitter = (Math.random() * 0.1) - 0.05;
        const playbackRate = 1.0 + uniqueOffset + randomJitter;

        if (profile === 'clicky') {
            // High pitched click (White Noise Burst)
            const bufferSize = ctx.sampleRate * 0.05; // 50ms
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            // Filter
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 2000 * playbackRate;

            // Envelope
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(1, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(masterGain);
            noise.start(t);

            // Tonal "Clack" (Sine wave)
            const osc = ctx.createOscillator();
            osc.className = 'triangle';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);

            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.5, t);
            oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

            osc.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start(t);
            osc.stop(t + 0.1);

        } else if (profile === 'linear') {
            // "Thock" sound (Low pass noise + Low sine)
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200 * playbackRate, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.15); // Pitch drop

            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.8, t);
            oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

            // Filtered Noise for texture
            const bufferSize = ctx.sampleRate * 0.1;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.playbackRate.value = playbackRate;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.value = 400 * playbackRate;

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.4, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterGain);
            noise.start(t);

            osc.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start(t);
            osc.stop(t + 0.2);
        }

    }, [initAudio]);

    return { playClick };
}
