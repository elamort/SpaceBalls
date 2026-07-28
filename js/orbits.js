/**
 * orbits.js — Orbital mechanics: position computations, orbit paths, ecliptic plane
 */
import * as THREE from 'three';

const DEG2RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;

// --- Orbital Radii (scene units, deliberately distorted) ---
export let EARTH_ORBIT_RADIUS = 22;
export let MOON_ORBIT_RADIUS = 4;

export function setOrbitalRadii(earthDist, moonDist) {
    EARTH_ORBIT_RADIUS = earthDist;
    MOON_ORBIT_RADIUS = moonDist;
}

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
 * @param {number} daysPerYear Length of year in days
 * @returns {THREE.Vector3} Position in the ecliptic plane (y=0)
 */
export function computeEarthPosition(dayOfYear, eccentricity, daysPerYear = 365.24) {
    // Mean anomaly: offset so day 0 ≈ Jan 1
    const safeDays = daysPerYear === 0 ? 365.24 : daysPerYear;
    const periOffset = 3 * (Math.abs(safeDays) / 365.24);
    const M = ((dayOfYear - periOffset) / Math.abs(safeDays)) * TWO_PI;
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
export function computeMoonRelativePosition(moonPhase, lunarInclination, dayOfYear, eccentricity = 0, daysPerYear = 365.24) {
    // Moon's angle around Earth. At phase 0 (new moon), Moon is between Earth and Sun.
    // We compute the direction from Earth toward the Sun in world coords,
    // then offset the Moon by the phase angle from that direction.
    const phaseAngle = (moonPhase / 29.53) * TWO_PI;

    // Get Earth's actual position to find the direction toward the Sun
    const earthPos = computeEarthPosition(dayOfYear, eccentricity, daysPerYear);
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
 * Compute the precise Equation of Time (EoT) based on exact 3D physics.
 * @returns {number} Offset in hours (positive = true solar time ahead of mean solar time)
 */
export function computeEquationOfTimeExact(dayOfYear, eccentricity, axialTilt, daysPerYear = 365.24) {
    const safeDays = daysPerYear === 0 ? 365.24 : daysPerYear;
    
    // 1. Earth's position in space
    const earthPos = computeEarthPosition(dayOfYear, eccentricity, daysPerYear);
    
    // 2. Vernal Equinox direction (sun direction at day 80)
    const eqDays = 80 * (Math.abs(safeDays) / 365.24);
    const eqPos = computeEarthPosition(eqDays, eccentricity, daysPerYear);
    const veAngle = Math.atan2(-eqPos.z, -eqPos.x);

    // 3. True Sun vector (from Earth to Sun)
    const sx = -earthPos.x;
    const sz = -earthPos.z;
    
    // Rotate to Ecliptic coordinates (Vernal Equinox at +X)
    const cosVE = Math.cos(veAngle);
    const sinVE = Math.sin(veAngle);
    const sx_eq = sx * cosVE + sz * sinVE;
    const sz_eq = -sx * sinVE + sz * cosVE;
    
    // Rotate to Equatorial coordinates (apply axial tilt)
    const tiltRad = axialTilt * DEG2RAD;
    const x_eq = sx_eq;
    const z_eq = sz_eq * Math.cos(tiltRad);
    
    // True Right Ascension
    let trueRA = Math.atan2(z_eq, x_eq);
    if (trueRA < 0) trueRA += TWO_PI;
    
    // Mean Right Ascension (moves uniformly)
    const meanDays = dayOfYear - eqDays;
    let meanRA = (meanDays / safeDays) * TWO_PI;
    meanRA = meanRA % TWO_PI;
    if (meanRA < 0) meanRA += TWO_PI;
    
    // Equation of Time = Mean RA - True RA
    let eotRad = meanRA - trueRA;
    
    // Wrap to [-PI, PI] to handle wrapping around 0/360
    while (eotRad > Math.PI) eotRad -= TWO_PI;
    while (eotRad < -Math.PI) eotRad += TWO_PI;
    
    // Convert to hours (2PI rad = 24 hours)
    return eotRad * (24 / TWO_PI);
}

/**
 * Compute the exact sun altitude and azimuth for the Earth View.
 * 
 * @param {number} timeOfDay clock time (0-24 Mean Solar Time)
 * @param {number} dayOfYear 0-365
 * @param {number} latitude   degrees (-90 to 90)
 * @param {number} axialTilt  degrees
 * @param {number} eccentricity orbital eccentricity
 * @param {number} daysPerYear Length of year in days
 * @returns {{altitude: number, azimuth: number}} in radians.
 */
export function computeSunAltAz(timeOfDay, dayOfYear, latitude, axialTilt, eccentricity = 0, daysPerYear = 365.24) {
    const lat = latitude * DEG2RAD;
    const safeDays = daysPerYear === 0 ? 365.24 : daysPerYear;
    
    // 1. Earth's position in space
    const earthPos = computeEarthPosition(dayOfYear, eccentricity, daysPerYear);
    
    // 2. Vernal Equinox direction
    const eqDays = 80 * (Math.abs(safeDays) / 365.24);
    const eqPos = computeEarthPosition(eqDays, eccentricity, daysPerYear);
    const veAngle = Math.atan2(-eqPos.z, -eqPos.x);

    // 3. True Sun vector
    const sx = -earthPos.x;
    const sz = -earthPos.z;
    
    const cosVE = Math.cos(veAngle);
    const sinVE = Math.sin(veAngle);
    const sx_eq = sx * cosVE + sz * sinVE;
    const sz_eq = -sx * sinVE + sz * cosVE;
    
    // 4. Equatorial coordinates
    const tiltRad = axialTilt * DEG2RAD;
    const x_eq = sx_eq;
    const y_eq = sz_eq * Math.sin(tiltRad);
    const z_eq = sz_eq * Math.cos(tiltRad);
    
    // 5. True Right Ascension & Declination
    let trueRA = Math.atan2(z_eq, x_eq);
    if (trueRA < 0) trueRA += TWO_PI;
    const r = Math.sqrt(x_eq*x_eq + y_eq*y_eq + z_eq*z_eq);
    const decl = Math.asin(Math.max(-1, Math.min(1, y_eq / r)));
    
    // 6. Compute exact Equation of Time
    const meanDays = dayOfYear - eqDays;
    let meanRA = (meanDays / safeDays) * TWO_PI;
    meanRA = meanRA % TWO_PI;
    if (meanRA < 0) meanRA += TWO_PI;
    
    let eotRad = meanRA - trueRA;
    while (eotRad > Math.PI) eotRad -= TWO_PI;
    while (eotRad < -Math.PI) eotRad += TWO_PI;
    const eotHours = eotRad * (24 / TWO_PI);
    
    // 7. True Solar Time
    const trueSolarTime = timeOfDay + eotHours;
    
    // 8. Hour angle: 0 at true solar noon, increases by 15°/hour
    const hourAngle = ((trueSolarTime - 12) / 24) * TWO_PI;

    // 9. Altitude
    const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

    // 10. Azimuth using robust atan2 to avoid singularity at poles
    const y = -Math.cos(decl) * Math.sin(hourAngle);
    const x = Math.sin(decl) * Math.cos(lat) - Math.cos(decl) * Math.sin(lat) * Math.cos(hourAngle);
    let azimuth = Math.atan2(y, x);
    if (azimuth < 0) azimuth += TWO_PI;

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
export function computeMoonAltAz(timeOfDay, dayOfYear, latitude, axialTilt, moonPhase, lunarInclination, eccentricity = 0, daysPerYear = 365.24) {
    const lat = latitude * DEG2RAD;
    const tilt = axialTilt * DEG2RAD;
    const safeDays = daysPerYear === 0 ? 365.24 : daysPerYear;

    // Use rigorous Space View geometry to find Moon's longitude and latitude
    // 1. Earth's position and true direction to Sun
    const earthPos = computeEarthPosition(dayOfYear, eccentricity, daysPerYear);
    const sunDirAngle = Math.atan2(-earthPos.z, -earthPos.x);

    // 2. Vernal Equinox direction (sun direction at day 80)
    const eqDays = 80 * (Math.abs(safeDays) / 365.24);
    const eqPos = computeEarthPosition(eqDays, eccentricity, daysPerYear);
    const veAngle = Math.atan2(-eqPos.z, -eqPos.x);

    // 3. Moon's absolute orbital angle (node line is along X-axis in space view)
    const phaseAngle = (moonPhase / 29.53) * TWO_PI;
    const moonAngle = sunDirAngle + phaseAngle;

    // 4. Exact 3D vector of Moon in Space View (relative to Earth)
    const incl = lunarInclination * DEG2RAD;
    const mx = Math.cos(moonAngle);
    const my = Math.sin(moonAngle) * Math.sin(incl);
    const mz = Math.sin(moonAngle) * Math.cos(incl);

    // 5. Rotate vector so X-axis points to Vernal Equinox
    const cosVE = Math.cos(veAngle);
    const sinVE = Math.sin(veAngle);
    const x_eq = mx * cosVE + mz * sinVE;
    const y_eq = my;
    const z_eq = -mx * sinVE + mz * cosVE;

    // 6. Compute ecliptic coordinates relative to Vernal Equinox
    const moonLon = Math.atan2(z_eq, x_eq);
    const moonLat = Math.atan2(y_eq, Math.hypot(x_eq, z_eq));

    // 7. Convert ecliptic to equatorial
    const moonDecl = Math.asin(
        Math.sin(moonLat) * Math.cos(tilt) + Math.cos(moonLat) * Math.sin(tilt) * Math.sin(moonLon)
    );
    const moonRA = Math.atan2(
        Math.sin(moonLon) * Math.cos(tilt) - Math.tan(moonLat) * Math.sin(tilt),
        Math.cos(moonLon)
    );

    // 8. Compute LST synchronized exactly with True Solar Time
    const sunLon = sunDirAngle - veAngle;
    const sunRA = Math.atan2(Math.sin(sunLon) * Math.cos(tilt), Math.cos(sunLon));
    const lst = ((timeOfDay - 12) / 24) * TWO_PI + sunRA;
    
    // Hour angle
    let ha = lst - moonRA;

    // Normalize to [-PI, PI]
    ha = ha % TWO_PI;
    if (ha > Math.PI) ha -= TWO_PI;
    if (ha < -Math.PI) ha += TWO_PI;

    // Alt-Az
    const sinAlt = Math.sin(lat) * Math.sin(moonDecl) + Math.cos(lat) * Math.cos(moonDecl) * Math.cos(ha);
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

    const y = -Math.cos(moonDecl) * Math.sin(ha);
    const x = Math.sin(moonDecl) * Math.cos(lat) - Math.cos(moonDecl) * Math.sin(lat) * Math.cos(ha);
    let azimuth = Math.atan2(y, x);
    if (azimuth < 0) azimuth += TWO_PI;

    return { altitude, azimuth };
}
