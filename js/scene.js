/**
 * scene.js — Three.js scene setup, renderer, camera, lights, view switching
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Scene ---
export const scene = new THREE.Scene();

// --- Renderer ---
const canvas = document.getElementById('scene-canvas');
export const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// --- Cameras ---
export const spaceCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
spaceCamera.position.set(0, 25, 40);

export const earthViewCamera = new THREE.PerspectiveCamera(120, 1, 0.1, 200);
earthViewCamera.position.set(0, 0, 0); // Exact center for true first-person
earthViewCamera.rotation.order = 'YXZ'; // Yaw (Y) first, Pitch (X) second. Prevents horizon roll.

export let activeCamera = spaceCamera;

// --- OrbitControls for Space View ---
export const spaceControls = new OrbitControls(spaceCamera, canvas);
spaceControls.enableDamping = true;
spaceControls.dampingFactor = 0.08;
spaceControls.minDistance = 10;
spaceControls.maxDistance = 120;
spaceControls.enablePan = true;
spaceControls.target.set(0, 0, 0);
spaceControls.listenToKeyEvents(window); // Allow arrow keys to pan

// --- Keyboard Controls for Earth View ---
export let earthViewYaw = Math.PI; // Rotation around Y (left/right) - South by default
export let earthViewPitch = 0; // Rotation around X (up/down)

let minPitch = -Math.PI / 2;
let maxPitch = Math.PI / 2;

export function setEarthViewPitchLimits(min, max) {
    minPitch = min;
    maxPitch = max;
}

export function setEarthViewYaw(yaw) {
    earthViewYaw = yaw;
}

export function setEarthViewPitch(pitch) {
    earthViewPitch = pitch;
}

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

window.addEventListener('keydown', (e) => {
    if (currentView === 'earth' && keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// --- Lights ---
export const ambientLight = new THREE.AmbientLight(0x334466, 0.15);
scene.add(ambientLight);

// Sun light — positioned at the Sun (origin) by default
// No distance limit and no decay: our scene is stylized, not physically accurate
export const sunLight = new THREE.PointLight(0xfff5e0, 3.0, 0, 0);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// --- View Mode ---
let currentView = 'space';

// Groups for separating view content
export const spaceViewGroup = new THREE.Group();
spaceViewGroup.name = 'spaceViewGroup';
scene.add(spaceViewGroup);

export const earthViewGroup = new THREE.Group();
earthViewGroup.name = 'earthViewGroup';
earthViewGroup.visible = false;
scene.add(earthViewGroup);

/**
 * Switch between 'space' and 'earth' view modes.
 */
export function switchView(mode) {
    currentView = mode;
    if (mode === 'space') {
        activeCamera = spaceCamera;
        spaceControls.enabled = true;
        spaceViewGroup.visible = true;
        earthViewGroup.visible = false;
        sunLight.visible = true; // Global light for space view
        document.getElementById('space-perspectives').classList.add('visible');
        document.getElementById('earth-view-controls').classList.remove('visible');
        const legend = document.getElementById('earth-legend');
        if (legend) legend.classList.add('hidden');
    } else {
        activeCamera = earthViewCamera;
        spaceControls.enabled = false;
        spaceViewGroup.visible = false;
        earthViewGroup.visible = true;
        sunLight.visible = false; // Hide global light so Earth view uses its own lighting
        document.getElementById('space-perspectives').classList.remove('visible');
        document.getElementById('earth-view-controls').classList.add('visible');
        const legend = document.getElementById('earth-legend');
        if (legend) legend.classList.remove('hidden');
    }
    handleResize();
}

export function getCurrentView() {
    return currentView;
}

/**
 * Handle window and container resizing. Adjusts renderer size, camera
 * aspect ratios, and applies a vertical view offset to account for the
 * control panel height so the scene centers in the visible area.
 */
export function handleResize() {
    const main = document.getElementById('main-content');
    const w = main.clientWidth;
    const h = main.clientHeight;
    renderer.setSize(w, h);

    const cp = document.getElementById('control-panel');
    const cpHeight = cp && !cp.classList.contains('collapsed') && cp.style.display !== 'none' ? cp.clientHeight : 0;
    const offsetY = cpHeight / 2;
    if (cp) {
        document.documentElement.style.setProperty('--cp-actual-height', cpHeight + 'px');
    }

    function updateCam(cam) {
        cam.aspect = w / h;
        cam.setViewOffset(w, h, 0, offsetY, w, h);
        cam.updateProjectionMatrix();
    }

    updateCam(activeCamera);
    updateCam(activeCamera === spaceCamera ? earthViewCamera : spaceCamera);
}

window.addEventListener('resize', handleResize);
const mainContent = document.getElementById('main-content');
if (mainContent) {
    new ResizeObserver(() => handleResize()).observe(mainContent);
}

// --- Render Loop ---
let animationCallback = null;

export function setAnimationCallback(fn) {
    animationCallback = fn;
}

/**
 * Main render loop. Updates OrbitControls or Earth View keyboard rotation
 * each frame, fires the animation callback, and renders the scene.
 */
function renderLoop() {
    requestAnimationFrame(renderLoop);
    if (animationCallback) {
        animationCallback();
    }
    if (currentView === 'space') {
        spaceControls.update();
    } else {
        // Handle Earth View keyboard rotation
        const turnSpeed = 0.03;
        if (keys.ArrowLeft) earthViewYaw += turnSpeed;   // Positive yaw = look left
        if (keys.ArrowRight) earthViewYaw -= turnSpeed;  // Negative yaw = look right
        if (keys.ArrowUp) earthViewPitch += turnSpeed;   // Positive pitch = look DOWN (inverted)
        if (keys.ArrowDown) earthViewPitch -= turnSpeed; // Negative pitch = look UP

        // Clamp pitch to current limits
        earthViewPitch = Math.max(minPitch, Math.min(maxPitch, earthViewPitch));

        // Apply to camera
        earthViewCamera.rotation.set(earthViewPitch, earthViewYaw, 0, 'YXZ');
    }
    renderer.render(scene, activeCamera);
}

// --- Init ---
export function initScene() {
    handleResize();
    renderLoop();
}
