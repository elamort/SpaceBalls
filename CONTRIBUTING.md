# Contributing to SpaceBalls

Thank you for your interest in contributing! This document explains how to submit changes and the strict architectural constraints that keep this project simple and dependency-free.

---

## Architectural Constraints

> **These are non-negotiable. Pull requests that violate these constraints will be closed.**

### No Build Tools

Do not introduce any of the following:

- **Bundlers:** Webpack, Vite, Parcel, esbuild, Rollup, Turbopack
- **Transpilers:** Babel, TypeScript compiler, SWC
- **Task runners:** Gulp, Grunt
- **CSS preprocessors:** Sass, Less, PostCSS, Tailwind

The project must work by opening `index.html` through any HTTP server. No compilation, no transpilation, no build step.

### No Package Managers

Do not add:

- `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `node_modules/`
- Any `npm install`, `yarn add`, or equivalent

### No UI Frameworks

Do not introduce:

- React, Vue, Svelte, Angular, Solid, Lit, or any component framework
- jQuery or any DOM abstraction library

All DOM manipulation must use the native browser API (`document.createElement`, `addEventListener`, `querySelector`, etc.).

### Dependencies via CDN Only

The only external dependency is **Three.js**, loaded via an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) in `index.html`:

```html
<script type="importmap">
{
    "imports": {
        "three": "https://unpkg.com/three@0.170.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.170.0/examples/jsm/"
    }
}
</script>
```

If you need a new dependency, it **must** be added to the import map as a CDN URL. Discuss this in an issue first.

### All JavaScript Must Be ES Modules

Every `.js` file must use `import`/`export` syntax. No CommonJS (`require`), no global scripts, no inline `<script>` blocks (except the import map and the error overlay in `index.html`).

---

## Pull Request Workflow

### 1. Fork and Branch

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR-USERNAME/SpaceBalls.git
cd SpaceBalls
git checkout -b feature/your-feature-name
```

Branch naming conventions:

| Prefix | Use |
|---|---|
| `feature/` | New functionality or content |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code cleanup with no behavior change |

### 2. Develop Locally

Start a local server:

```bash
python -m http.server 8000
# or
npx -y http-server . -p 8000
```

Open [http://localhost:8000](http://localhost:8000) and verify your changes work in both Space View and Earth View.

### 3. Test Manually

There is no automated test suite. Before submitting:

- [ ] Navigate through all 7 chapters — cards load, controls appear, scene updates.
- [ ] Toggle between Space View and Earth View — no console errors.
- [ ] Verify the animation system works — play/pause, both speed modes, direction toggle.
- [ ] If you modified orbital math: compare behavior at eccentricity 0 and 0.0167.
- [ ] If you modified controls: verify the control renders, responds to input, and persists across chapter changes.
- [ ] Check the browser console for errors.

### 4. Submit a Pull Request

- Write a clear title and description.
- Explain *what* changed and *why*.
- If you modified math or rendering, include a brief explanation of the approach.
- Reference any related issues.

### 5. Review

Expect feedback on:
- Architectural compliance (see constraints above).
- Code style (see conventions below).
- Correctness of astronomical calculations.
- Impact on other chapters or views.

---

## Coding Conventions

### Formatting

| Rule | Standard |
|---|---|
| Indentation | 4 spaces (no tabs) |
| Semicolons | Required at end of statements |
| Quotes | Single quotes for strings |
| Trailing commas | Use in multi-line objects and arrays |
| Line length | No hard limit, but prefer ≤120 characters |
| Blank lines | One blank line between functions, two between major sections |

### Naming

| Element | Convention | Example |
|---|---|---|
| JS variables and functions | camelCase | `computeEarthPosition`, `dayOfYear` |
| JS classes | PascalCase | `ControlManager`, `AnimationController` |
| JS constants | UPPER_SNAKE_CASE | `EARTH_ORBIT_RADIUS`, `TWO_PI` |
| CSS classes | kebab-case | `control-panel`, `overlay-card` |
| DOM IDs | kebab-case | `scene-canvas`, `btn-play-pause` |
| File names | kebab-case | `earth-view.js`, `circular-slider.js` |

### Documentation

- **All exported functions** must have JSDoc with `@param` and `@returns` tags.
- **File headers:** Each `.js` file must start with a `/** file.js — Brief description */` comment.
- **Math-heavy code** (in `orbits.js`, `earth-view.js`, `analemma.js`): preserve and extend inline comments explaining the astronomical formulas. A contributor should be able to understand the math without consulting external references.
- **Do not** add comments that merely restate the code (`// increment i` on `i++`).

### Module Structure

- `main.js` is the wiring layer. It imports from all other modules and connects them.
- Other modules should not import from `main.js`.
- Keep modules focused: if a function doesn't logically belong in an existing module, discuss creating a new one in an issue first.
- Prefer pure functions for math/computation. Side effects (DOM manipulation, Three.js mutations) should be concentrated in `main.js` and `controls.js`.

---

## File Organization

### Adding a New Control

1. Add a definition to the `CONTROL_DEFS` array in `controls.js`:

```javascript
{ id: 'myParam', label: 'My Parameter', type: 'slider', min: 0, max: 100, step: 1, defaultVal: 50, unit: '', chapter: 3 },
```

2. Read the value in `main.js → updateScene()`:

```javascript
const myParam = controls.getValue('myParam');
```

3. Use the value to update the 3D scene.

### Adding a New Chapter

1. Add a chapter object to the `CHAPTERS` array in `chapters.js`.
2. Define `sceneConfig` (chapter defaults) and `cards[]` (educational content with `sceneState` per card).
3. Add any new controls with the chapter's ID number.

### Adding a New Module

1. Create a new `.js` file in `js/`.
2. Use ES module `export` for all public functions.
3. Import it in `main.js`.
4. Document the module in `ARCHITECTURE.md`.

---

## Reporting Issues

When filing a bug report, please include:

- Browser and version
- Steps to reproduce
- Which chapter/card you were on
- Whether the issue is in Space View, Earth View, or both
- Console error output (if any)

---

## Code of Conduct

Be respectful and constructive. This is an educational project — questions about the astronomy or the code are always welcome.
