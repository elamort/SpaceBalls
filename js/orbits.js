/**
 * orbits.js — Orbital mechanics: position computations, orbit paths, ecliptic plane
 */
import * as THREE from 'three';

const DEG2RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;

// --- Orbital Radii (scene units, deliberately distorted) ---
export const EARTH_ORBIT_RADIUS = 22;
export const MOON_ORBIT_RADIUS = 4;

/**
 * Solve Kepler's equation M = E - e*sin(E) via Newton-Raphson.
 * @param {number} M  Mean anomaly in radians
 * @param {number} e  Eccentricity
 * @returns {number}  Eccentric anomaly in radians
 */
export function solveKepler(M, e) {
    let E = M; // initial guess
    for (let i = 0; i < 20; i++) {
        const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= dE;
        if (Math.abs(dE) < 1e-10) break;
    }
    return E;
}

/**
 * Compute true anomaly from eccentric anomaly.
 */
export function trueAnomalyFromE(E, e) {
    return 2 * Math.atan2(
        Math.sqrt(1 + e) * Math.sin(E / 2),
        Math.sqrt(1 - e) * Math.cos(E / 2)
    );
}

/**
 * Compute Earth's position on its orbit.
 * @param {number} dayOfYear  0-365
 * @param {number} eccentricity  0 to ~0.1
 * @returns {THREE.Vector3} Position in the ecliptic plane (y=0)
 */
export function computeEarthPosition(dayOfYear, eccentricity) {
    // Mean anomaly: 0 at perihelion (day ~3 of year), we offset so day 0 ≈ Jan 1
    const M = ((dayOfYear - 3) / 365.25) * TWO_PI;
    const E = solveKepler(M, eccentricity);
    const nu = trueAnomalyFromE(E, eccentricity);

    // Distance from focus
    const r = EARTH_ORBIT_RADIUS * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(nu));

    // Position in ecliptic plane (xz plane, y is "up")
    // Angle measured from +x axis
    return new THREE.Vector3(
        r * Math.cos(nu),
        0,
        r * Math.sin(nu)
    );
}

/**
 * Compute Moon's position relative to Earth.
 * @param {number} moonPhase  0-29.53 days (synodic period). 0 = new moon (Sun-side)
 * @param {number} lunarInclination  degrees (0-10, default 5.14)
 * @returns {THREE.Vector3} Position relative to Earth center
 */
export function computeMoonRelativePosition(moonPhase, lunarInclination, dayOfYear, eccentricity = 0) {
    // Moon's angle around Earth. At phase 0 (new moon), Moon is between Earth and Sun.
    // We compute the direction from Earth toward the Sun in world coords,
    // then offset the Moon by the phase angle from that direction.
    const phaseAngle = (moonPhase / 29.53) * TWO_PI;

    // Get Earth's actual position to find the direction toward the Sun
    const earthPos = computeEarthPosition(dayOfYear, eccentricity);
    // Direction from Earth toward Sun (origin) in the xz plane
    const sunDirAngle = Math.atan2(-earthPos.z, -earthPos.x);

    // Moon at phase 0 → toward Sun; phase 0.5 (full) → away from Sun
    const moonAngle = sunDirAngle + phaseAngle;

    // Apply lunar inclination (tilt around the node line, which lies along x-axis)
    const incl = lunarInclination * DEG2RAD;

    // Position on tilted orbit
    const x = MOON_ORBIT_RADIUS * Math.cos(moonAngle);
    const z = MOON_ORBIT_RADIUS * Math.sin(moonAngle);
    // Tilt around the node line (x-axis for simplicity)
    const y = z * Math.sin(incl);
    const zp = z * Math.cos(incl);

    return new THREE.Vector3(x, y, zp);
}

/**
 * Compute Earth's rotation quaternion.
 * @param {number} timeOfDay  0-24 hours
 * @param {number} axialTilt  degrees
 * @param {number} dayOfYear  0-365 (affects which direction the tilt points)
 * @returns {THREE.Euler} The Euler rotation for the Earth mesh
 */
export function computeEarthRotation(timeOfDay, axialTilt, dayOfYear) {
    const tiltRad = axialTilt * DEG2RAD;
    // Daily rotation (around Earth's tilted axis)
    const dailyAngle = (timeOfDay / 24) * TWO_PI;
    // The tilt direction stays fixed relative to the stars (points toward Polaris)
    // As Earth orbits, the tilt appears to rotate relative to the Sun.
    // The tilt is in the y-z plane of the Earth's local frame.
    return new THREE.Euler(tiltRad, dailyAngle, 0, 'ZYX');
}

/**
 * Create the Earth orbit path as a Three.js Line.
 * @param {number} eccentricity
 * @returns {THREE.Line}
 */
export function createEarthOrbitLine(eccentricity) {
    const points = [];
    const segments = 256;
    for (let i = 0; i <= segments; i++) {
        const M = (i / segments) * TWO_PI;
        const E = solveKepler(M, eccentricity);
        const nu = trueAnomalyFromE(E, eccentricity);
        const r = EARTH_ORBIT_RADIUS * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(nu));
        points.push(new THREE.Vector3(r * Math.cos(nu), 0, r * Math.sin(nu)));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.3,
        linewidth: 1,
    });
    return new THREE.Line(geometry, material);
}

/**
 * Create the Moon orbit path as a Three.js Line (relative to Earth, added to Earth group).
 * @param {number} lunarInclination  degrees
 * @returns {THREE.Line}
 */
export function createMoonOrbitLine(lunarInclination) {
    const points = [];
    const segments = 128;
    const incl = lunarInclination * DEG2RAD;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * TWO_PI;
        const x = MOON_ORBIT_RADIUS * Math.cos(angle);
        const z = MOON_ORBIT_RADIUS * Math.sin(angle);
        const y = z * Math.sin(incl);
        const zp = z * Math.cos(incl);
        points.push(new THREE.Vector3(x, y, zp));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0x8899aa,
        transparent: true,
        opacity: 0.25,
        linewidth: 1,
    });
    return new THREE.Line(geometry, material);
}

/**
 * Create the ecliptic plane disc.
 * @returns {THREE.Mesh}
 */
export function createEclipticPlane() {
    const geometry = new THREE.RingGeometry(0.5, EARTH_ORBIT_RADIUS * 1.2, 128);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.03,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Lay flat in xz plane
    return mesh;
}

/**
 * Create a node line (where Moon's orbit crosses the ecliptic).
 * @param {number} lunarInclination  degrees
 * @returns {THREE.Line}
 */
export function createNodeLine(lunarInclination) {
    // The node line lies along the intersection of the Moon's orbital plane and the ecliptic
    // For our simplified model, this is along the x-axis (ascending/descending nodes)
    const len = MOON_ORBIT_RADIUS * 1.5;
    const points = [
        new THREE.Vector3(-len, 0, 0),
        new THREE.Vector3(len, 0, 0),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0xff5252,
        transparent: true,
        opacity: 0.6,
    });
    const line = new THREE.Line(geometry, material);
    line.visible = false; // Toggled by control
    return line;
}

/**
 * Compute sun's position in the sky (altitude, azimuth) for an Earth observer.
 * @param {number} timeOfDay  0-24 hours
 * @param {number} dayOfYear  0-365
 * @param {number} latitude   degrees (-90 to 90)
 * @param {number} axialTilt  degrees
 * @returns {{altitude: number, azimuth: number}} in radians. Altitude: -PI/2 to PI/2. Azimuth: 0=N, PI/2=E, PI=S, 3PI/2=W
 */
export function computeSunAltAz(timeOfDay, dayOfYear, latitude, axialTilt) {
    const lat = latitude * DEG2RAD;
    const tilt = axialTilt * DEG2RAD;

    // Solar declination: varies with day of year due to axial tilt
    // Simplified: declination = tilt * sin(2π * (dayOfYear - 80) / 365)
    // Day 80 ≈ spring equinox, day 172 ≈ summer solstice
    const decl = tilt * Math.sin(TWO_PI * (dayOfYear - 80) / 365);

    // Hour angle: 0 at solar noon, increases by 15°/hour
    const hourAngle = ((timeOfDay - 12) / 24) * TWO_PI;

    // Altitude
    const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

    // Azimuth
    const cosAz = (Math.sin(decl) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(altitude) + 1e-10);
    let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (hourAngle > 0) azimuth = TWO_PI - azimuth; // Afternoon: azimuth > π (west)

    return { altitude, azimuth };
}

/**
 * Convert alt-az to a 3D point on the celestial sphere.
 * @param {number} altitude  radians
 * @param {number} azimuth   radians (0=N, clockwise)
 * @param {number} radius    sphere radius
 * @returns {THREE.Vector3}
 */
export function altAzToSpherePoint(altitude, azimuth, radius) {
    // In our coordinate system:
    // +Y = up (zenith), -Y = down (nadir)
    // -Z = North, +Z = South
    // +X = East, -X = West
    const r = radius * Math.cos(altitude);
    return new THREE.Vector3(
        r * Math.sin(azimuth),       // E-W
        radius * Math.sin(altitude), // Up-down
        -r * Math.cos(azimuth)       // N-S
    );
}

/**
 * Compute the Moon's alt-az position on the celestial sphere.
 * Simplified: treats moon as additional body with its own declination/RA offset.
 */
export function computeMoonAltAz(timeOfDay, dayOfYear, latitude, axialTilt, moonPhase, lunarInclination) {
    const lat = latitude * DEG2RAD;
    const tilt = axialTilt * DEG2RAD;

    // Sun's ecliptic longitude
    const sunLon = TWO_PI * (dayOfYear - 80) / 365;

    // Moon's ecliptic longitude: offset from sun by phase
    const moonLonOffset = (moonPhase / 29.53) * TWO_PI;
    const moonLon = sunLon + moonLonOffset;

    // Moon's ecliptic latitude (due to inclined orbit)
    const incl = lunarInclination * DEG2RAD;
    const moonLat = incl * Math.sin(moonLon); // Simplified

    // Convert ecliptic to equatorial (simplified)
    const moonDecl = Math.asin(
        Math.sin(moonLat) * Math.cos(tilt) + Math.cos(moonLat) * Math.sin(tilt) * Math.sin(moonLon)
    );
    const moonRA = Math.atan2(
        Math.sin(moonLon) * Math.cos(tilt) - Math.tan(moonLat) * Math.sin(tilt),
        Math.cos(moonLon)
    );

    // Hour angle
    // Local sidereal time (simplified)
    const lst = TWO_PI * (dayOfYear / 365.25) + (timeOfDay / 24) * TWO_PI;
    let ha = lst - moonRA;

    // Normalize to [-PI, PI]
    ha = ha % TWO_PI;
    if (ha > Math.PI) ha -= TWO_PI;
    if (ha < -Math.PI) ha += TWO_PI;

    // Alt-Az
    const sinAlt = Math.sin(lat) * Math.sin(moonDecl) + Math.cos(lat) * Math.cos(moonDecl) * Math.cos(ha);
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

    const cosAz = (Math.sin(moonDecl) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(altitude) + 1e-10);
    let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (ha > 0) azimuth = TWO_PI - azimuth;

    return { altitude, azimuth };
}
