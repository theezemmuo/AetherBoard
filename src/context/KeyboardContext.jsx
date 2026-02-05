import React, { createContext, useContext, useState, useCallback } from 'react';

const KeyboardContext = createContext(null);

export function KeyboardProvider({ children }) {
    const [activeKeys, setActiveKeys] = useState(new Set());
    const [testedKeys, setTestedKeys] = useState(new Set());
    const [layout, setLayout] = useState('full'); // 'compact' | 'full'
    const [os, setOs] = useState('mac'); // 'mac' | 'win'
    const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
    const [history, setHistory] = useState([]); // Array of { code, time, isChatter }

    // Apply theme to document
    React.useEffect(() => {
        if (theme === 'dark' || theme === 'neon') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        document.documentElement.setAttribute('data-theme', theme);

        document.body.classList.remove('light', 'neon', 'retro');
        if (theme !== 'dark') {
            document.body.classList.add(theme);
        }
    }, [theme]);

    // Detect OS on mount
    React.useEffect(() => {
        const platform = navigator.platform || '';
        const userAgent = navigator.userAgent || '';

        // Simple Mac detection
        if (/Mac|iPod|iPhone|iPad/.test(platform) || /Mac/i.test(userAgent)) {
            setOs('mac');
        } else {
            setOs('win');
        }
    }, []);

    const markKeyPressed = useCallback((code) => {
        const now = Date.now();
        setActiveKeys((prev) => {
            const newSet = new Set(prev);
            newSet.add(code);
            return newSet;
        });
        setTestedKeys((prev) => {
            const newSet = new Set(prev);
            newSet.add(code);
            return newSet;
        });

        setHistory(prev => {
            // Check for chatter (same key pressed < 50ms ago)
            const lastEvent = prev[0];
            const isChatter = lastEvent && lastEvent.code === code && (now - lastEvent.time < 50);

            // Keep last 20 events
            const newEvent = { code, time: now, isChatter };
            return [newEvent, ...prev].slice(0, 20);
        });
    }, []);

    const markKeyReleased = useCallback((code) => {
        setActiveKeys((prev) => {
            const newSet = new Set(prev);
            newSet.delete(code);
            return newSet;
        });
    }, []);

    const clearTested = useCallback(() => {
        setTestedKeys(new Set());
        setHistory([]);
    }, []);

    const value = {
        activeKeys,
        testedKeys,
        layout,
        setLayout,
        os,
        setOs,
        theme,
        setTheme,
        markKeyPressed,
        markKeyReleased,
        clearTested,
        history,
    };

    return (
        <KeyboardContext.Provider value={value}>
            {children}
        </KeyboardContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useKeyboard() {
    const context = useContext(KeyboardContext);
    if (!context) {
        throw new Error('useKeyboard must be used within a KeyboardProvider');
    }
    return context;
}
