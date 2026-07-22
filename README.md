# TimeOrbitViewer

**Interactive 3D platform exploring the astronomical origins of days, months, and years.**

An educational web application that uses Three.js to visualize how Earth-Sun-Moon geometry creates our fundamental time units. Switch between Space View (orbital mechanics) and Earth View (standing on Earth's surface, seeing the sky dome) to build intuition about why days, months, and years exist.

## Features

- **6 Progressive Chapters**: From basic day/night to the analemma, each chapter unlocks new controls
- **Dual View Modes**: Space View (3rd person orbital) ↔ Earth View (celestial sphere with sun trails)
- **Interactive Controls**: Latitude, time of day, day of year, axial tilt, moon phase, orbital eccentricity
- **Real Orbital Mechanics**: Kepler's equation solver, correct sun positions, natural moon phase lighting
- **Eclipse Visualization**: Shadow cones show why eclipses are rare (Moon's 5.14° orbital tilt)
- **Analemma & Equation of Time**: Figure-8 solar noon drift with decomposed components
- **Playground Mode**: All controls unlocked with preset configurations

## Quick Start

### Local Development

Since this project uses ES modules, you need a local server:

```bash
# Python
    python -m http.server 8000

# Or Node.js
npx -y http-server . -p 8000
```

Then open `http://localhost:8000` in your browser.

### GitHub Pages Deployment

1. Push to a GitHub repository
2. Go to Settings → Pages → Source: "Deploy from a branch" → Branch: "main", Folder: "/"
3. Your site will be live at `https://YOUR-USERNAME.github.io/TimeOrbitViewer/`

## Tech Stack

- **Three.js** (v0.170.0) — 3D rendering via CDN import map
- **Vanilla HTML/CSS/JS** — No build step, no framework
- **ES Modules** — Native browser module loading
- **GitHub Pages** — Static hosting

## Project Structure

```
├── index.html          # Single-page application
├── css/style.css       # Design system (dark theme, glassmorphism)
├── js/
│   ├── main.js         # Entry point, wires everything together
│   ├── scene.js        # Three.js renderer, cameras, lights
│   ├── bodies.js       # Sun, Earth, Moon geometry
│   ├── orbits.js       # Orbital mechanics, Kepler solver
│   ├── earth-view.js   # Celestial sphere, sun trails, horizon
│   ├── controls.js     # Slider/toggle system
│   ├── chapters.js     # Educational content & navigation
│   ├── animation.js    # Play/pause, speed control
│   ├── shadows.js      # Eclipse shadow cones
│   └── analemma.js     # Equation of time, EoT graph
└── README.md
```

## License

MIT