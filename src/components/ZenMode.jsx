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

    // State for Rendering
    const [content, setContent] = useState(getRandomContent);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isError, setIsError] = useState(false);
    const [, setTick] = useState(0); // Force re-render if needed

    // Refs for Logic (Avoids Stale Closures)
    const gameState = useRef({
        content: content,
        currentIndex: 0,
        isComplete: false
    });

    // Update refs when state changes
    useEffect(() => {
        gameState.current.content = content;
        gameState.current.currentIndex = currentIndex;
        gameState.current.isComplete = isComplete;
    }, [content, currentIndex, isComplete]);

    const loadNewContent = () => {
        const newContent = getRandomContent();
        setContent(newContent);
        setCurrentIndex(0);
        setIsComplete(false);
        setIsError(false);

        // Update refs immediately for any sync events
        gameState.current = {
            content: newContent,
            currentIndex: 0,
            isComplete: false
        };
    };

    const spawnParticles = (rect) => {
        const count = 5 + Math.random() * 5; // 5-10 particles
        // Get theme color from variable or default to Cyan
        const computedStyle = getComputedStyle(document.documentElement);
        // We can't easily get the explicit hex color if it's OKLCH in CSS var, 
        // so we'll hardcode a "bright" fallback or try to read a safe var
        // For now, let's use white/bright particles that take the tint of the theme potentially
        // better: use a few predefined colors or white

        for (let i = 0; i < count; i++) {
            particles.current.push({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                vx: (Math.random() - 0.5) * 4, // Random spread X
                vy: (Math.random() - 1) * 4 - 2, // Upward trend
                life: 1.0,
                size: 2 + Math.random() * 3,
                color: '#ffffff' // White particles work best on colored backgrounds
            });
        }
    };

    // Handle typing (Bound Once)
    useEffect(() => {
        const handleKeyDown = (e) => {
            const state = gameState.current;
            console.log('[Zen] Key:', e.key, 'Expected:', state.content?.text[state.currentIndex]);

            if (state.isComplete) {
                if (e.key === 'Enter') loadNewContent();
                return;
            }

            // Ignore system keys
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key.length > 1 && e.key !== 'Backspace') return;

            e.preventDefault();

            if (e.key === 'Backspace') {
                if (state.currentIndex > 0) {
                    setCurrentIndex(prev => prev - 1);
                    setIsError(false);
                    try { playClick('linear', 'Backspace'); } catch (err) { }
                }
                return;
            }

            // Logic
            const targetChar = state.content?.text[state.currentIndex];

            if (e.key === targetChar) {
                // Correct
                setCurrentIndex(prev => prev + 1);
                setIsError(false);
                try { playClick('clicky', e.key.charCodeAt(0)); } catch (err) { }

                // Particles
                const charSpans = document.querySelectorAll(`[data-char-index="${state.currentIndex}"]`);
                if (charSpans.length > 0) {
                    const rect = charSpans[0].getBoundingClientRect();
                    spawnParticles(rect);
                }

                // Check Completion
                if (state.currentIndex + 1 === state.content.text.length) {
                    setIsComplete(true);
                    try { playClick('clicky', 1000); } catch (err) { }
                }
            } else {
                // Incorrect
                setIsError(true);
                setTimeout(() => setIsError(false), 300);
                try { playClick('linear', 50); } catch (err) { }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playClick]); // Only re-bind if playClick changes (which it shouldn't)



    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] relative z-10 w-full max-w-4xl mx-auto">

            {/* Header / Exit */}
            <div className="absolute -top-16 left-0 flex items-center gap-4">
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 text-skin-muted hover:text-skin-text transition-colors"
                >
                    <CaretLeft size={20} />
                    <span className="font-mono text-sm">Exit Zen Mode</span>
                </button>
            </div>

            {/* Particle Canvas Layer - Fixed to screen to handle absolute coords */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-50"
            />

            {/* Text Display */}
            <div className="relative z-10 font-mono text-3xl md:text-4xl leading-relaxed text-center tracking-wide">
                <div className="mb-4">
                    {/* Render Character by Character */}
                    {content.text.split('').map((char, i) => {
                        let className = "transition-colors duration-100 ";
                        if (i < currentIndex) {
                            className += "text-skin-key-active drop-shadow-glow"; // Typed Correctly
                        } else if (i === currentIndex) {
                            // Current Cursor
                            className += `text-skin-text bg-skin-key-active/20 rounded px-1 animate-pulse ${isError ? 'animate-shake text-rose-500 bg-rose-500/20' : ''}`;
                        } else {
                            className += "text-skin-muted opacity-30"; // Untyped
                        }
                        return (
                            <span
                                key={i}
                                data-char-index={i}
                                className={className}
                            >
                                {char}
                            </span>
                        );
                    })}
                </div>

                <div className="mt-8 text-sm font-sans text-skin-muted uppercase tracking-widest opacity-60">
                    — {content.author}
                </div>
            </div>

            {/* Completion Message */}
            {isComplete && (
                <div className="mt-12 animate-in fade-in slide-in-from-bottom-4">
                    <button
                        onClick={loadNewContent}
                        className="flex items-center gap-2 px-6 py-3 bg-skin-key-active text-skin-key-active-text rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-skin-key-active/20"
                    >
                        <ArrowCounterClockwise size={20} />
                        Next Quote (Enter)
                    </button>
                </div>
            )}
        </div>
    );
}
