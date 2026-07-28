/**
 * earth-view.js — Celestial sphere, horizon, sun/moon trails, reference circles
 */
import * as THREE from 'three';
import { computeSunAltAz, computeMoonAltAz, altAzToSpherePoint, computeEquationOfTimeExact } from './orbits.js';
import { SUN_RADIUS, MOON_RADIUS } from './bodies.js';

const SPHERE_RADIUS = 50;
const DEG2RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;

/**
 * Create the Earth View scene contents.
 * Returns an object containing all Earth View Three.js objects.
 */
export function createEarthView() {
    const group = new THREE.Group();
    group.name = 'earthView';

    // --- Celestial Sphere (seen from inside) ---
    const sphereGeom = new THREE.SphereGeometry(SPHERE_RADIUS, 64, 64);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x050a18,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.95,
    });
    const celestialSphere = new THREE.Mesh(sphereGeom, sphereMat);
    celestialSphere.name = 'celestialSphere';
    group.add(celestialSphere);

    // --- Horizon Ring ---
    // Using a Torus instead of a flat Ring so it has 3D thickness and is visible edge-on
    const horizonGeom = new THREE.TorusGeometry(SPHERE_RADIUS * 0.99, 0.2, 16, 128);
    const horizonMat = new THREE.MeshBasicMaterial({
        color: 0x555555,
        transparent: false,
    });
    const horizonRing = new THREE.Mesh(horizonGeom, horizonMat);
    horizonRing.rotation.x = Math.PI / 2;
    horizonRing.name = 'horizonRing';
    group.add(horizonRing);

    // --- Below-horizon darkening hemisphere ---
    const belowHorizonGeom = new THREE.SphereGeometry(SPHERE_RADIUS * 0.99, 64, 32, 0, TWO_PI, Math.PI / 2, Math.PI / 2);
    const belowHorizonMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.3,
    });
    const belowHorizon = new THREE.Mesh(belowHorizonGeom, belowHorizonMat);
    belowHorizon.name = 'belowHorizon';
    group.add(belowHorizon);

    // --- Cardinal direction labels (using small sprite text) ---
    const compassGroup = new THREE.Group();
    compassGroup.name = 'compassGroup';
    const cardinals = [
        { text: 'N', az: 0 },
        { text: 'E', az: Math.PI / 2 },
        { text: 'S', az: Math.PI },
        { text: 'W', az: 3 * Math.PI / 2 },
    ];
    for (const c of cardinals) {
        // Enlarge sprite text (previously 48, using 64 now and scaling up in createTextSprite)
        const sprite = createTextSprite(c.text, '#69f0ae', 64);
        const pos = altAzToSpherePoint(0, c.az, SPHERE_RADIUS * 0.92);
        sprite.position.copy(pos);
        sprite.name = `cardinal_${c.text}`;
        compassGroup.add(sprite);
    }

    // --- Sun marker (glowing dot) ---
    const sunDotGeom = new THREE.SphereGeometry(1.2, 16, 16);
    const sunDotMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
    const sunDot = new THREE.Mesh(sunDotGeom, sunDotMat);
    sunDot.name = 'sunDot';
    group.add(sunDot);

    // Sun glow sprite in Earth View
    const sunGlowCanvas = document.createElement('canvas');
    sunGlowCanvas.width = 128;
    sunGlowCanvas.height = 128;
    const sgCtx = sunGlowCanvas.getContext('2d');
    const sgGrad = sgCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sgGrad.addColorStop(0, 'rgba(255, 230, 100, 0.8)');
    sgGrad.addColorStop(0.3, 'rgba(255, 200, 50, 0.3)');
    sgGrad.addColorStop(1, 'rgba(255, 180, 30, 0)');
    sgCtx.fillStyle = sgGrad;
    sgCtx.fillRect(0, 0, 128, 128);
    const sunGlowTex = new THREE.CanvasTexture(sunGlowCanvas);
    const sunGlowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: sunGlowTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }));
    sunGlowSprite.scale.set(5, 5, 1);
    sunGlowSprite.name = 'sunGlow';
    sunDot.add(sunGlowSprite);

    // --- Moon marker ---
    // Use MeshStandardMaterial with no emissive so it takes phases from the sun light
    const moonDotGeom = new THREE.SphereGeometry(1, 32, 32);
    const moonDotMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 1.0, metalness: 0.0 });
    const moonDot = new THREE.Mesh(moonDotGeom, moonDotMat);
    moonDot.name = 'moonDot';
    moonDot.visible = false; // Hidden until chapter 3
    group.add(moonDot);

    // --- Sun Trail (current day arc) ---
    const sunTrail = createSunTrail();
    sunTrail.name = 'sunTrail';
    group.add(sunTrail);

    // --- Moon Trail (current month arc) ---
    const moonTrail = createMoonTrail();
    moonTrail.name = 'moonTrail';
    moonTrail.visible = false;
    group.add(moonTrail);

    // --- Multi-day trails (solstice + equinox) ---
    const multiTrails = new THREE.Group();
    multiTrails.name = 'multiTrails';
    multiTrails.visible = false;
    group.add(multiTrails);

    // --- Reference Circles ---
    const refCircles = new THREE.Group();
    refCircles.name = 'refCircles';
    refCircles.visible = false;

    // Meridian (N-S through zenith)
    refCircles.add(createGreatCircle(0, 'x', 0xffffff, 0.2));

    group.add(refCircles);

    // --- Zenith marker ---
    const zenithGeom = new THREE.SphereGeometry(0.4, 8, 8);
    const zenithMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const zenithDot = new THREE.Mesh(zenithGeom, zenithMat);
    zenithDot.position.set(0, SPHERE_RADIUS * 0.9, 0);
    zenithDot.name = 'zenithDot';
    compassGroup.add(zenithDot);

    const zenithSprite = createTextSprite("UP", '#ffffff', 48);
    zenithSprite.position.set(0, SPHERE_RADIUS * 0.85, 0);
    zenithSprite.name = 'zenithLabel';
    compassGroup.add(zenithSprite);
    
    group.add(compassGroup);

    // --- Sunrise/Sunset markers ---
    const riseMarker = createDiamondMarker(0xffab00);
    riseMarker.name = 'riseMarker';
    riseMarker.visible = false;
    group.add(riseMarker);

    const setMarker = createDiamondMarker(0xff5252);
    setMarker.name = 'setMarker';
    setMarker.visible = false;
    group.add(setMarker);

    // --- Analemma trail (chapter 5) ---
    const analemmaTrail = new THREE.Group();
    analemmaTrail.name = 'analemmaTrail';
    analemmaTrail.visible = false;
    group.add(analemmaTrail);

    // --- Sun Directional Light (for Moon Phases) ---
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.name = 'sunLight';
    group.add(sunLight);
    // Ambient light so the dark side of the moon is slightly visible
    const ambientLight = new THREE.AmbientLight(0x222222);
    group.add(ambientLight);

    return {
        group,
        sunDot,
        moonDot,
        sunTrail,
        moonTrail,
        multiTrails,
        refCircles,
        belowHorizon,
        compassGroup,
        riseMarker,
        setMarker,
        analemmaTrail,
        sunLight,
    };
}

/**
 * Update the entire Earth View based on current control values.
 */
export function updateEarthView(evObjects, controls) {
    const tod = controls.getValue('timeOfDay');
    const doy = controls.getValue('dayOfYear') || 172;
    const lat = controls.getValue('latitude');
    const tilt = controls.getValue('axialTilt') || 0;
    const ecc = controls.getValue('eccentricity') || 0;
    const moonPhase = controls.getValue('moonPosition') || 0;
    const lunarIncl = controls.getValue('lunarInclination') || 0;
    const moonTrailLength = controls.getValue('moonTrailLength') || 24;
    const daysPerYear = controls.getValue('daysPerYear') ?? 365.24;
    const showRef = controls.getValue('refCircles');
    const showAnalemma = controls.getValue('analemmaTrail');

    // Update sun position
    const sunAltAz = computeSunAltAz(tod, doy, lat, tilt, ecc, daysPerYear);
    const sunPos = altAzToSpherePoint(sunAltAz.altitude, sunAltAz.azimuth, SPHERE_RADIUS * 0.85);
    evObjects.sunDot.position.copy(sunPos);

    // Update Sun Light to illuminate the Moon
    if (evObjects.sunLight) {
        evObjects.sunLight.position.copy(sunPos);
        evObjects.sunLight.target.position.set(0, 0, 0); // Point at origin
        evObjects.sunLight.target.updateMatrixWorld();
    }

    // Scale Sun based on physical angular size
    const sunSizeMult = controls.getValue('sunSize') ?? 1.0;
    const sunDist = controls.getValue('sunEarthDistance') ?? 22;
    // Trigonometric angular size factor, normalized so default looks good
    // Angular size ~ Radius / Distance. K_sun_proj = 22/3
    const sunScale = (SUN_RADIUS * sunSizeMult / sunDist) * (22 / 3);
    evObjects.sunDot.scale.setScalar(sunScale);

    // Update moon position
    if (evObjects.moonDot.visible) {
        const moonAltAz = computeMoonAltAz(tod, doy, lat, tilt, moonPhase, lunarIncl, ecc, daysPerYear);
        const moonPos = altAzToSpherePoint(moonAltAz.altitude, moonAltAz.azimuth, SPHERE_RADIUS * 0.85);
        evObjects.moonDot.position.copy(moonPos);

        const moonSizeMult = controls.getValue('moonSize') ?? 2.0;
        const moonDist = controls.getValue('moonEarthDistance') ?? 4;
        // K_moon_proj = 8.8 to ensure physically accurate relative sizes vs the Sun
        const moonScale = (MOON_RADIUS * moonSizeMult / moonDist) * 8.8;
        evObjects.moonDot.scale.setScalar(moonScale);

        evObjects.moonTrail.visible = true;
        updateMoonTrail(evObjects.moonTrail, tod, doy, lat, tilt, moonPhase, lunarIncl, ecc, moonTrailLength, daysPerYear);
    } else {
        evObjects.moonTrail.visible = false;
    }

    // Update sun trail for current day
    const showCompass = controls.getValue('compassLabels');
    if (evObjects.sunTrail.visible) {
        updateSunTrail(evObjects.sunTrail, doy, lat, tilt, ecc, daysPerYear);
    }

    // Visual toggles
    evObjects.refCircles.visible = !!showRef;
    evObjects.compassGroup.visible = (showCompass !== false); // default true

    // Sunrise/sunset markers
    updateRiseSetMarkers(evObjects, doy, lat, tilt, ecc, daysPerYear);

    // Multi trails
    if (evObjects.multiTrails.visible) {
        updateMultiTrails(evObjects.multiTrails, lat, tilt, ecc, daysPerYear);
    }

    // Analemma
    if (showAnalemma) {
        updateAnalemmaTrail(evObjects.analemmaTrail, lat, tilt, ecc, daysPerYear);
        evObjects.analemmaTrail.visible = true;
    } else {
        evObjects.analemmaTrail.visible = false;
    }
}

/**
 * Create the sun trail line geometry (pre-allocated buffer for 200 points).
 * @returns {THREE.Line}
 */
function createSunTrail() {
    const geometry = new THREE.BufferGeometry();
    const maxPoints = 200;
    const positions = new Float32Array(maxPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    const material = new THREE.LineDashedMaterial({
        color: 0xffab00,
        transparent: true,
        opacity: 0.8,
        dashSize: 1,
        gapSize: 1,
    });
    return new THREE.Line(geometry, material);
}

/**
 * Recompute the sun trail arc for a given day by sampling the sun's
 * alt-az position every 15 minutes across 24 hours.
 * @param {THREE.Line} trail  The pre-allocated trail line
 * @param {number} dayOfYear
 * @param {number} latitude  Observer latitude in degrees
 * @param {number} tilt  Axial tilt in degrees
 * @param {number} daysPerYear
 */
function updateSunTrail(trail, dayOfYear, latitude, tilt, eccentricity, daysPerYear) {
    const positions = trail.geometry.attributes.position.array;
    const steps = 96; // One point every 15 minutes
    let count = 0;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * 24;
        const altAz = computeSunAltAz(t, dayOfYear, latitude, tilt, eccentricity, daysPerYear);
        const p = altAzToSpherePoint(altAz.altitude, altAz.azimuth, SPHERE_RADIUS * 0.84);
        positions[count * 3] = p.x;
        positions[count * 3 + 1] = p.y;
        positions[count * 3 + 2] = p.z;
        count++;
    }
    trail.geometry.setDrawRange(0, count);
    trail.geometry.attributes.position.needsUpdate = true;
    trail.computeLineDistances();
}

/**
 * Create the moon trail line geometry (pre-allocated buffer for 4000 points).
 * @returns {THREE.Line}
 */
function createMoonTrail() {
    const geometry = new THREE.BufferGeometry();
    const maxPoints = 4000;
    const positions = new Float32Array(maxPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    const material = new THREE.LineDashedMaterial({
        color: 0xaa55ff,
        transparent: true,
        opacity: 0.8,
        dashSize: 1,
        gapSize: 1,
    });
    return new THREE.Line(geometry, material);
}

/**
 * Recompute the moon trail arc centered on the current time, spanning
 * trailLength hours in both directions. Adjusts moon phase across day
 * boundaries to maintain physical accuracy.
 * @param {THREE.Line} trail
 * @param {number} tod  Current time of day
 * @param {number} dayOfYear
 * @param {number} latitude  Observer latitude in degrees
 * @param {number} tilt  Axial tilt in degrees
 * @param {number} moonPhase  Current moon phase (0-29.53 days)
 * @param {number} lunarIncl  Lunar orbital inclination in degrees
 * @param {number} trailLength  Trail duration in hours
 * @param {number} daysPerYear
 */
function updateMoonTrail(trail, tod, dayOfYear, latitude, tilt, moonPhase, lunarIncl, eccentricity, trailLength, daysPerYear) {
    const positions = trail.geometry.attributes.position.array;
    // 4 points per hour (every 15 minutes)
    const pointsPerHour = 4;
    const steps = Math.min(Math.ceil(trailLength * pointsPerHour), 3999); 
    
    let count = 0;
    // Center the arc around the current time
    for (let i = 0; i <= steps; i++) {
        // offset from -trailLength/2 to +trailLength/2
        const offsetHours = - (trailLength / 2) + (i / steps) * trailLength;
        
        // Treat time continuously to avoid discrete orbital jumps
        let tArc = tod + offsetHours;
        let dArc = dayOfYear + (offsetHours / 24);
        
        // Also adjust the moon phase
        let phaseForArc = moonPhase + (offsetHours / 24);
        phaseForArc = ((phaseForArc % 29.53) + 29.53) % 29.53;
        
        const altAz = computeMoonAltAz(tArc, dArc, latitude, tilt, phaseForArc, lunarIncl, eccentricity, daysPerYear);
        const p = altAzToSpherePoint(altAz.altitude, altAz.azimuth, SPHERE_RADIUS * 0.84);
        positions[count * 3] = p.x;
        positions[count * 3 + 1] = p.y;
        positions[count * 3 + 2] = p.z;
        count++;
    }
    trail.geometry.setDrawRange(0, count);
    trail.geometry.attributes.position.needsUpdate = true;
    trail.computeLineDistances();
}

/**
 * Find sunrise/sunset times by scanning the sun's altitude across the day
 * and place diamond markers on the horizon at those azimuths.
 * @param {object} evObjects  Earth View objects from createEarthView()
 * @param {number} doy  Day of year
 * @param {number} lat  Observer latitude in degrees
 * @param {number} tilt  Axial tilt in degrees
 * @param {number} daysPerYear
 */
function updateRiseSetMarkers(evObjects, doy, lat, tilt, eccentricity, daysPerYear) {
    // Find approximate sunrise and sunset by scanning
    let riseTime = null, setTime = null;
    let prevAlt = null;
    for (let t = 0; t <= 24; t += 0.1) {
        const { altitude } = computeSunAltAz(t, doy, lat, tilt, eccentricity, daysPerYear);
        if (prevAlt !== null) {
            if (prevAlt < 0 && altitude >= 0 && riseTime === null) riseTime = t;
            if (prevAlt >= 0 && altitude < 0 && setTime === null) setTime = t;
        }
        prevAlt = altitude;
    }

    if (riseTime !== null) {
        const riseAltAz = computeSunAltAz(riseTime, doy, lat, tilt, eccentricity, daysPerYear);
        evObjects.riseMarker.position.copy(altAzToSpherePoint(0, riseAltAz.azimuth, SPHERE_RADIUS * 0.84));
        evObjects.riseMarker.visible = true;
    } else {
        evObjects.riseMarker.visible = false;
    }

    if (setTime !== null) {
        const setAltAz = computeSunAltAz(setTime, doy, lat, tilt, eccentricity, daysPerYear);
        evObjects.setMarker.position.copy(altAzToSpherePoint(0, setAltAz.azimuth, SPHERE_RADIUS * 0.84));
        evObjects.setMarker.visible = true;
    } else {
        evObjects.setMarker.visible = false;
    }
}

/**
 * Create a dashed great circle on the celestial sphere.
 * @param {number} angle  Rotation angle (unused, reserved for tilted circles)
 * @param {string} axis  Rotation axis: 'x' (meridian), 'y', or 'z' (equator)
 * @param {number} color  Hex color
 * @param {number} opacity
 * @returns {THREE.Line}
 */
function createGreatCircle(angle, axis, color, opacity) {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const r = SPHERE_RADIUS * 0.88;
        let x, y, z;
        if (axis === 'z') { // Equator-like (horizontal circle)
            x = r * Math.cos(t);
            y = 0;
            z = r * Math.sin(t);
        } else if (axis === 'x') { // Meridian-like (vertical circle N-S)
            x = 0;
            y = r * Math.sin(t);
            z = r * Math.cos(t);
        } else { // y-axis
            x = r * Math.cos(t);
            y = r * Math.sin(t);
            z = 0;
        }
        points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
        color,
        transparent: true,
        opacity,
        dashSize: 1.5,
        gapSize: 1,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
}

/**
 * Create a diamond-shaped flat marker (two triangles) for sunrise/sunset.
 * @param {number} color  Hex color
 * @returns {THREE.Mesh}
 */
function createDiamondMarker(color) {
    const shape = new THREE.BufferGeometry();
    const s = 0.6;
    const vertices = new Float32Array([
        0, s, 0,   s, 0, 0,   0, -s, 0,
        0, -s, 0,  -s, 0, 0,  0, s, 0,
    ]);
    shape.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    return new THREE.Mesh(shape, mat);
}

/**
 * Create a text sprite rendered via canvas for labels on the celestial sphere.
 * Text is drawn three times at the same position for a bold effect.
 * @param {string} text  Label text
 * @param {string} color  CSS color string
 * @param {number} fontSize  Font size in pixels
 * @returns {THREE.Sprite}
 */
function createTextSprite(text, color, fontSize) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 32);
    ctx.fillText(text, 64, 32);
    ctx.fillText(text, 64, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 999;
    sprite.scale.set(8, 4, 1);
    return sprite;
}

/**
 * Rebuild the analemma figure-8 trail on the celestial sphere.
 * Computes the sun's position at solar noon (corrected by EoT) for each day
 * of the year, then plots the resulting figure-8 with dot markers.
 * Caches the result via userData to avoid rebuilding when parameters haven't changed.
 * @param {THREE.Group} analemmaGroup
 * @param {number} latitude  Observer latitude in degrees
 * @param {number} tilt  Axial tilt in degrees
 * @param {number} eccentricity  Orbital eccentricity
 * @param {number} daysPerYear
 */
function updateAnalemmaTrail(analemmaGroup, latitude, tilt, eccentricity, daysPerYear) {
    // Only rebuild if not already built (or parameters changed)
    if (analemmaGroup.userData.built &&
        analemmaGroup.userData.lat === latitude &&
        analemmaGroup.userData.tilt === tilt &&
        analemmaGroup.userData.ecc === eccentricity &&
        analemmaGroup.userData.days === daysPerYear) {
        return;
    }

    // Clear existing
    while (analemmaGroup.children.length) {
        const child = analemmaGroup.children[0];
        analemmaGroup.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    }

    // Compute sun position at solar noon (12:00 clock time) for each day of the year
    const points = [];
    
    // Create the continuous curve using enough samples (min 365)
    const safeDays = daysPerYear === 0 ? 365.24 : daysPerYear;
    const maxLoop = Math.max(1, Math.abs(safeDays));
    const sampleCount = Math.max(365, maxLoop);
    for (let i = 0; i < sampleCount; i++) {
        const d = (i / sampleCount) * maxLoop;
        const altAz = computeSunAltAz(12, d, latitude, tilt, eccentricity, safeDays);
        const p = altAzToSpherePoint(altAz.altitude, altAz.azimuth, SPHERE_RADIUS * 0.83);
        points.push(p);
    }
    // Close the loop
    points.push(points[0].clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0xff6e40,
        transparent: true,
        opacity: 0.7,
    });
    const line = new THREE.Line(geometry, material);
    analemmaGroup.add(line);

    // Add dot markers on actual integer days
    for (let d = 0; d < maxLoop; d++) {
        const altAz = computeSunAltAz(12, d, latitude, tilt, eccentricity, safeDays);
        const p = altAzToSpherePoint(altAz.altitude, altAz.azimuth, SPHERE_RADIUS * 0.83);
        
        const dotGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xff6e40 });
        const dot = new THREE.Mesh(dotGeom, dotMat);
        dot.position.copy(p);
        analemmaGroup.add(dot);
    }

    analemmaGroup.userData.built = true;
    analemmaGroup.userData.lat = latitude;
    analemmaGroup.userData.tilt = tilt;
    analemmaGroup.userData.ecc = eccentricity;
    analemmaGroup.userData.days = daysPerYear;
}

/**
 * Create multi-day trails (solstice + equinox comparison arcs).
 * @param {THREE.Group} multiTrailGroup
 * @param {number} latitude
 * @param {number} tilt
 */
export function updateMultiTrails(multiTrailGroup, latitude, tilt, eccentricity, daysPerYear) {
    // Clear existing
    while (multiTrailGroup.children.length) {
        const child = multiTrailGroup.children[0];
        multiTrailGroup.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    }

    const safeDays = daysPerYear === 0 ? 365.24 : daysPerYear;
    const scale = Math.abs(safeDays) / 365.24;
    const configs = [
        { day: 172 * scale, color: 0xff6e40, label: 'Summer Solstice' },   // ~June 21
        { day: 355 * scale, color: 0x448aff, label: 'Winter Solstice' },   // ~Dec 21
        { day: 80 * scale,  color: 0x69f0ae, label: 'Spring Equinox' },    // ~Mar 21
    ];

    for (const cfg of configs) {
        const points = [];
        for (let i = 0; i <= 96; i++) {
            const t = (i / 96) * 24;
            const altAz = computeSunAltAz(t, cfg.day, latitude, tilt, eccentricity, safeDays);
            const p = altAzToSpherePoint(altAz.altitude, altAz.azimuth, SPHERE_RADIUS * 0.83);
            points.push(p);
        }
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.4 });
        multiTrailGroup.add(new THREE.Line(geom, mat));
    }
}
