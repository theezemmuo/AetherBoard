import React from 'react';
import { useKeyboard } from '../context/KeyboardContext';
import { KEY_LAYOUTS } from '../data/keyData';
import Key from './Key';

export function KeyboardFrame() {
    const { layout } = useKeyboard();

    // Floating animation class
    const floatClass = "animate-float"; // We need to define this in tailwind config or css

    return (
        <div className={`relative p-8 bg-skin-card rounded-3xl border border-skin-border backdrop-blur-xl shadow-2xl ${floatClass}`}>
            {/* 
         Grid Setup:
         We use 0.25u columns.
         Standard layout is ~15-22u wide.
         Let's just use flexible grid with repeat(auto-fill) or strict column count?
         Strict is better for alignment.
         Max width for full keyboard ~22.5u = 90 cols.
         75% is smaller.
      */}
            <div
                className="grid gap-2"
                style={{
                    gridTemplateColumns: 'repeat(64, minmax(0, 1fr))', // 16u width * 4 = 64 cols
                    width: 'fit-content'
                }}
            >
                {/* Render Rows */}
                {Object.entries(KEY_LAYOUTS).map(([rowName, keys]) => (
                    <React.Fragment key={rowName}>
                        {/* We might need a "row wrapper" or just flatten keys if we manage row breaks via grid.
                 But CSS grid with auto-flow row is easiest if we define explicit rows. 
                 However, to keep strict 0.25u alignment across rows, a single grid container is best.
                 We need to make sure each "row" in data takes up a full row in grid.
                 We can wrap each row in a subgrid or just a div with col-span-full?
                 Actually, standard keyboards are misaligned columns.
                 So a single parent grid with many columns is the way.
                 We need to force line breaks.
             */}
                        <div className="col-span-full grid gap-2"
                            style={{ gridTemplateColumns: 'repeat(64, minmax(0, 1fr))' }}>
                            {keys.map((key) => {
                                // Logic to hide Numpad/Nav keys if Compact layout
                                if (layout === 'compact' && (key.type === 'numpad')) return null;
                                return <Key key={key.code} data={key} />;
                            })}
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
