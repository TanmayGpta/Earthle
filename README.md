<div align="center">

# 🌍 EARTHLE

### *Make Geography Instinctive.*

An immersive 3D spatial geography quiz built with WebGL and modern climate-tech editorial aesthetics. Guess highlighted territories on a smoothly rotating 3D globe, memorize world capitals, and build an interactive personal atlas.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

[Live Demo](https://earthle.vercel.app) • [Features](#-key-features) • [Game Modes](#-game-modes) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started)

</div>

---

## 📖 Overview

Most geography quiz games either use flat 2D map projections or rely on warmer/colder trial-and-error guesswork (like *Globle*). 

**Earthle** re-imagines geography practice around **true spatial recognition**:
1. A 3D Earth swoops and zooms directly into a country.
2. The mystery territory illuminates in **high-voltage Acid Lime**.
3. You identify the country or its official capital—either through **pure memory typing** or high-speed **multiple choice (1–4 keys)**.
4. Correct answers turn the territory **Emerald Green**, while revealed territories turn **Coral**.
5. Once answered, you can freely spin the globe and **hover over any lit-up territory** to view its national flag, capital, and continent.

---

## ⚡ Key Features

* **🌐 Precision 3D WebGL Globe:** Powered by Three.js and `globe.gl` with smooth camera swoop easing, adaptive zoom altitude (closer zoom for microstates), and atmospheric rim glow.
* **🎨 Rainmaker Editorial Aesthetic:** Styled with a deep forest spruce palette (`#1c2c26`), razor-sharp editorial typography (*Instrument Serif* & *Plus Jakarta Sans*), frosted glass HUDs, and an unclipped monumental footer watermark.
* **🗺️ Interactive Hover Atlas:** Every guessed or revealed country becomes an exploratory entity on the 3D globe. Hovering your cursor reveals its official flag, name, and capital city.
* **💡 Curated Geographical Trivia:** Occasional surprise trivia toasts featuring verified, fascinating facts for all 177 sovereign nations (e.g., Lesotho being the only nation entirely above 1,000m, Kazakhstan as the largest landlocked nation).
* **⌨️ Snappy Keyboard Navigation:** Full keyboard support—number keys `1`–`4` for MCQ options, `Enter` to submit typed answers, and `Space` to skip or advance.
* **👁️ Explanatory Reveal System:** Clicking *"What's the answer?"* displays a dedicated card with the country's flag, official name, capital, and trivia note before smoothly advancing.
* **⏱️ Sprint & Zen Modes:** 15-minute standard marathon, 5-minute blitz, or unlimited Zen mode with dynamic accuracy statistics and confetti celebration.

---

## 🎮 Game Modes

| Mode | Options | Description |
| :--- | :--- | :--- |
| **Quiz Objective** | Country Names / Capitals | Identify the country name or its official capital city. |
| **Input Mechanic** | Multiple Choice (4) / Type-In | Fast 1–4 tactile cards or pure memory recall with fuzzy alias validation. |
| **Territory Filter** | Entire World / Continents | Challenge all 177 sovereign nations or focus on Europe, Asia, Africa, Americas, or Oceania. |
| **Timer** | 15m Sprint / 5m Blitz / Unlimited | Race against the countdown or explore at your own pace. |

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **3D & Cartography:** [Three.js](https://threejs.org/) & [Globe.gl](https://globe.gl/)
* **Geo Data:** Natural Earth Vector (Self-contained local 110m GeoJSON)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Celebration:** [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
* **Deployment:** [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18.0.0 or later)
* `npm` or `pnpm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/Earthle.git
   cd Earthle
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
Earthle/
├── public/
│   └── data/
│       └── ne_110m.geojson      # Self-contained world country boundaries
├── src/
│   ├── app/
│   │   ├── globals.css          # Rainmaker theme, fonts & glassmorphism
│   │   ├── layout.tsx           # Metadata & Google Font imports
│   │   └── page.tsx             # Landing presentation + Active game engine
│   ├── components/
│   │   ├── GameHUD.tsx          # Timer, streaks, MCQ / Type input & reveal card
│   │   ├── GameOverModal.tsx    # Confetti celebration, accuracy stats & rank
│   │   ├── HeroGlobe.tsx        # Spinning half-earth with staged scroll scaling
│   │   └── InteractiveGlobe.tsx # WebGL globe with country highlights & hover cards
│   ├── data/
│   │   └── countries.ts         # 177 countries with centroids, capitals, flags & trivia
│   └── types/
│       └── game.ts              # TypeScript interfaces & game states
└── README.md
```

---

## 🚢 Deployment

The project is zero-config ready for [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and select the repository.
3. Click **Deploy**. Vercel will automatically build and assign a global HTTPS domain.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
