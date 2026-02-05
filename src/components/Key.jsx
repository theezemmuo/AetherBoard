import React, { memo } from 'react';
import { useKeyboard } from '../context/KeyboardContext';
import * as Icons from 'phosphor-react';

const Key = memo(({ data }) => {
    const { activeKeys, testedKeys, os } = useKeyboard();

    const isActive = activeKeys.has(data.code);
    const isTested = testedKeys.has(data.code);

    // Determine label/icon based on OS overrides
    // We use data.label/icon by default.
    // We might want to handle overrides in the Frame or here.
    // Let's handle generic overrides locally if mapped.
    // Actually, the keyData has generic keys.
    // We should check if there's an OS specific label override.

    let label = data.label;
    let Icon = data.icon ? Icons[data.icon] : null;

    // Simple override logic (can be expanded)
    if (os === 'mac') {
        if (data.code === 'MetaLeft' || data.code === 'MetaRight') {
            label = 'Cmd';
            Icon = Icons.Command;
        }
        if (data.code === 'AltLeft' || data.code === 'AltRight') {
            label = 'Option';
            Icon = Icons.Option;
        }
    } else {
        if (data.code === 'MetaLeft') {
            label = 'Win';
            Icon = Icons.WindowsLogo;
        }
        if (data.code === 'MetaRight') {
            // Windows often "Menu" or nothing
            label = 'Menu';
            Icon = Icons.List;
        }
        if (data.code === 'AltLeft' || data.code === 'AltRight') {
            label = 'Alt';
            Icon = null;
        }
    }

    // Calculate span. We assume grid columns are 0.25u-based.
    // width 1u = span 4.
    const span = Math.round(data.width * 4);
    const style = {
        gridColumn: `span ${span}`,
    };

    return (
        <div
            className={`
        relative h-14 rounded-lg flex items-center justify-center select-none transition-all duration-75
        ${isActive
                    ? 'bg-skin-key-active text-skin-key-active-text shadow-inner translate-y-1 shadow-[0_0_15px_var(--color-skin-key-active)] border-transparent'
                    : 'bg-skin-key-bg text-skin-key-text border-b-4 border-skin-border shadow-md transform' // elevated state
                }
        ${isTested && !isActive ? 'border-emerald-500/50 text-emerald-500' : ''}
        ${!isActive && !isTested ? 'border-b-4 border-skin-border' : ''}
        ${isActive ? 'border-b-0' : ''} 
      `}
            style={style}
        >
            {/* Tested Glow Border (if tested and not active) */}
            {isTested && !isActive && (
                <div className="absolute inset-0 rounded-lg border border-emerald-500/30 box-border pointer-events-none" />
            )}

            <div className="flex flex-col items-center gap-1">
                {Icon ? <Icon size={20} weight={isActive ? "fill" : "regular"} /> : <span className="text-sm font-bold font-mono">{label}</span>}
            </div>
        </div>
    );
});

export default Key;
