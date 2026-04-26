<h1 align="center">🪞 MirrorX</h1>

<p align="center">
  <strong>The ultimate high-fidelity smart mirror platform.</strong><br>
  <em>Glassmorphic UI &bull; RGB Sync Engine &bull; Voice Intelligence &bull; Multimedia Hub</em>
</p>

---

## ✨ Overview

**MirrorX** is a premium, full-stack smart mirror solution designed to transform any standard two-way mirror into a futuristic command center. Built with a focus on **High-Fidelity Aesthetics**, the platform combines deep glassmorphism, reactive lighting, and intelligent automation to create an immersive experience that feels like it's from the year 2030.

## 🚀 Key Features

### 💎 Prism UI (Glassmorphic Interface)
A state-of-the-art dashboard built with **React** and **TypeScript**. 
- **Dynamic Blur & Transparency**: Every element feels like it's floating behind the glass.
- **Adaptive Accent Colors**: Change the entire mood of the room with a single voice command or tap.
- **Responsive Layout**: Designed specifically for portrait-oriented mirror displays.

### 🌈 Aura Engine (RGB Sync)
A sophisticated music and ambient synchronization system.
- **Music Reactive**: Real-time audio analysis bridges your environment with your lighting.
- **Global Effects**: Presets like *Rainbow*, *Glitch*, and *Spectrum* for a versatile ambiance.
- **Hardware Agnostic**: Designed to interface with Raspberry Pi GPIO for direct LED control.

### 🎙️ Echo Assistant (Voice Intelligence)
A wake-word activated voice assistant that puts you in control without touching the glass.
- **Intent-based Commands**: Control music playback, change lighting modes, or set timers.
- **Real-time Feedback**: A premium animated HUD provides visual cues for assistant activity.
- **Wake-Word Protocol**: Built for privacy and responsiveness.

### 🎬 Chroma Player (Immersive Media)
A brand-free, high-fidelity video experience.
- **Sovereign Prism Overlay**: Custom controls that hide native YouTube branding for a seamless look.
- **Ambient Sync**: Screen-border lighting that reacts to video content (coming soon).
- **Gesture/Voice Support**: Hands-free playback control.

### 🕰️ Chronos & Ether (Utility Suite)
Essential mirror modules redesigned for a premium display.
- **Precision Chronos**: A minimalist clock and interactive calendar system.
- **Ether Weather**: Real-time localized weather forecasting with dynamic icons.
- **Scribe Notes**: A glassmorphic memo system for quick notes and reminders.

### 📰 Nexus News (Real-time Feed)
Integrated data feeds powered by the **Helakuru Esana API**.
- **Real-time Aggregation**: Get the latest news updates in a clean, category-aware feed.
- **Interactive Modals**: Promote sidebar stories to the main frame for deep reading.

### 🚶 Intuitive Presence (PIR Motion)
Automated power management using **HC-SR501 PIR sensors**.
- **Touchless Wake**: The mirror wakes up as you approach and enters sleep mode when you leave.
- **Granular Controls**: Configure timeouts and sensitivity via the integrated Settings App.

---

## 🛠️ Technical Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Framer Motion, Socket.io Client |
| **Backend** | Node.js, Express, Socket.io, Firebase/Firestore |
| **Hardware** | Raspberry Pi 4/5, WS2812B LEDs, HC-SR501 PIR Sensor |
| **Deployment** | PM2, Git Automation, ecosystem.config.js |

---

## 🚦 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **NPM** or **Yarn**
- **Firebase Project** (for persistent settings)
- **Raspberry Pi** (for hardware features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/5h3ld0rr/MirrorX.git
   cd MirrorX
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables**
   - Create `.env` files in both `Frontend/` and `Backend/` based on the provided `.env.example` templates.

4. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## 🏗️ Architecture

MirrorX uses a unified full-stack architecture managed by **PM2**:

- `/Frontend`: A modern Vite-powered React application.
- `/Backend`: An Express server acting as the bridge between hardware, Firebase, and the UI.
- `/logs`: Centralized logging for system monitoring.
- `ecosystem.config.js`: Orchestrates the simultaneous execution of both layers.

---

## 🎨 Design Philosophy

MirrorX follows the **"Sovereign Prism"** design language:
- **No Native Branding**: Every component is custom-built to ensure a brand-free, immersive experience.
- **Harmonious Palettes**: Avoids generic colors in favor of curated HSL-tailored gradients.
- **Micro-animations**: Subtle transitions for every interaction to enhance the premium feel.

---

<p align="center">
  Developed with ❤️ for the future of Smart Homes.
</p>
