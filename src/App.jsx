import React, { useState } from 'react';
import { KeyboardProvider, useKeyboard } from './context/KeyboardContext';
import { KeyboardFrame } from './components/KeyboardFrame';
import { SystemInfo } from './components/SystemInfo';
import { TestReportModal } from './components/TestReportModal';
import { ThemeSelector } from './components/ThemeSelector';
import { useHardwareEvents } from './hooks/useHardwareEvents';
import { ZenMode } from './components/ZenMode';
import { Keyboard as KeyboardIcon, Sun, Moon, ArrowCounterClockwise, Palette, ClipboardText, Sparkle } from 'phosphor-react';

/* cycleTheme removed */

function KeyboardTester() {
  // Activate global listeners
  // useHardwareEvents(); // Replaed by conditional call below

  const { clearTested, layout, setLayout, os, setOs, theme, setTheme } = useKeyboard();
  const [showReport, setShowReport] = useState(false);

  const [gameMode, setGameMode] = useState(null); // null or 'zen'

  // Activate global listeners (Only when NO game mode is active)
  useHardwareEvents({ enabled: !gameMode });

  return (
    <div className="min-h-screen bg-skin-fill text-skin-text flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500">

      <SystemInfo />
      {showReport && <TestReportModal onClose={() => setShowReport(false)} />}

      {/* Controls */}
      <div className="fixed top-6 right-6 flex gap-3 z-50">
        {/* Toggle Game Mode */}
        <button
          onClick={() => {
            if (gameMode) {
              setGameMode(null);
            } else {
              setGameMode('zen');
            }
          }}
          className={`p-3 rounded-full border backdrop-blur-md transition-all shadow-sm flex items-center gap-2 ${gameMode === 'zen'
            ? 'bg-skin-key-active text-skin-key-active-text border-skin-key-active'
            : 'bg-skin-card border-skin-border text-skin-text hover:opacity-80'}`}
          title={gameMode ? "Exit Zen Mode" : "Enter Zen Mode"}
        >
          <Sparkle size={20} weight={gameMode === 'zen' ? 'fill' : 'regular'} />
          {gameMode === 'zen' && <span className="text-xs font-bold pr-1">ZEN</span>}
        </button>

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Standard Controls (Hidden in Zen Mode) */}
        {!gameMode && (
          <>
            {/* OS Toggle */}
            <button
              onClick={() => setOs(os === 'mac' ? 'win' : 'mac')}
              className="p-3 bg-skin-card hover:opacity-80 rounded-full border border-skin-border backdrop-blur-md transition-colors shadow-sm text-skin-text"
              title={`Switch to ${os === 'mac' ? 'Windows' : 'Mac'} Layout`}
            >
              {os === 'mac' ? 'MAC' : 'WIN'}
            </button>

            {/* Report Button */}
            <button
              onClick={() => setShowReport(true)}
              className="p-3 bg-skin-card hover:opacity-80 rounded-full border border-skin-border backdrop-blur-md transition-colors shadow-sm text-skin-text"
              title="Generate Test Report"
            >
              <ClipboardText size={20} />
            </button>

            {/* Reset */}
            <button
              onClick={clearTested}
              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full border border-rose-500/30 backdrop-blur-md transition-colors shadow-sm"
              title="Reset Progress"
            >
              <ArrowCounterClockwise size={20} />
            </button>
          </>
        )}
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex items-center justify-center w-full px-8 perspective-[2000px]">
        {gameMode === 'zen' ? (
          <div className="animate-in fade-in zoom-in duration-500 w-full">
            <ZenMode onExit={() => setGameMode(null)} />
          </div>
        ) : (
          <div className="transform rotate-x-6 scale-95 transition-transform duration-500 ease-out animate-in fade-in">
            <KeyboardFrame />
          </div>
        )}
      </div>

      <div className={`fixed bottom-6 text-slate-600 text-xs font-mono transition-opacity ${gameMode ? 'opacity-0' : 'opacity-100'}`}>
        Aetherboard v1.0 • Press any key to test including system keys
      </div>
    </div>
  );
}

function App() {
  return (
    <KeyboardProvider>
      <KeyboardTester />
    </KeyboardProvider>
  );
}

export default App;
