# SpaceBalls

**An interactive 3D platform that reveals the astronomical origins of days, months, and years.**

SpaceBalls is an educational web application built with [Three.js](https://threejs.org/) that visualizes how the geometry of the Earth, Sun, and Moon creates our fundamental units of time. Users progress through guided chapters that build intuition — from basic day/night cycles to the subtle figure-8 of the analemma — by directly manipulating orbital parameters and observing the results from two complementary perspectives.

---

## Why This Exists

Most people accept that "a day is 24 hours" and "a year is 365 days" without deeply understanding *why*. The answers — Earth's rotation, axial tilt, orbital eccentricity, and the Moon's inclined orbit — are all spatial relationships that are hard to convey with static diagrams.

SpaceBalls makes these relationships tangible. You can tilt Earth's axis and immediately see how sunrise shifts along the horizon. You can flatten the Moon's orbital inclination and watch eclipses occur every single month. You can crank up orbital eccentricity and see the analemma stretch from a figure-8 into a teardrop.

## Dual-View Design

The core insight is that the same physical setup can be understood from two perspectives:

- **Space View** — A third-person orbital view. See Earth orbit the Sun, the Moon orbit Earth, shadow cones, orbital planes, and node lines. Rotate, pan, and zoom freely with orbit controls.
- **Earth View** — A first-person view from Earth's surface. Stand on the ground, look up at a celestial sphere, and see the Sun and Moon trace arcs across the sky. Watch how those arcs change with latitude, season, and time.

Every parameter change updates both views simultaneously.

---

## Features

### Six Progressive Chapters

Each chapter introduces new concepts and unlocks new interactive controls:

| Chapter | Topic | What You Learn |
|---|---|---|
| **0. Introduction** | Welcome & navigation | How to use the interface, switch views, and manipulate controls |
| **1. The Day** | Earth's rotation | Why days are ~12h light / ~12h dark, how latitude changes the sun's arc |
| **2. The Seasons** | Axial tilt (23.44°) | Solstices, equinoxes, midnight sun, polar night, the tropics |
| **3. The Month** | Lunar orbit & phases | Why "month" means "Moon," new/full/quarter phases from real lighting |
| **4. Eclipses** | Moon's 5.14° inclination | Shadow cones, node lines, why eclipses are rare |
| **5. Solar Time** | Eccentricity + tilt | Equation of Time, analemma figure-8, sundial vs. clock drift |
| **6. Playground** | Free exploration | All controls unlocked with preset configurations |

### Interactive Controls

- **Circular dials** — Time of Day, Day of Year, Latitude, Axial Tilt, Moon Position, Lunar Inclination
- **Linear sliders** — Eccentricity, Days per Year, Sun/Moon size, Plane opacity, Trail lengths
- **Toggles** — Shadow cones, node line, analemma trail, EoT graph, compass labels, reference circles
- **Animation** — Play/pause with adjustable speed (1×–1000×), day and year modes, forward/reverse

### Real Orbital Mechanics

- Kepler's equation solved via Newton-Raphson iteration
- Correct elliptical orbits with adjustable eccentricity
- Physically-based moon phases from directional lighting (no texture tricks)
- Equation of Time decomposed into eccentricity and obliquity components

---

## Getting Started

### Prerequisites

A modern browser that supports [ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and [import maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) (Chrome 89+, Firefox 108+, Safari 16.4+, Edge 89+).

### Local Development

Since this project uses ES modules loaded via import maps, you need a local HTTP server. A file:// URL will not work.

**Option A — Python (built-in on macOS/Linux):**

```bash
cd SpaceBalls
python -m http.server 8000
```

**Option B — Node.js (no install needed):**

```bash
cd SpaceBalls
npx -y http-server . -p 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

### GitHub Pages Deployment

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, select **Deploy from a branch**.
4. Set the branch to `main` and the folder to `/ (root)`.
5. Click **Save**. Your site will be live at:

```
https://YOUR-USERNAME.github.io/SpaceBalls/
```

No build step is required — GitHub Pages serves the files directly.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| 3D Engine | [Three.js](https://threejs.org/) v0.170.0 | Loaded via CDN import map from unpkg |
| Language | Vanilla JavaScript (ES modules) | No transpilation, no TypeScript |
| Styling | Vanilla CSS | Dark theme, glassmorphism, CSS custom properties |
| Markup | Semantic HTML5 | Single-page application |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | Google Fonts CDN |
| Hosting | GitHub Pages | Static file serving, zero build step |

**There is no `package.json`, no `node_modules`, no bundler, and no build step.** This is intentional. See [CONTRIBUTING.md](CONTRIBUTING.md) for the architectural rationale.

---

## Project Structure

```
SpaceBalls/
├── index.html              Single-page application shell
├── css/
│   └── style.css           Design system: dark theme, glassmorphism, controls
├── js/
│   ├── main.js             Entry point — wires scene, controls, chapters together
│   ├── scene.js            Three.js renderer, cameras, lights, view switching
│   ├── bodies.js           Sun, Earth, Moon geometry & procedural textures
│   ├── orbits.js           Orbital mechanics: Kepler solver, orbit paths, alt-az
│   ├── earth-view.js       Celestial sphere, sun/moon trails, analemma, horizon
│   ├── controls.js         Declarative slider/toggle system, progressive unlock
│   ├── chapters.js         Educational content, card navigation, scene configs
│   ├── animation.js        Play/pause, speed control, time-step logic
│   ├── shadows.js          Eclipse shadow cones and alignment detection
│   ├── analemma.js         Equation of Time computation and graph overlay
│   └── circular-slider.js  Custom SVG circular dial component
├── assets/
│   └── textures/           (Reserved for future texture assets)
├── ARCHITECTURE.md         Technical deep-dive and design decisions
├── CONTRIBUTING.md         How to contribute, coding conventions, constraints
└── LICENSE                 MIT License
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for a detailed breakdown of the module dependency graph, the orbital math, and the scene rendering pipeline.

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request. The most important constraint: **this project uses a zero-build-step architecture.** No bundlers, no UI frameworks, no `npm install`.

---

## License

[MIT](LICENSE)