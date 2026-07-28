/**
 * bodies.js — Sun, Earth, Moon geometry, materials, and scene hierarchy
 */
import * as THREE from 'three';

const DEG2RAD = Math.PI / 180;

// --- Size Constants ---
export const SUN_RADIUS = 3;
export const EARTH_RADIUS = 1;
export const MOON_RADIUS = 0.38;

/**
 * Create the Sun group: an emissive sphere with an additive-blend glow sprite.
 * @returns {THREE.Group}
 */
function createSun() {
    const group = new THREE.Group();
    group.name = 'sun';

    // Sun sphere
    const geometry = new THREE.SphereGeometry(SUN_RADIUS, 64, 64);
    const material = new THREE.MeshBasicMaterial({
        color: 0xfff5e0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Sun glow sprite
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const ctx = glowCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 245, 224, 0.6)');
    gradient.addColorStop(0.2, 'rgba(255, 220, 150, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 180, 80, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    const glowMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.scale.set(SUN_RADIUS * 5, SUN_RADIUS * 5, 1);
    group.add(glowSprite);

    return group;
}

/**
 * Generate a stylized equirectangular Earth texture on a canvas.
 * Draws simplified continent outlines and latitude reference lines.
 * @returns {THREE.CanvasTexture}
 */
function createEarthTexture() {
    // Generate a stylized Earth texture procedurally
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Ocean base
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, 1024, 512);

    // Simplified continent shapes (very stylized polygon outlines)
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;

    // These are simplified continent outlines in equirectangular projection
    // Coordinates are [lon, lat] mapped to canvas: x = (lon+180)/360*1024, y = (90-lat)/180*512
    const continents = [
        // North America
        [[200, 110], [230, 100], [260, 90], [290, 100], [310, 130], [300, 160], [280, 170],
         [260, 180], [240, 170], [220, 155], [210, 140], [200, 110]],
        // South America
        [[280, 200], [300, 200], [310, 220], [320, 260], [310, 310], [300, 340], [280, 350],
         [270, 320], [268, 280], [270, 240], [275, 210], [280, 200]],
        // Europe
        [[480, 100], [500, 90], [520, 95], [530, 110], [520, 130], [505, 135],
         [490, 130], [480, 120], [480, 100]],
        // Africa
        [[490, 150], [510, 140], [540, 145], [560, 160], [570, 200], [560, 260],
         [540, 310], [520, 320], [500, 300], [490, 260], [485, 220], [488, 180], [490, 150]],
        // Asia
        [[530, 90], [570, 70], [620, 65], [680, 70], [740, 80], [780, 100],
         [760, 130], [720, 140], [680, 135], [640, 140], [600, 150], [560, 155],
         [540, 140], [530, 120], [530, 90]],
        // Australia
        [[710, 250], [740, 240], [770, 250], [780, 270], [770, 300], [740, 310],
         [720, 295], [710, 270], [710, 250]],
        // India subcontinent
        [[600, 150], [620, 155], [630, 180], [620, 210], [605, 210], [595, 185], [600, 150]],
    ];

    for (const continent of continents) {
        ctx.beginPath();
        for (let i = 0; i < continent.length; i++) {
            const [x, y] = continent[i];
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Subtle fill
        ctx.globalAlpha = 0.04;
        ctx.fillStyle = '#00bcd4';
        ctx.fill();
        ctx.globalAlpha = 0.6;
    }

    // Latitude lines (subtle)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.08;
    for (const lat of [-66.56, -23.44, 0, 23.44, 66.56]) {
        const y = (90 - lat) / 180 * 512;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    return new THREE.CanvasTexture(canvas);
}

/**
 * Create the Earth group: a textured sphere, a dashed axis line,
 * and an observer dot with a zenith arrow that rotates with the surface.
 * @returns {THREE.Group}
 */
function createEarth() {
    const group = new THREE.Group();
    group.name = 'earth';

    // Earth sphere
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const texture = createEarthTexture();
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 10,
        specular: 0x111122,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'earthMesh';
    group.add(mesh);

    // Axis line
    const axisLen = EARTH_RADIUS * 2.2;
    const axisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -axisLen, 0),
        new THREE.Vector3(0, axisLen, 0),
    ]);
    const axisMaterial = new THREE.LineDashedMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        dashSize: 0.15,
        gapSize: 0.1,
    });
    const axisLine = new THREE.Line(axisGeometry, axisMaterial);
    axisLine.computeLineDistances();
    axisLine.name = 'earthAxis';
    group.add(axisLine);

    // Observer dot (will be positioned by latitude)
    const dotGeom = new THREE.SphereGeometry(0.06, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xff5252 });
    const observerDot = new THREE.Mesh(dotGeom, dotMat);
    observerDot.name = 'observerDot';
    
    // Add arrow for "UP" (zenith) direction
    const arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 0.5, 0xff5252, 0.1, 0.1);
    arrowHelper.name = 'observerArrow';
    observerDot.add(arrowHelper);
    
    // Add to earthMesh so it rotates with the surface
    mesh.add(observerDot);

    return group;
}

/**
 * Update observer dot position on Earth surface based on latitude.
 */
export function updateObserverDot(earthGroup, latitude, timeOfDay) {
    const earthMesh = earthGroup.getObjectByName('earthMesh');
    if (!earthMesh) return;
    const dot = earthMesh.getObjectByName('observerDot');
    if (!dot) return;
    
    const lat = latitude * DEG2RAD;
    // The +Z axis aligns with the sun at solar noon, so lon = PI/2 puts the dot on the +Z axis.
    const lon = Math.PI / 2;
    dot.position.set(
        EARTH_RADIUS * Math.cos(lat) * Math.cos(lon),
        EARTH_RADIUS * Math.sin(lat),
        EARTH_RADIUS * Math.cos(lat) * Math.sin(lon)
    );
    
    // Update ArrowHelper direction to point outward from center
    const arrow = dot.getObjectByName('observerArrow');
    if (arrow) {
        arrow.setDirection(dot.position.clone().normalize());
    }
}

/**
 * Create the Moon group: a Phong-shaded sphere whose phase is lit
 * naturally by the scene's Sun point-light.
 * @returns {THREE.Group}
 */
function createMoon() {
    const group = new THREE.Group();
    group.name = 'moon';

    const geometry = new THREE.SphereGeometry(MOON_RADIUS, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0x999999,
        shininess: 3,
        specular: 0x111111,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'moonMesh';
    group.add(mesh);

    return group;
}

/**
 * Create a random starfield as a Points cloud on a distant sphere.
 * @returns {THREE.Points}
 */
function createStarfield() {
    const count = 2500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        // Random point on a large sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 400 + Math.random() * 100;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        sizes[i] = 0.5 + Math.random() * 1.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.6,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
    });

    return new THREE.Points(geometry, material);
}

// --- Factory ---
export function createAllBodies() {
    return {
        sun: createSun(),
        earth: createEarth(),
        moon: createMoon(),
        starfield: createStarfield(),
    };
}
