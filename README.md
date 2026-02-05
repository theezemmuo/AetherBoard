# AetherBoard ⌨️✨

**The Premium Aesthetic Keyboard Tester**

AetherBoard is a next-generation keyboard testing application designed for enthusiasts. It moves beyond simple utility to provide a satisfying, immersive testing experience with procedural audio feedback and a high-fidelity visual design.

![AetherBoard Header](https://via.placeholder.com/1200x600/1e293b/38bdf8?text=AetherBoard+Interface) 
*(Add your actual screenshot here)*

## Features

### 🔊 Procedural Audio Engine
Every key press is synthesized in real-time using the Web Audio API.
-   **Unique Signature**: Each key has a deterministic, unique pitch offset.
-   **Profiles**: Switch between "Clicky" (High-pitched, crisp) and "Linear" (Deep, thocky) sound profiles.

### 🎨 Visual Excellence
-   **Themes**: 7+ professionally curated themes including Neon, Retro, Glass, Ocean, and Sunset.
-   **Glassmorphism**: Built with modern CSS transparency and blur filters.
-   **Typography**: Features the custom "Geom" typeface for a futuristic aesthetic.

### 📊 Smart Reporting
-   **History Timeline**: Tracks your testing sessions locally.
-   **PDF Certification**: Generate professional PDF reports of your keyboard tests to document new builds or sell trades.
-   **Detailed Analysis**: See exact pass rates and lists of missing/dead keys.

## Tech Stack
-   **Framework**: React 18 + Vite
-   **Styling**: Tailwind CSS + Phosphor Icons
-   **Audio**: Web Audio API (No samples, pure synthesis)
-   **Export**: html2canvas + jsPDF

## Local Development

### Prerequisites
-   Node.js 18+
-   npm or pnpm

### Setup
```bash
# 1. Clone the repository
git clone https://github.com/theezemmuo/AetherBoard.git
cd AetherBoard

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

### Building for Production
```bash
npm run build
```

## Privacy
AetherBoard runs entirely client-side. No keystroke data is ever sent to a server.

---

*Created for keyboard enthusiasts who demand better tools.*
