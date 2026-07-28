/**
 * main.js — Entry point: wires scene, controls, chapters, animation, and 3D objects together
 */
import * as THREE from 'three';
import { scene, initScene, setAnimationCallback, switchView, getCurrentView, spaceViewGroup, earthViewGroup, spaceCamera, earthViewCamera, sunLight, spaceControls, setEarthViewYaw, setEarthViewPitch, setEarthViewPitchLimits, handleResize, earthViewYaw, earthViewPitch } from './scene.js';
import { ControlManager } from './controls.js';
import { AnimationController } from './animation.js';
import { createAllBodies, updateObserverDot, EARTH_RADIUS } from './bodies.js';
import {
    computeEarthPosition, computeMoonRelativePosition,
    createEarthOrbitLine, createMoonOrbitLine, createNodeLine,
    EARTH_ORBIT_RADIUS
} from './orbits.js';
import { createEarthView, updateEarthView, updateMultiTrails } from './earth-view.js';
import { createShadowCones, updateShadowCones } from './shadows.js';

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


// Preset buttons container
const presetContainer = document.createElement('div');
presetContainer.className = 'preset-buttons';
presetContainer.style.display = 'none';
document.getElementById('main-content').appendChild(presetContainer);

// Sidebar Toggle Logic
const sidebarToggleBtn = document.getElementById('sidebar-toggle');
if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-collapsed');
    });
}

let isFollowingEarth = false;

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

    const daysPerYear = controls.getValue('daysPerYear') ?? 365.24;

    // --- Earth position on orbit ---
    const oldEarthPos = earthOrbitGroup.position.clone();
    const earthPos = computeEarthPosition(doy, ecc, daysPerYear);
    earthOrbitGroup.position.copy(earthPos);

    if (isFollowingEarth) {
        const delta = earthPos.clone().sub(oldEarthPos);
        spaceCamera.position.add(delta);
        spaceControls.target.copy(earthPos);
    }

    // --- Earth rotation ---
    const earthMesh = bodies.earth.getObjectByName('earthMesh');
    if (earthMesh) {
        const tiltRad = tilt * Math.PI / 180;

        // The tilt direction must stay fixed relative to the stars.
        const safeDays = daysPerYear === 0 ? 365.24 : daysPerYear;
        const solsticeDay = 172 * (Math.abs(safeDays) / 365.24);
        const periOffset = 3 * (Math.abs(safeDays) / 365.24);
        const solsticeAngle = Math.atan2(
            Math.sin(((solsticeDay - periOffset) / safeDays) * Math.PI * 2),
            Math.cos(((solsticeDay - periOffset) / safeDays) * Math.PI * 2)
        );

        // Reset Earth group rotation and mount it on a rigorously fixed frame in deep space
        bodies.earth.rotation.set(0, 0, 0);
        bodies.earth.rotation.order = 'YXZ';
        bodies.earth.rotation.y = -solsticeAngle - Math.PI / 2;
        bodies.earth.rotation.x = tiltRad;
        bodies.earth.updateMatrixWorld();

        // Calculate the direction to the Sun in the Earth's tilted local frame
        const invQuat = bodies.earth.quaternion.clone().invert();
        const sunDirWorld = earthPos.clone().negate().normalize();
        const sunDirLocal = sunDirWorld.applyQuaternion(invQuat);
        const sunLocalAngle = Math.atan2(sunDirLocal.x, sunDirLocal.z);

        // Daily rotation around the tilted Y axis (applied to the mesh)
        // By using sunLocalAngle, the sidereal rotation naturally emerges 
        // and perfectly preserves tidal locking when daysPerYear = 0
        const solarRotation = ((tod - 12) / 24) * Math.PI * 2;
        earthMesh.rotation.y = sunLocalAngle + solarRotation;
    }

    // --- Observer dot ---
    updateObserverDot(bodies.earth, lat, tod);

    // --- Moon position ---
    if (moonGroup.visible) {
        const moonRelPos = computeMoonRelativePosition(moonPhase, lunarIncl, doy, ecc, daysPerYear);
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
        const daysPerYear = controls.getValue('daysPerYear') ?? 365.24;
        updateMultiTrails(earthView.multiTrails, lat, tilt, daysPerYear);
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
            isFollowingEarth = false;
            spaceCamera.position.set(0, 80, 0);
            spaceControls.target.set(0, 0, 0);
        } else if (target === 'ecliptic') {
            isFollowingEarth = false;
            spaceCamera.position.set(80, 5, 0);
            spaceControls.target.set(0, 0, 0);
        } else if (target === 'earth') {
            isFollowingEarth = true;
            const earthPos = earthOrbitGroup.position;
            spaceCamera.position.set(earthPos.x + 20, earthPos.y + 10, earthPos.z + 20);
            spaceControls.target.copy(earthPos);
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

    // Camera target
    if (cfg.cameraTarget) {
        spaceControls.target.set(cfg.cameraTarget.x, cfg.cameraTarget.y, cfg.cameraTarget.z);
    } else if (!cfg.followEarth) {
        spaceControls.target.set(0, 0, 0);
    }
    
    // Follow Earth
    if (cfg.followEarth !== undefined) {
        isFollowingEarth = cfg.followEarth;
        if (isFollowingEarth) {
            spaceControls.target.copy(earthOrbitGroup.position);
        }
    } else {
        isFollowingEarth = false;
    }
    
    // Set to Scale
    if (cfg.setToScale !== undefined) {
        toggleSetToScale(cfg.setToScale);
    } else {
        if (storedValues !== null) toggleSetToScale(false);
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

        // --- Handle UI Toggles ---
        const s = card.sceneState;
        if (s.hideControlPanel !== undefined) {
            document.getElementById('control-panel').style.display = s.hideControlPanel ? 'none' : '';
            handleResize();
        }
        if (s.collapseControlPanel !== undefined) {
            const cp = document.getElementById('control-panel');
            if (s.collapseControlPanel) cp.classList.add('collapsed');
            else cp.classList.remove('collapsed');
            handleResize();
        }
        if (s.hideViewToggle !== undefined) document.getElementById('view-toggle').style.display = s.hideViewToggle ? 'none' : '';
        if (s.hideSpacePerspectives !== undefined) document.getElementById('space-perspectives').style.display = s.hideSpacePerspectives ? 'none' : '';
        if (s.hideEarthControls !== undefined) document.getElementById('earth-view-controls').style.display = s.hideEarthControls ? 'none' : '';
        if (s.hideLegend !== undefined) document.getElementById('earth-legend').style.display = s.hideLegend ? 'none' : '';
        if (s.hideDevTools !== undefined) {
            const devEl = document.getElementById('dev-tools');
            if (devEl) devEl.style.display = s.hideDevTools ? 'none' : '';
        }
        if (s.playing !== undefined) {
            if (s.playing && !animation.playing) animation.play();
            else if (!s.playing && animation.playing) animation.pause();
        }
        if (s.speed !== undefined) animation.setSpeed(s.speed);
        if (s.animMode !== undefined) animation.setMode(s.animMode);
        if (s.earthViewAngle) {
            setEarthViewYaw(s.earthViewAngle.yaw);
            setEarthViewPitch(s.earthViewAngle.pitch);
        }
        if (s.earthZoom !== undefined) {
            earthViewCamera.fov = s.earthZoom;
            earthViewCamera.updateProjectionMatrix();
            const slider = document.getElementById('earth-zoom-slider');
            if (slider) slider.value = s.earthZoom;
        }
        if (s.cameraPos) {
            spaceCamera.position.set(s.cameraPos.x, s.cameraPos.y, s.cameraPos.z);
        }
        if (s.cameraTarget) {
            spaceControls.target.set(s.cameraTarget.x, s.cameraTarget.y, s.cameraTarget.z);
        }
        if (s.followEarth !== undefined) {
            isFollowingEarth = s.followEarth;
            if (isFollowingEarth) {
                spaceControls.target.copy(earthOrbitGroup.position);
            }
        }
        if (s.setToScale !== undefined) {
            toggleSetToScale(s.setToScale);
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

// Start at Intro (Chapter 0)
goToChapter(0);

// ================================================================
// Dev Tools
// ================================================================
let trackedConfig = null;
let trackedState = null;

function getRoundedControls() {
    const vals = {};
    for (const [k, v] of Object.entries(controls.values)) {
        if (typeof v === 'number') {
            vals[k] = Math.round(v * 1000) / 1000;
        } else {
            vals[k] = v;
        }
    }
    return vals;
}

function copyToClipboard(text) {
    const msg = 'Copied:\n\n' + text;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => alert(msg)).catch(e => alert('Failed: ' + e));
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); alert(msg); }
        catch (e) { alert('Failed'); }
        document.body.removeChild(ta);
    }
}

function captureConfig() {
    return {
        showMoon: !!moonGroup.visible,

        showNodeLine: !!nodeLine.visible,
        showShadowCones: !!shadowObjects.group.visible,
        cameraPos: {
            x: Math.round(spaceCamera.position.x * 10) / 10,
            y: Math.round(spaceCamera.position.y * 10) / 10,
            z: Math.round(spaceCamera.position.z * 10) / 10
        },
        cameraTarget: {
            x: Math.round(spaceControls.target.x * 10) / 10,
            y: Math.round(spaceControls.target.y * 10) / 10,
            z: Math.round(spaceControls.target.z * 10) / 10
        },
        followEarth: isFollowingEarth,
        setToScale: storedValues !== null,
        defaults: getRoundedControls()
    };
}

function captureState() {
    return {
        view: getCurrentView(),
        setValues: getRoundedControls(),
        hideControlPanel: document.getElementById('control-panel').style.display === 'none',
        collapseControlPanel: document.getElementById('control-panel').classList.contains('collapsed'),
        hideViewToggle: document.getElementById('view-toggle').style.display === 'none',
        hideLegend: document.getElementById('earth-legend').style.display === 'none',
        hideEarthControls: document.getElementById('earth-view-controls').style.display === 'none',
        hideSpacePerspectives: document.getElementById('space-perspectives').style.display === 'none',
        hideDevTools: document.getElementById('dev-tools').style.display === 'none',
        playing: animation.playing,
        speed: animation.speed,
        animMode: animation.mode,
        earthViewAngle: {
            yaw: Math.round(earthViewYaw * 100) / 100,
            pitch: Math.round(earthViewPitch * 100) / 100
        },
        earthZoom: Math.round(earthViewCamera.fov),
        cameraPos: {
            x: Math.round(spaceCamera.position.x * 10) / 10,
            y: Math.round(spaceCamera.position.y * 10) / 10,
            z: Math.round(spaceCamera.position.z * 10) / 10
        },
        cameraTarget: {
            x: Math.round(spaceControls.target.x * 10) / 10,
            y: Math.round(spaceControls.target.y * 10) / 10,
            z: Math.round(spaceControls.target.z * 10) / 10
        },
        followEarth: isFollowingEarth,
        setToScale: storedValues !== null
    };
}

document.getElementById('dev-track-start').addEventListener('click', () => {
    trackedConfig = captureConfig();
    trackedState = captureState();
    alert('Started tracking current config and state!');
});

document.getElementById('dev-track-stop').addEventListener('click', () => {
    trackedConfig = null;
    trackedState = null;
    alert('Tracking forgotten!');
});

document.getElementById('dev-copy-config').addEventListener('click', () => {
    const current = captureConfig();
    let out = current;

    if (trackedConfig) {
        out = {};
        for (const [k, v] of Object.entries(current)) {
            if (k === 'defaults') continue;
            if (k === 'cameraPos' || k === 'cameraTarget') {
                if (current[k].x !== trackedConfig[k].x ||
                    current[k].y !== trackedConfig[k].y ||
                    current[k].z !== trackedConfig[k].z) {
                    out[k] = current[k];
                }
            } else if (v !== trackedConfig[k]) {
                out[k] = v;
            }
        }

        // Defaults delta
        out.defaults = {};
        let hasDefaults = false;
        for (const [k, v] of Object.entries(current.defaults)) {
            if (v !== trackedConfig.defaults[k]) {
                out.defaults[k] = v;
                hasDefaults = true;
            }
        }
        if (!hasDefaults) delete out.defaults;
    }

    copyToClipboard(JSON.stringify(out, null, 2));
});

document.getElementById('dev-copy-state').addEventListener('click', () => {
    const current = captureState();
    let out = current;

    if (trackedState) {
        out = {};
        for (const [k, v] of Object.entries(current)) {
            if (k === 'setValues') continue;
            if (k === 'earthViewAngle') {
                if (current.earthViewAngle.yaw !== trackedState.earthViewAngle.yaw ||
                    current.earthViewAngle.pitch !== trackedState.earthViewAngle.pitch) {
                    out.earthViewAngle = current.earthViewAngle;
                }
            } else if (k === 'cameraPos' || k === 'cameraTarget') {
                if (current[k].x !== trackedState[k].x ||
                    current[k].y !== trackedState[k].y ||
                    current[k].z !== trackedState[k].z) {
                    out[k] = current[k];
                }
            } else if (v !== trackedState[k]) {
                out[k] = v;
            }
        }

        // setValues delta
        out.setValues = {};
        let hasSetValues = false;
        for (const [k, v] of Object.entries(current.setValues)) {
            if (v !== trackedState.setValues[k]) {
                out.setValues[k] = v;
                hasSetValues = true;
            }
        }
        if (!hasSetValues) delete out.setValues;
    }

    copyToClipboard(JSON.stringify(out, null, 2));
});

document.getElementById('dev-load-config').addEventListener('click', () => {
    try {
        const text = document.getElementById('dev-sceneconfig-in').value;
        if (!text) return;
        const cfg = new Function('return ' + text)();
        if (cfg) {
            if (cfg.showMoon !== undefined) {
                moonGroup.visible = !!cfg.showMoon;
                moonOrbitLine.visible = !!cfg.showMoon;
                earthView.moonDot.visible = !!cfg.showMoon;
            }

            if (cfg.showNodeLine !== undefined) nodeLine.visible = !!cfg.showNodeLine;
            if (cfg.showShadowCones !== undefined) shadowObjects.group.visible = !!cfg.showShadowCones;
            if (cfg.cameraPos) spaceCamera.position.set(cfg.cameraPos.x, cfg.cameraPos.y, cfg.cameraPos.z);
            if (cfg.cameraTarget) spaceControls.target.set(cfg.cameraTarget.x, cfg.cameraTarget.y, cfg.cameraTarget.z);
            if (cfg.followEarth !== undefined) isFollowingEarth = cfg.followEarth;
            if (cfg.setToScale !== undefined) toggleSetToScale(cfg.setToScale);
            if (cfg.defaults) {
                for (const [k, v] of Object.entries(cfg.defaults)) {
                    controls.setValue(k, v);
                }
            }
        }
    } catch (e) {
        alert('Error loading config: ' + e.message);
    }
});

document.getElementById('dev-load-state').addEventListener('click', () => {
    try {
        const text = document.getElementById('dev-scenestate-in').value;
        if (!text) return;
        const s = new Function('return ' + text)();
        if (s) {
            if (s.view) setViewMode(s.view);
            if (s.setValues) {
                for (const [k, v] of Object.entries(s.setValues)) {
                    controls.setValue(k, v);
                }
            }
            if (s.hideControlPanel !== undefined) document.getElementById('control-panel').style.display = s.hideControlPanel ? 'none' : '';
            if (s.collapseControlPanel !== undefined) {
                const cp = document.getElementById('control-panel');
                if (s.collapseControlPanel) cp.classList.add('collapsed');
                else cp.classList.remove('collapsed');
                handleResize();
            }
            if (s.hideViewToggle !== undefined) document.getElementById('view-toggle').style.display = s.hideViewToggle ? 'none' : '';
            if (s.hideSpacePerspectives !== undefined) document.getElementById('space-perspectives').style.display = s.hideSpacePerspectives ? 'none' : '';
            if (s.hideEarthControls !== undefined) document.getElementById('earth-view-controls').style.display = s.hideEarthControls ? 'none' : '';
            if (s.hideLegend !== undefined) document.getElementById('earth-legend').style.display = s.hideLegend ? 'none' : '';
            if (s.hideDevTools !== undefined) {
                const devEl = document.getElementById('dev-tools');
                if (devEl) devEl.style.display = s.hideDevTools ? 'none' : '';
            }
            if (s.playing !== undefined) {
                if (s.playing && !animation.playing) animation.play();
                else if (!s.playing && animation.playing) animation.pause();
            }
            if (s.speed !== undefined) animation.setSpeed(s.speed);
            if (s.animMode !== undefined) animation.setMode(s.animMode);
            if (s.earthViewAngle) {
                setEarthViewYaw(s.earthViewAngle.yaw);
                setEarthViewPitch(s.earthViewAngle.pitch);
            }
            if (s.earthZoom !== undefined) {
                earthViewCamera.fov = s.earthZoom;
                earthViewCamera.updateProjectionMatrix();
                const slider = document.getElementById('earth-zoom-slider');
                if (slider) slider.value = s.earthZoom;
            }
            if (s.cameraPos) spaceCamera.position.set(s.cameraPos.x, s.cameraPos.y, s.cameraPos.z);
            if (s.cameraTarget) spaceControls.target.set(s.cameraTarget.x, s.cameraTarget.y, s.cameraTarget.z);
            if (s.followEarth !== undefined) isFollowingEarth = s.followEarth;
            if (s.setToScale !== undefined) toggleSetToScale(s.setToScale);
        }
    } catch (e) {
        alert('Error loading state: ' + e.message);
    }
});
