import React from 'react';
import { KeyboardProvider } from './context/KeyboardContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ZenMode } from './components/ZenMode';
import { useNavigate } from 'react-router-dom';

// Wrapper for ZenMode to handle navigation prop
function ZenPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-skin-fill text-skin-text flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 animate-in fade-in zoom-in duration-500">
      <ZenMode onExit={() => navigate('/')} />
    </div>
  );
}

function App() {
  return (
    <KeyboardProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/zen" element={<ZenPage />} />
        </Routes>
      </BrowserRouter>
    </KeyboardProvider>
  );
}

export default App;
