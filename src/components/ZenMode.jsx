import React, { useState, useEffect, useRef } from 'react';
import { useKeyboard } from '../context/KeyboardContext';
import { useSound } from '../hooks/useSound';
import { ZEN_CONTENT } from '../data/zenContent';
import { ArrowCounterClockwise, CaretLeft } from 'phosphor-react';

export function ZenMode({ onExit }) {
    const { playClick } = useSound();
    // --- Particle System ---
    const particles = useRef([]);
    const requestRef = useRef();

    // Canvas Ref for Particles
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return; // Guard against null canvas

        const ctx = canvas.getContext('2d');

        // Resize canvas to full window to catch all particles
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particles.current.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02; // Decay
                p.size *= 0.95; // Shrink

                if (p.life <= 0 || p.size < 0.1) {
                    particles.current.splice(index, 1);
                } else {
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.life;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // Initialize random content synchronously to avoid null render
    const getRandomContent = () => ZEN_CONTENT[Math.floor(Math.random() * ZEN_CONTENT.length)];

    // State for Rendering (View Only)
    const [, setTick] = useState(0); // Force re-render
    const [isError, setIsError] = useState(false);
    const [stats, setStats] = useState(null); // { wpm, time, accuracy }

    // Refs for Logic (Source of Truth)
    const gameState = useRef({
        content: getRandomContent(),
        currentIndex: 0,
        isComplete: false,
        startTime: null,
        errors: 0,
        totalKeystrokes: 0
    });

    // Initial Sync for Render
    const content = gameState.current.content;
    const currentIndex = gameState.current.currentIndex;
    const isComplete = gameState.current.isComplete;

    const loadNewContent = () => {
        const newContent = getRandomContent();

        // Update Logic Immediate
        gameState.current = {
            content: newContent,
            currentIndex: 0,
            isComplete: false,
            startTime: null,
            errors: 0,
            totalKeystrokes: 0
        };

        setStats(null);
        setIsError(false);
        setTick(t => t + 1); // Trigger Render
    };

    const spawnParticles = (rect) => {
        const count = 5 + Math.random() * 5;

        // Dynamic Theme Color Extraction
        const computedStyle = getComputedStyle(document.documentElement);
        // We try to grab the key-active color, fallback to white
        // Since we can't easily parse OKLCH/Variables in JS canvas without a helper, 
        // we'll try to read the HEX if possible, or just default to a bright accent.
        // For now, let's use a bright cyan/white mix which looks good on all dark themes.
        const colors = ['#ffffff', '#38bdf8', '#f472b6', '#34d399'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        for (let i = 0; i < count; i++) {
            particles.current.push({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 1) * 4 - 2,
                life: 1.0,
                size: 2 + Math.random() * 3,
                color: randomColor
            });
        }
    };

    // Handle typing (Bound Once)
    useEffect(() => {
        const handleKeyDown = (e) => {
            const state = gameState.current;

            // Start Timer on first key
            if (!state.startTime && !state.isComplete) {
                state.startTime = Date.now();
            }

            if (state.isComplete) {
                if (e.key === 'Enter') loadNewContent();
                return;
            }

            // Ignore system keys (Cmd, Ctrl, etc.)
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            // Allow only single chars or Backspace
            if (e.key.length > 1 && e.key !== 'Backspace') return;

            e.preventDefault();

            if (e.key === 'Backspace') {
                if (state.currentIndex > 0) {
                    state.currentIndex--; // OPTIMISTIC UPDATE
                    setTick(t => t + 1); // Trigger Render
                    setIsError(false);
                    try { playClick('linear', 'Backspace'); } catch (err) { }
                }
                return;
            }

            state.totalKeystrokes++;

            // Logic (Case Insensitive)
            const targetChar = state.content?.text[state.currentIndex];
            const isMatch = e.key.toLowerCase() === targetChar.toLowerCase();

            if (isMatch) {
                // Correct
                state.currentIndex++; // OPTIMISTIC UPDATE
                setIsError(false);
                setTick(t => t + 1); // Trigger Render
                try { playClick('clicky', e.key.charCodeAt(0)); } catch (err) { }

                // Particles (Spawn at previous index)
                const typedIndex = state.currentIndex - 1;
                requestAnimationFrame(() => {
                    const charSpans = document.querySelectorAll(`[data-char-index="${typedIndex}"]`);
                    if (charSpans.length > 0) {
                        const rect = charSpans[0].getBoundingClientRect();
                        spawnParticles(rect);
                    }
                });

                // Check Completion
                if (state.currentIndex === state.content.text.length) {
                    state.isComplete = true; // OPTIMISTIC UPDATE

                    // Calculate Stats
                    const endTime = Date.now();
                    const durationSeconds = (endTime - state.startTime) / 1000;
                    const minutes = durationSeconds / 60;
                    const wpm = Math.round((state.content.text.length / 5) / (minutes || 0.01)); // Prevent divide by zero
                    const accuracy = Math.round(((state.totalKeystrokes - state.errors) / state.totalKeystrokes) * 100) || 100;

                    setStats({
                        wpm: wpm > 0 ? wpm : 0,
                        time: durationSeconds.toFixed(1) + 's',
                        accuracy: accuracy + '%'
                    });

                    setTick(t => t + 1);
                    try { playClick('clicky', 1000); } catch (err) { }
                }
            } else {
                // Incorrect
                state.errors++;
                setIsError(true);
                setTimeout(() => setIsError(false), 300);
                try { playClick('linear', 50); } catch (err) { }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playClick]);



    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] relative z-10 w-full max-w-5xl mx-auto">

            {/* Header / Exit */}
            <div className="absolute -top-20 left-4 md:left-0 flex items-center justify-between w-full">
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 text-skin-muted hover:text-skin-text transition-colors"
                >
                    <CaretLeft size={20} />
                    <span className="font-mono text-sm">Exit Zen Mode</span>
                </button>

                {/* PERSISTENT STATS DASHBOARD */}
                {stats && (
                    <div className="flex gap-6 font-mono text-sm animate-in fade-in slide-in-from-right-8">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-skin-muted uppercase tracking-widest">WPM</span>
                            <span className="text-skin-key-active font-bold text-lg">{stats.wpm}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-skin-muted uppercase tracking-widest">ACC</span>
                            <span className={`font-bold text-lg ${parseInt(stats.accuracy) > 95 ? 'text-green-400' : 'text-yellow-400'}`}>{stats.accuracy}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Particle Canvas Loop */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-50"
            />

            {/* Main Game Area */}
            <div className={`relative z-10 font-mono transition-all duration-500 ${isComplete ? 'scale-95 opacity-50 blur-[2px]' : 'scale-100 opacity-100'}`}>
                <div className="text-3xl md:text-5xl leading-tight text-center tracking-wide max-w-4xl mx-auto">
                    {/* Render Content */}
                    {content.text.split('').map((char, i) => {
                        let className = "transition-all duration-75 inline-block "; // inline-block for transforms
                        if (i < currentIndex) {
                            className += "text-skin-key-active drop-shadow-glow";
                        } else if (i === currentIndex) {
                            className += `text-skin-text bg-skin-key-active/20 rounded px-1 animate-pulse ${isError ? 'animate-shake text-rose-500 bg-rose-500/20' : ''}`;
                        } else {
                            className += "text-skin-muted opacity-20";
                        }
                        return (
                            <span key={i} data-char-index={i} className={className}>
                                {char}
                            </span>
                        );
                    })}
                </div>

                <div className="mt-8 text-center">
                    <div className="text-sm font-sans text-skin-muted uppercase tracking-widest opacity-60">
                        — {content.author}
                    </div>
                </div>
            </div>

            {/* INLINE COMPLETION PROMPT */}
            {isComplete && (
                <div className="absolute bottom-20 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8">
                    <div className="text-skin-key-active font-mono text-xl mb-2 font-bold tracking-widest">
                        SECTION COMPLETE
                    </div>
                    <div className="text-skin-muted text-sm flex items-center gap-2 animate-pulse">
                        Press <span className="border border-skin-muted px-2 py-0.5 rounded text-xs">Enter</span> to continue
                    </div>
                </div>
            )}
        </div>
    );
}
