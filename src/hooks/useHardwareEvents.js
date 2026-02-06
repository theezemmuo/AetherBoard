import { useEffect } from 'react';
import { useKeyboard } from '../context/KeyboardContext';
import { useSound } from './useSound';

export function useHardwareEvents({ enabled = true } = {}) {
    const { markKeyPressed, markKeyReleased, clearTested } = useKeyboard();
    const { playClick } = useSound();

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e) => {
            e.preventDefault();

            // Special function: Delete to reset
            if (e.code === 'Delete') {
                clearTested();
                playClick('linear', e.code);
            } else {
                playClick('clicky', e.code);
            }

            markKeyPressed(e.code);
        };

        const handleKeyUp = (e) => {
            e.preventDefault();
            markKeyReleased(e.code);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [markKeyPressed, markKeyReleased, clearTested]);
}
