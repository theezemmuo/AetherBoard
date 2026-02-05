import React, { useState, useRef, useEffect } from 'react';
import { useKeyboard } from '../context/KeyboardContext';
import { Palette, Check } from 'phosphor-react';

export function ThemeSelector() {
    const { theme, setTheme } = useKeyboard();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const themes = [
        { id: 'dark', label: 'Dark', color: '#1e293b' },
        { id: 'light', label: 'Light', color: '#f8fafc' },
        { id: 'neon', label: 'Neon', color: '#00ffff' },
        { id: 'retro', label: 'Retro', color: '#e0d8c0' },
        { id: 'glass', label: 'Glass', color: '#a3a3a3' },
        { id: 'ocean', label: 'Ocean', color: '#0ea5e9' },
        { id: 'sunset', label: 'Sunset', color: '#c026d3' },
    ];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-full border border-skin-border backdrop-blur-md transition-all shadow-sm text-skin-text ${isOpen ? 'bg-skin-key-active text-skin-key-active-text' : 'bg-skin-card hover:opacity-80'}`}
                title="Select Theme"
            >
                <Palette size={20} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 min-w-[140px] bg-skin-card border border-skin-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 p-1 z-50">
                    <div className="flex flex-col gap-0.5">
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setTheme(t.id);
                                    setIsOpen(false);
                                }}
                                className={`
                                    flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                                    ${theme === t.id
                                        ? 'bg-skin-key-active text-skin-key-active-text font-semibold'
                                        : 'text-skin-text hover:bg-black/5 dark:hover:bg-white/10'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                                        style={{ backgroundColor: t.color }}
                                    />
                                    {t.label}
                                </div>
                                {theme === t.id && <Check size={14} weight="bold" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
