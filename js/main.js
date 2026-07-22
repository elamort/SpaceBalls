/**
 * main.js — Entry point: wires scene, controls, chapters, animation, and 3D objects together
 */
import * as THREE from 'three';
import { scene, initScene, setAnimationCallback, switchView, getCurrentView, spaceViewGroup, earthViewGroup, spaceCamera, earthViewCamera, sunLight, spaceControls, setEarthViewYaw, setEarthViewPitchLimits, handleResize } from './scene.js';
import { ControlManager } from './controls.js';
import { AnimationController } from './animation.js';
import { createAllBodies, updateObserverDot, EARTH_RADIUS } from './bodies.js';
import {
    computeEarthPosition, computeMoonRelativePosition,
    createEarthOrbitLine, createMoonOrbitLine, createEclipticPlane, createNodeLine,
    EARTH_ORBIT_RADIUS
} from './orbits.js';
import { createEarthView, updateEarthView, updateMultiTrails } from './earth-view.js';
import { createShadowCones, updateShadowCones } from './shadows.js';
import { renderEoTGraph } from './analemma.js';
import {
    CHAPTERS, buildSidebar, buildPresets, goToChapter,
    onCardChange, onChapterChange
} from './chapters.js';

// ================================================================
// Initialize systems
// ================================================================
const controls = new ControlManager();
const animation = new AnimationController(controls);

// ================================================================
// Create 3D objects
// ================================================================
const bodies = createAllBodies();

// Sun at origin
spaceViewGroup.add(bodies.sun);

// Earth group (orbits around Sun)
const earthOrbitGroup = new THREE.Group();
earthOrbitGroup.name = 'earthOrbitGroup';
spaceViewGroup.add(earthOrbitGroup);
earthOrbitGroup.add(bodies.earth);

// Moon group (orbits around Earth, inside earthOrbitGroup)
const moonGroup = new THREE.Group();
moonGroup.name = 'moonGroup';
moonGroup.visible = false; // Hidden until chapter 3
earthOrbitGroup.add(moonGroup);
moonGroup.add(bodies.moon);

// Starfield
scene.add(bodies.starfield);

// Orbit lines
let earthOrbitLine = createEarthOrbitLine(0);
earthOrbitLine.name = 'earthOrbitLine';
spaceViewGroup.add(earthOrbitLine);

let moonOrbitLine = createMoonOrbitLine(0);
moonOrbitLine.name = 'moonOrbitLine';
moonOrbitLine.visible = false;
earthOrbitGroup.add(moonOrbitLine);

// Ecliptic plane
const eclipticPlane = createEclipticPlane();
eclipticPlane.name = 'eclipticPlane';
eclipticPlane.visible = false;
spaceViewGroup.add(eclipticPlane);

// Node line (inside earthOrbitGroup so it moves with Earth)
let nodeLine = createNodeLine(5.14);
nodeLine.name = 'nodeLine';
earthOrbitGroup.add(nodeLine);

// Shadow cones (in spaceViewGroup, NOT earthOrbitGroup — positions are in world coords)
const shadowObjects = createShadowCones();
shadowObjects.group.visible = false;
spaceViewGroup.add(shadowObjects.group);

// Earth View
const earthView = createEarthView();
earthViewGroup.add(earthView.group);

// EoT Graph overlay (create the DOM element)
const eotOverlay = document.createElement('div');
eotOverlay.className = 'eot-graph-overlay';
eotOverlay.innerHTML = `<div class="eot-graph-title">Equation of Time</div><canvas id="eot-canvas" width="296" height="146"></canvas>`;
document.getElementById('main-content').appendChild(eotOverlay);

// Preset buttons container
const presetContainer = document.createElement('div');
presetContainer.className = 'preset-buttons';
presetContainer.style.display = 'none';
document.getElementById('main-content').appendChild(presetContainer);

// ================================================================
// Scene update function — called every frame
// ================================================================
function updateScene() {
    const tod = controls.getValue('timeOfDay');
    const doy = controls.getValue('dayOfYear') ?? 172;
    const tilt = controls.getValue('axialTilt') ?? 0;
    const lat = controls.getValue('latitude');
    const ecc = controls.getValue('eccentricity') ?? 0;
    const moonPhase = controls.getValue('moonPosition') ?? 0;
    const lunarIncl = controls.getValue('lunarInclination') ?? 0;
    const showShadows = controls.getValue('shadowCones');
    const showNodes = controls.getValue('nodeLine');
    const showEoT = controls.getValue('eotGraph');

    // --- Earth position on orbit ---
    const earthPos = computeEarthPosition(doy, ecc);
    earthOrbitGroup.position.copy(earthPos);

    // --- Earth rotation ---
    const earthMesh = bodies.earth.getObjectByName('earthMesh');
    if (earthMesh) {
        const tiltRad = tilt * Math.PI / 180;

        // The tilt direction must stay fixed relative to the stars.
        // Earth's group is inside earthOrbitGroup which has position but NO rotation,
        // so the group's local axes are aligned with world axes.
        // We need the tilt to always point in the same absolute direction.
        // At summer solstice (day ~172), North pole tilts toward Sun.
        // Earth at day 172 is at orbital angle ~(172-3)/365.25 * 2PI ≈ 2.9 rad
        // We want the tilt toward the Sun at that moment, so the tilt direction
        // angle = orbital angle at solstice.
        // The tilt rotates around the x-axis (perpendicular to the Sun-Earth line at solstice).

        // Earth's orbital angle at current position
        const orbitalAngle = Math.atan2(earthPos.z, earthPos.x);
        // Orbital angle at summer solstice (day 172)
        const solsticeAngle = Math.atan2(
            Math.sin(((172 - 3) / 365.25) * Math.PI * 2),
            Math.cos(((172 - 3) / 365.25) * Math.PI * 2)
        );

        // Reset Earth group rotation
        bodies.earth.rotation.set(0, 0, 0);

        // The tilt direction stays fixed: it always points toward the solstice direction.
        // In the ecliptic plane (xz), the tilt axis is perpendicular to the solstice direction.
        // Tilt the Earth toward the solstice direction.
        // rotation.z = tilt (tilts N pole toward +x when z-axis)
        // But we need to rotate this tilt direction to match the fixed solstice direction.

        // Apply tilt: first rotate to align the "tilt toward" direction, then tilt
        bodies.earth.rotation.order = 'YZX';
        bodies.earth.rotation.y = 0;
        bodies.earth.rotation.z = tiltRad;
        // Counter-rotate so tilt always points toward the fixed solstice direction
        // (The tilt is fixed in space, so as Earth moves in orbit, the group must adjust)
        bodies.earth.rotation.y = -orbitalAngle + solsticeAngle;

        // Daily rotation around the tilted Y axis (applied to the mesh, not the group)
        earthMesh.rotation.y = (tod / 24) * Math.PI * 2;
    }

    // --- Observer dot ---
    updateObserverDot(bodies.earth, lat, tod);

    // --- Moon position ---
    if (moonGroup.visible) {
        const moonRelPos = computeMoonRelativePosition(moonPhase, lunarIncl, doy, ecc);
        bodies.moon.position.copy(moonRelPos);
    }

    // --- Scale Objects ---
    const sunSize = controls.getValue('sunSize') || 1.0;
    bodies.sun.scale.setScalar(sunSize);
    
    const moonSize = controls.getValue('moonSize') || 1.0;
    bodies.moon.scale.setScalar(moonSize);

    // --- Sun light follows Sun (at origin) ---
    sunLight.position.set(0, 0, 0);

    // --- Shadow cones ---
    if (shadowObjects.group.visible) {
        const moonWorldPos = new THREE.Vector3();
        bodies.moon.getWorldPosition(moonWorldPos);
        updateShadowCones(shadowObjects, earthPos, moonWorldPos);
    }
    shadowObjects.group.visible = !!showShadows;

    // --- Node line ---
    nodeLine.visible = !!showNodes;

    // --- Earth View ---
    if (getCurrentView() === 'earth') {
        updateEarthView(earthView, controls);
    }

    // --- EoT Graph ---
    if (showEoT) {
        eotOverlay.classList.add('visible');
        const eotCanvas = document.getElementById('eot-canvas');
        if (eotCanvas) {
            renderEoTGraph(eotCanvas, doy, ecc, tilt);
        }
    } else {
        eotOverlay.classList.remove('visible');
    }

    // --- Animation tick ---
    animation.tick(performance.now());
}

// ================================================================
// Control change handlers
// ================================================================
controls.onAnyChange((value, id) => {
    // Rebuild orbit line if eccentricity changes
    if (id === 'eccentricity') {
        rebuildEarthOrbitLine(value);
    }
    // Rebuild moon orbit line if lunar inclination changes
    if (id === 'lunarInclination') {
        rebuildMoonOrbitLine(value);
    }
});

function rebuildEarthOrbitLine(ecc) {
    spaceViewGroup.remove(earthOrbitLine);
    if (earthOrbitLine.geometry) earthOrbitLine.geometry.dispose();
    if (earthOrbitLine.material) earthOrbitLine.material.dispose();
    earthOrbitLine = createEarthOrbitLine(ecc);
    earthOrbitLine.name = 'earthOrbitLine';
    spaceViewGroup.add(earthOrbitLine);
}

function rebuildMoonOrbitLine(incl) {
    earthOrbitGroup.remove(moonOrbitLine);
    if (moonOrbitLine.geometry) moonOrbitLine.geometry.dispose();
    if (moonOrbitLine.material) moonOrbitLine.material.dispose();
    moonOrbitLine = createMoonOrbitLine(incl);
    moonOrbitLine.name = 'moonOrbitLine';
    moonOrbitLine.visible = moonGroup.visible;
    earthOrbitGroup.add(moonOrbitLine);
}

// ================================================================
// View toggle
// ================================================================
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.view;
        setViewMode(mode);
    });
});

function setViewMode(mode) {
    switchView(mode);
    document.querySelectorAll('.view-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === mode);
    });
    
    // Update control visibility
    controls.updateVisibilityForView(mode);

    // Update multi-trails when switching to Earth View
    if (mode === 'earth') {
        const lat = controls.getValue('latitude');
        const tilt = controls.getValue('axialTilt') ?? 0;
        updateMultiTrails(earthView.multiTrails, lat, tilt);
        earthView.multiTrails.visible = true;
    }
}

// ================================================================
// Control panel collapse
// ================================================================
document.getElementById('panel-collapse').addEventListener('click', () => {
    document.querySelector('.control-panel').classList.toggle('collapsed');
    handleResize(); // Adjust camera offset
});

// ================================================================
// UI Overlay Controls
// ================================================================

document.getElementById('toggle-earth-controls').addEventListener('click', (e) => {
    const body = document.getElementById('earth-controls-body');
    const isCollapsed = body.classList.toggle('collapsed');
    e.target.textContent = isCollapsed ? '▲' : '▼';
});

document.getElementById('toggle-earth-legend').addEventListener('click', (e) => {
    const body = document.getElementById('earth-legend-body');
    const isCollapsed = body.classList.toggle('collapsed');
    e.target.textContent = isCollapsed ? '▲' : '▼';
});

// Space View Perspectives
document.querySelectorAll('.perspective-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (target === 'top') {
            spaceCamera.position.set(0, 80, 0);
            spaceControls.target.set(0, 0, 0);
        } else if (target === 'ecliptic') {
            spaceCamera.position.set(80, 5, 0);
            spaceControls.target.set(0, 0, 0);
        } else if (target === 'moon') {
            const moonWorldPos = new THREE.Vector3();
            bodies.moon.getWorldPosition(moonWorldPos);
            spaceCamera.position.set(moonWorldPos.x + 10, moonWorldPos.y + 10, moonWorldPos.z + 10);
            spaceControls.target.copy(moonWorldPos);
        }
    });
});

// Earth View Controls
document.querySelectorAll('.earth-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        let azimuth = 0;
        // In our manual rotation, yaw=0 looks at -Z (North)
        if (target === 'north') azimuth = 0;
        else if (target === 'south') azimuth = Math.PI;
        else if (target === 'sunrise') azimuth = -Math.PI / 2; // East is +X, so yaw must be -PI/2 to look East
        else if (target === 'sunset') azimuth = Math.PI / 2;   // West is -X, so yaw must be PI/2 to look West
        
        setEarthViewYaw(azimuth);
    });
});

document.getElementById('earth-zoom-slider').addEventListener('input', (e) => {
    const fov = parseInt(e.target.value);
    earthViewCamera.fov = fov;
    earthViewCamera.updateProjectionMatrix();
});

// ================================================================
// Chapter system
// ================================================================
export { controls };

let storedValues = null;

export function toggleSetToScale(enable) {
    if (enable) {
        storedValues = {
            eccentricity: controls.getValue('eccentricity'),
            lunarInclination: controls.getValue('lunarInclination'),
            axialTilt: controls.getValue('axialTilt')
        };
        // Set values closer to reality (with some limits so it's still visible)
        controls.setValue('eccentricity', 0.0167);
        controls.setValue('lunarInclination', 5.14);
        controls.setValue('axialTilt', 23.44);
    } else if (storedValues) {
        for (const [key, val] of Object.entries(storedValues)) {
            controls.setValue(key, val);
        }
        storedValues = null;
    }
}

window.addEventListener('setToScale', (e) => toggleSetToScale(e.detail));

onChapterChange((chapter) => {
    // Render controls for this chapter
    controls.renderForChapter(chapter.id);
    controls.updateVisibilityForView(getCurrentView());

    // Apply chapter scene config
    const cfg = chapter.sceneConfig;

    // Show/hide Moon
    moonGroup.visible = !!cfg.showMoon;
    moonOrbitLine.visible = !!cfg.showMoon;
    earthView.moonDot.visible = !!cfg.showMoon;

    // Show/hide ecliptic
    eclipticPlane.visible = !!cfg.showEclipticPlane;

    // Show/hide shadow cones
    shadowObjects.group.visible = !!cfg.showShadowCones;

    // Node line
    nodeLine.visible = !!cfg.showNodeLine;

    // Apply default values
    if (cfg.defaults) {
        for (const [key, val] of Object.entries(cfg.defaults)) {
            controls.setValue(key, val);
        }
    }

    // Camera position
    if (cfg.cameraPos) {
        spaceCamera.position.set(cfg.cameraPos.x, cfg.cameraPos.y, cfg.cameraPos.z);
    }

    // Presets (only for Playground)
    if (chapter.id === 6) {
        // presetContainer.style.display = 'flex';
        // buildPresets(presetContainer, controls, setViewMode);
        presetContainer.style.display = 'none';
    } else {
        presetContainer.style.display = 'none';
    }
});

onCardChange((chapter, cardIndex, card) => {
    // Apply card-specific scene state
    if (card.sceneState) {
        if (card.sceneState.view) {
            setViewMode(card.sceneState.view);
        }
        if (card.sceneState.setValues) {
            for (const [key, val] of Object.entries(card.sceneState.setValues)) {
                controls.setValue(key, val);
            }
        }
    }
});

// ================================================================
// Initialize
// ================================================================
buildSidebar();
controls.renderForChapter(0);
setAnimationCallback(updateScene);
initScene();

// Start at Playground (Chapter 6)
goToChapter(6);
