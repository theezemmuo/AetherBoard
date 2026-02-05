import React, { memo } from 'react';
import { useKeyboard } from '../context/KeyboardContext';
import { WarningCircle } from 'phosphor-react';

export const HistoryLog = memo(() => {
    const { history } = useKeyboard();

    if (history.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 px-4 rounded-full bg-skin-card border border-skin-border backdrop-blur-md shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-1 text-xs font-mono text-skin-muted border-r border-skin-border pr-3 mr-1">
                <span>HISTORY</span>
            </div>
            <div className="flex items-center gap-2">
                {history.map((event, i) => (
                    <div
                        key={`${event.code}-${event.time}`}
                        className={`
                            relative flex items-center justify-center px-2 py-1 min-w-[32px] rounded 
                            text-xs font-bold font-mono transition-all
                            ${i === 0 ? 'bg-skin-key-active text-skin-key-active-text scale-110 shadow-sm' : 'bg-skin-key-bg text-skin-key-text opacity-70'}
                            ${event.isChatter ? 'ring-2 ring-rose-500 !bg-rose-500/10 !text-rose-500' : ''}
                        `}
                    >
                        {event.code.replace('Key', '').replace('Digit', '')}

                        {event.isChatter && (
                            <div className="absolute -top-2 -right-2 text-rose-500 bg-skin-card rounded-full" title="Chatter Detected (<50ms)">
                                <WarningCircle weight="fill" size={12} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});
