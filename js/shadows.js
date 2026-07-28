/**
 * shadows.js — Eclipse shadow cone rendering and detection
 */
import * as THREE from 'three';
import { EARTH_ORBIT_RADIUS, MOON_ORBIT_RADIUS } from './orbits.js';
import { SUN_RADIUS, EARTH_RADIUS, MOON_RADIUS } from './bodies.js';

/**
 * Create shadow cone objects for eclipse visualization.
 */
export function createShadowCones() {
    const group = new THREE.Group();
    group.name = 'shadowCones';
    group.visible = false;

    // --- Moon's shadow cone (solar eclipse) ---
    // Cone from Moon toward Earth (actually extends from Moon away from Sun)
    const moonConeLen = MOON_ORBIT_RADIUS * 1.2;
    const moonConeRadius = MOON_RADIUS * 1.5;
    const moonConeGeom = new THREE.ConeGeometry(moonConeRadius, moonConeLen, 32, 1, true);
    const moonConeMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const moonCone = new THREE.Mesh(moonConeGeom, moonConeMat);
    moonCone.name = 'moonShadowCone';
    group.add(moonCone);

    // --- Earth's shadow cone (lunar eclipse) ---
    // Umbra cone from Earth away from Sun
    const earthConeLen = MOON_ORBIT_RADIUS * 2.5;
    const earthConeRadius = EARTH_RADIUS * 2;
    const earthConeGeom = new THREE.ConeGeometry(earthConeRadius, earthConeLen, 32, 1, true);
    const earthConeMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const earthCone = new THREE.Mesh(earthConeGeom, earthConeMat);
    earthCone.name = 'earthShadowCone';
    group.add(earthCone);

    // Penumbra cone (wider, fainter)
    const penumbraGeom = new THREE.ConeGeometry(earthConeRadius * 2, earthConeLen * 1.1, 32, 1, true);
    const penumbraMat = new THREE.MeshBasicMaterial({
        color: 0x110011,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const penumbraCone = new THREE.Mesh(penumbraGeom, penumbraMat);
    penumbraCone.name = 'penumbraCone';
    group.add(penumbraCone);

    // Eclipse indicator (text sprite)
    const eclipseIndicator = createEclipseLabel();
    eclipseIndicator.name = 'eclipseIndicator';
    eclipseIndicator.visible = false;
    group.add(eclipseIndicator);

    return {
        group,
        moonCone,
        earthCone,
        penumbraCone,
        eclipseIndicator,
    };
}

/**
 * Update shadow cone positions and orientations.
 * @param {object} shadowObjects - from createShadowCones()
 * @param {THREE.Vector3} earthPos - Earth's world position
 * @param {THREE.Vector3} moonWorldPos - Moon's world position
 */
export function updateShadowCones(shadowObjects, earthPos, moonWorldPos) {
    const sunPos = new THREE.Vector3(0, 0, 0); // Sun at origin

    // --- Moon's shadow cone ---
    // Points from Moon away from Sun (toward Earth side)
    const moonToSun = new THREE.Vector3().subVectors(sunPos, moonWorldPos).normalize();
    const moonConeCenter = new THREE.Vector3().addVectors(
        moonWorldPos,
        moonToSun.clone().multiplyScalar(-MOON_ORBIT_RADIUS * 0.6)
    );
    shadowObjects.moonCone.position.copy(moonConeCenter);
    shadowObjects.moonCone.lookAt(sunPos);
    shadowObjects.moonCone.rotateX(Math.PI / 2);

    // --- Earth's shadow cone ---
    // Points from Earth away from Sun
    const earthToSun = new THREE.Vector3().subVectors(sunPos, earthPos).normalize();
    const earthConeCenter = new THREE.Vector3().addVectors(
        earthPos,
        earthToSun.clone().multiplyScalar(-MOON_ORBIT_RADIUS * 1.25)
    );
    shadowObjects.earthCone.position.copy(earthConeCenter);
    shadowObjects.earthCone.lookAt(sunPos);
    shadowObjects.earthCone.rotateX(Math.PI / 2);

    shadowObjects.penumbraCone.position.copy(earthConeCenter);
    shadowObjects.penumbraCone.lookAt(sunPos);
    shadowObjects.penumbraCone.rotateX(Math.PI / 2);

    // --- Eclipse detection ---
    detectEclipses(shadowObjects, earthPos, moonWorldPos, sunPos);
}

/**
 * Detect whether a solar or lunar eclipse is occurring by checking
 * Sun-Earth-Moon alignment (dot product) and the Moon's perpendicular
 * distance from the Earth-Sun line.
 * @param {object} shadowObjects  From createShadowCones()
 * @param {THREE.Vector3} earthPos  Earth's world position
 * @param {THREE.Vector3} moonWorldPos  Moon's world position
 * @param {THREE.Vector3} sunPos  Sun's world position (origin)
 */
function detectEclipses(shadowObjects, earthPos, moonWorldPos, sunPos) {
    // Simplified eclipse detection: check alignment
    const earthSunDir = new THREE.Vector3().subVectors(sunPos, earthPos).normalize();
    const earthMoonDir = new THREE.Vector3().subVectors(moonWorldPos, earthPos).normalize();

    // Dot product: 1 = Moon toward Sun (new moon), -1 = Moon opposite Sun (full moon)
    const dot = earthSunDir.dot(earthMoonDir);

    // Moon's distance from Earth-Sun line (for checking if shadow actually hits)
    const moonRelative = new THREE.Vector3().subVectors(moonWorldPos, earthPos);
    const projLength = moonRelative.dot(earthSunDir);
    const perpDist = new THREE.Vector3().addVectors(
        moonRelative,
        earthSunDir.clone().multiplyScalar(-projLength)
    ).length();

    let eclipseType = null;

    // Solar eclipse: Moon near Sun direction (new moon), close to Earth-Sun line
    if (dot > 0.95 && perpDist < EARTH_RADIUS * 1.5) {
        eclipseType = 'Solar Eclipse!';
    }
    // Lunar eclipse: Moon opposite Sun (full moon), close to Earth-Sun line
    else if (dot < -0.95 && perpDist < EARTH_RADIUS * 2) {
        eclipseType = 'Lunar Eclipse!';
    }

    if (eclipseType) {
        shadowObjects.eclipseIndicator.visible = true;
        // Position near Moon
        shadowObjects.eclipseIndicator.position.copy(moonWorldPos);
        shadowObjects.eclipseIndicator.position.y += 2;
    } else {
        shadowObjects.eclipseIndicator.visible = false;
    }
}

/**
 * Create a canvas-based text sprite for the eclipse indicator label.
 * @returns {THREE.Sprite}
 */
function createEclipseLabel() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillStyle = '#ff5252';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌑 Eclipse!', 128, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(6, 1.5, 1);
    return sprite;
}
