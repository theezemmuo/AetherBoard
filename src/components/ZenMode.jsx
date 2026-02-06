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
    const [, setTick] = useState(0);
    const [isError, setIsError] = useState(false);
    const [stats, setStats] = useState(null);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [level, setLevel] = useState(1);
    const [quotesCompleted, setQuotesCompleted] = useState(0);

    // Refs for Logic (Source of Truth)
    const gameState = useRef({
        content: getRandomContent(),
        currentIndex: 0,
        isComplete: false,
        startTime: null,
        errors: 0,
        totalKeystrokes: 0,
        currentCombo: 0
    });

    // Initial Sync for Render
    const content = gameState.current.content;
    const currentIndex = gameState.current.currentIndex;
    const isComplete = gameState.current.isComplete;

    const loadNewContent = () => {
        const newContent = getRandomContent();

        gameState.current = {
            content: newContent,
            currentIndex: 0,
            isComplete: false,
            startTime: null,
            errors: 0,
            totalKeystrokes: 0,
            currentCombo: 0
        };

        // Keep Level/Quotes but reset session stats
        setStats(null);
        setIsError(false);
        setCombo(0);
        setTick(t => t + 1);
    };

    const spawnParticles = (rect) => {
        // More particles for higher combos!
        const comboMultiplier = Math.min(gameState.current.currentCombo / 10, 3);
        const count = (5 + Math.random() * 5) + (comboMultiplier * 2);

        const colors = ['#ffffff', '#38bdf8', '#f472b6', '#34d399', '#facc15'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        for (let i = 0; i < count; i++) {
            particles.current.push({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                vx: (Math.random() - 0.5) * (4 + comboMultiplier),
                vy: (Math.random() - 1) * (4 + comboMultiplier) - 2,
                life: 1.0,
                size: (2 + Math.random() * 3) + (comboMultiplier),
                color: randomColor
            });
        }
    };

    // Handle typing (Bound Once)
    useEffect(() => {
        const handleKeyDown = (e) => {
            const state = gameState.current;

            if (!state.startTime && !state.isComplete) {
                state.startTime = Date.now();
            }

            if (state.isComplete) {
                if (e.key === 'Enter') loadNewContent();
                return;
            }

            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key.length > 1 && e.key !== 'Backspace') return;

            e.preventDefault();

            if (e.key === 'Backspace') {
                if (state.currentIndex > 0) {
                    state.currentIndex--;
                    state.currentCombo = 0; // Break combo on backspace
                    setCombo(0); // Sync Render
                    setTick(t => t + 1);
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
                state.currentIndex++;
                state.currentCombo++;
                if (state.currentCombo > maxCombo) setMaxCombo(state.currentCombo);
                setCombo(state.currentCombo); // Sync Render

                setIsError(false);
                setTick(t => t + 1);

                // Combo Pitch Scale? (Simple Implementation)
                // const pitch = 1 + (Math.min(state.currentCombo, 20) / 40);
                try { playClick('clicky', e.key.charCodeAt(0)); } catch (err) { }

                // Particles
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
                    state.isComplete = true;

                    // Stats
                    const endTime = Date.now();
                    const durationSeconds = (endTime - state.startTime) / 1000;
                    const minutes = durationSeconds / 60;
                    const wpm = Math.round((state.content.text.length / 5) / (minutes || 0.01));
                    const accuracy = Math.round(((state.totalKeystrokes - state.errors) / state.totalKeystrokes) * 100) || 100;

                    setStats({
                        wpm: wpm > 0 ? wpm : 0,
                        time: durationSeconds.toFixed(1) + 's',
                        accuracy: accuracy + '%'
                    });

                    // Level Up Logic
                    setQuotesCompleted(prev => {
                        const newCount = prev + 1;
                        if (newCount % 3 === 0) setLevel(l => l + 1); // Level up every 3 quotes
                        return newCount;
                    });

                    setTick(t => t + 1);
                    try { playClick('clicky', 1000); } catch (err) { }
                }
            } else {
                // Incorrect
                state.errors++;
                state.currentCombo = 0; // combo break
                setCombo(0);
                setIsError(true);
                setTimeout(() => setIsError(false), 300);
                try { playClick('linear', 50); } catch (err) { }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playClick]); // Keep playClick dep

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

                {/* HUD: Level & Combo */}
                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-skin-muted uppercase tracking-widest">Level</span>
                        <span className="text-skin-text font-bold text-xl">{level}</span>
                    </div>

                    {/* Dynamic Combo Counter */}
                    <div className={`flex flex-col items-center transition-all duration-100 ${combo > 5 ? 'scale-110' : 'scale-100'}`}>
                        <span className="text-[10px] text-skin-muted uppercase tracking-widest">Combo</span>
                        <span className={`font-bold text-xl transition-colors ${combo > 10 ? 'text-amber-400 animate-pulse' : combo > 5 ? 'text-skin-key-active' : 'text-skin-muted'}`}>
                            {combo}x
                        </span>
                    </div>

                    {/* Stats Dashboard (Only appears after 1 run) */}
                    {stats && (
                        <div className="flex gap-6 font-mono text-sm animate-in fade-in slide-in-from-right-8 border-l border-skin-border pl-8">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-skin-muted uppercase tracking-widest">WPM</span>
                                <span className="text-skin-key-active font-bold text-lg">{stats.wpm}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-skin-muted uppercase tracking-widest">ACC</span>
                                <span className="font-bold text-lg text-green-400">{stats.accuracy}</span>
                            </div>
                        </div>
                    )}
                </div>
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
                        let className = "transition-all duration-75 inline-block ";
                        if (i < currentIndex) {
                            className += "text-skin-key-active drop-shadow-glow";
                        } else if (i === currentIndex) {
                            className += `text-skin-text bg-skin-key-active/20 rounded px-1 animate-pulse ${isError ? 'animate-shake text-rose-500 bg-rose-500/20' : ''}`;
                        } else {
                            className += "text-skin-muted opacity-20";
                        }

                        // Handle Space Rendering: Replace space with &nbsp; for visual persistence
                        const displayChar = char === ' ' ? '\u00A0' : char;

                        return (
                            <span key={i} data-char-index={i} className={className}>
                                {displayChar}
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
