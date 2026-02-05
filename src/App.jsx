import React, { useState } from 'react';
import { KeyboardProvider, useKeyboard } from './context/KeyboardContext';
import { KeyboardFrame } from './components/KeyboardFrame';
import { SystemInfo } from './components/SystemInfo';
import { TestReportModal } from './components/TestReportModal';
import { ThemeSelector } from './components/ThemeSelector';
import { useHardwareEvents } from './hooks/useHardwareEvents';
import { Keyboard as KeyboardIcon, Sun, Moon, ArrowCounterClockwise, Palette, ClipboardText } from 'phosphor-react';

function KeyboardTester() {
  // Activate global listeners
  useHardwareEvents();
  const { clearTested, layout, setLayout, os, setOs, theme, setTheme } = useKeyboard();
  const [showReport, setShowReport] = useState(false);

  /* cycleTheme removed */

  return (
    <div className="min-h-screen bg-skin-fill text-skin-text flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500">

      <SystemInfo />
      {showReport && <TestReportModal onClose={() => setShowReport(false)} />}

      {/* Controls */}
      <div className="fixed top-6 right-6 flex gap-3 z-50">
        {/* Theme Selector */}
        <ThemeSelector />

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
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex items-center justify-center w-full px-8 perspective-[2000px]">
        <div className="transform rotate-x-6 scale-95 transition-transform duration-500 ease-out">
          <KeyboardFrame />
        </div>
      </div>

      <div className="fixed bottom-6 text-slate-600 text-xs font-mono">
        AetherBoard v1.0 • Press any key to test including system keys
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
