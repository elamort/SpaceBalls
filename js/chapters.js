/**
 * chapters.js — Chapter definitions, card content, scene state transitions
 */

/**
 * Chapter definitions with overlay card content and scene configurations.
 * Each chapter defines:
 * - id, title, icon
 * - cards[]: educational content with scene state per card
 * - sceneConfig: default scene state when entering this chapter
 */
export const CHAPTERS = [
    // ============================================================
    // Chapter 0: Introduction
    // ============================================================
    {
        id: 0,
        title: 'Introduction',
        icon: '🚀',
        sceneConfig: {
            "showMoon": true,
            "showEclipticPlane": true,
            "showNodeLine": false,
            "showShadowCones": false,
            "cameraPos": {
                "x": 0,
                "y": 25,
                "z": 40
            },
            "defaults": {
                "timeOfDay": 12,
                "dayOfYear": 81,
                "compassLabels": true,
                "sunSize": 1,
                "moonSize": 3,
                "planeOpacity": 0.0,
                "latitude": 54,
                "axialTilt": 0,
                "moonPosition": 26,
                "moonTrailLength": 36,
                "lunarInclination": 5.5,
                "shadowCones": false,
                "nodeLine": false,
                "eccentricity": 0,
                "daysPerYear": 365,
                "analemmaTrail": false,
                "eotGraph": false
            }
        },
        cards: [
            {
                title: 'Welcome to the Earth...',
                body: `<p>The night sky is beautiful and wonderfully complex. It took humans thousands of years to understand </p>
                        <p>that the lengths of days, months, years and seasons, the strange motions of the sun, moon, planets and stars...</p>`,
                sceneState: {
                    "view": 'earth',
                    "hideControlPanel": true,
                    "hideViewToggle": true,
                    "collapseLegend": true,
                    "playing": true,
                    "speed": 10,
                    "animMode": "day",
                    "earthViewAngle": {
                        "yaw": 2.18,
                        "pitch": 0.6
                    },
                    "earthZoom": 80
                }
            },
            {
                title: '... Earth, a ball floating in space...',
                body: `<p>... it can all be understood by imagining spheres revolving in space. </p>
                        <p> And now that we can see the whole picture, it's much easier to understand how a certain position of the bodies in space... </p>`,
                sceneState: {
                    view: 'space',
                    cameraPos: {
                        x: 9.3,
                        y: 15.4,
                        z: 44.2
                    },
                    setValues: {
                        timeOfDay: 0.35,
                        dayOfYear: 150,
                        sunSize: 1,
                        moonSize: 2.5,
                        moonPosition: 4.985
                    },
                    hideControlPanel: true,
                    hideViewToggle: true,
                    hideLegend: true,
                    hideSpacePerspectives: false, followEarth: false
                }
            },
            {
                title: '... Earth, a ball floating in space...',
                body: `<p>... leads to a given view on Earth. </p>`,
                sceneState: {
                    view: 'earth',
                    "earthViewAngle": {
                        "yaw": 2.18,
                        "pitch": 0.6
                    },
                }
            },
            {
                title: 'See for yourself!',
                body: `<p>You will progressively unlock the ability to vary new parameters of this model solar system. </p>
                        <p>By learning how to play around with this model, you will learn how the solar system works, and how that explains virtually everything about the sky. </p>
                        <p>Ready?</p>`,
                sceneState: { view: 'earth', hideControlPanel: true, hideViewToggle: true, hideLegend: true, hideEarthControls: true }
            },
            {
                title: 'How to Navigate',
                body: `<p><strong>Space View:</strong> You are currently floating in space. <strong>Right-Click and drag</strong> or use the arrow keys to pan around. Left-Click to rotate, and Scroll to zoom.</p>
                        <p>You can also use the preset of perspectives in the window in the top left corner of your screen. </p>`,
                sceneState: { view: 'space', hideControlPanel: true, hideViewToggle: true, hideSpacePerspectives: false, followEarth: false }
            },
            {
                title: 'How to Navigate',
                body: `<p>This is the same scene, but seen from a human's perspective. Look around using the arrow keys. </p>
                        <p>You have a preset of directions in the top left corner. Also try changing the zoom: you can see a larger horizon, at the cost of distorting straight lines.
                        <p>You can go back and forth between the Earth and Space perspectives using the switch at the top of your screen. </p>`,
                sceneState: {
                    view: 'earth',
                    hideViewToggle: false,
                    hideLegend: false,
                    hideEarthControls: false
                }
            },
            {
                title: 'How to Navigate',
                body: `<p>Use the <strong>Controls Panel</strong> at the bottom to manipulate the cosmos. Try dragging the <strong>Time of Day</strong> dial to spin the Earth, or the <strong>Day of Year</strong> dial to move it along its orbit!</p>
                        <p>You can also change the sizes of the different objects, the playback speed etc... try exploring both the Earth and Space PoVs. </p>`,
                sceneState: { hideControlPanel: false, collapseControlPanel: false }
            }
        ],
    },

    // ============================================================
    // Chapter 1: The Day
    // ============================================================
    {
        id: 1,
        title: 'The Day',
        icon: '☀️',
        sceneConfig: {
            "showMoon": false,
            "showEclipticPlane": true,
            "showNodeLine": false,
            "showShadowCones": false,
            "cameraPos": {
                "x": 0,
                "y": 25,
                "z": 40
            },
            "defaults": {
                "timeOfDay": 12,
                "dayOfYear": 81,
                "compassLabels": true,
                "sunSize": 1,
                "moonSize": 1,
                "planeOpacity": 0.0,
                "latitude": 54,
                "axialTilt": 0,
                "moonPosition": 26,
                "moonTrailLength": 36,
                "lunarInclination": 5.5,
                "shadowCones": false,
                "nodeLine": false,
                "eccentricity": 0,
                "daysPerYear": 365,
                "analemmaTrail": false,
                "eotGraph": false
            }
        },
        cards: [
            {
                title: 'The Equator',
                body: `<p>A <strong>day</strong> is the most fundamental unit of time we experience, caused by Earth spinning on its axis.</p>
                       <p>Let's start at the <strong>Equator</strong>. Notice the red dot with the <em>UP arrow</em> — this is you, the observer!</p>
                       <p>In <strong>Space View</strong>, drag the <em>Time of Day</em> slider and watch the arrow rotate with the surface.</p>`,
                sceneState: { view: 'space', setValues: 'defaults', hideDevTools: false, followEarth: true },
            },
            {
                title: 'Equatorial Sky',
                body: `<p>Now switch to <strong>Earth View</strong> using the toggle above to see what this looks like from the ground.</p>
                       <p>The <em>golden arc</em> traces the Sun's path. Because you are at the equator with no axial tilt, the Sun passes <strong>directly overhead</strong> (zenith) every single day, rising due East and setting due West.</p>
                       <p>The day is exactly 12 hours long.</p>`,
                sceneState: { view: 'earth', setValues: { latitude: 0 } },
            },
            {
                title: 'The North Pole',
                body: `<p>Now for the other extreme! You have been teleported to the <strong>North Pole</strong>.</p>
                       <p>Look at the Sun's trajectory now! Without axial tilt, the Sun never rises high in the sky, but it also <strong>never sets</strong>.</p>
                       <p>It simply circles the horizon in a continuous 24-hour twilight.</p>`,
                sceneState: { view: 'earth', setValues: { latitude: 90 } },
            },
            {
                title: 'The North Pole',
                body: `<p>That makes sense when you look from space. The red arrow never points away from the sun, it never hides in the shadow of the Earth.</p>`,
                sceneState: { view: 'space', followEarth: true },
            },
            {
                title: 'Between Extremes',
                body: `<p>Usually, we live somewhere in between. Sweep the <em>Latitude</em> slider back and forth.</p>
                       <p>Notice how changing your latitude <strong>tilts the entire trajectory</strong> of the Sun in the sky?</p>
                       <p>Varying our lattitude changes the angle of the sun's trajectory and the highest point it reaches on the sky.</p>
                       <p>But it still rises in the East and sets in the West predictably every 12 hours.</p>`,
                sceneState: { view: 'earth', highlight: 'latitude', setValues: { latitude: 45 } },
            },
            {
                title: 'Playground: The Day',
                body: `<p>Take some time to explore the current playground.</p>
                       <p>Experiment with <em>Time of Day</em>, <em>Day of Year</em>, and <em>Latitude</em> to fully understand this simplified, zero-tilt Earth.</p>
                       <p>When you are ready to see how Earth's real tilt creates the seasons, proceed to the next chapter.</p>`,
                sceneState: { view: 'space', followEarth: true },
            },
        ],
    },

    // ============================================================
    // Chapter 2: The Seasons
    // ============================================================
    {
        id: 2,
        title: 'The Seasons',
        icon: '🌍',
        sceneConfig: {
            showMoon: false,
            showEclipticPlane: true,
            showNodeLine: false,
            showShadowCones: false,
            cameraPos: { x: 15, y: 25, z: 30 },
            defaults: { axialTilt: 23.44, dayOfYear: 172, eccentricity: 0 },
        },
        cards: [
            {
                title: 'The Tilted Earth',
                body: `<p>Earth's axis isn't perpendicular to its orbit — it's tilted by <strong>23.44°</strong>. This tilt is the cause of seasons.</p>
                       <p>Try the <em>Axial Tilt</em> slider to see what different tilts would look like!</p>`,
                sceneState: { view: 'space', highlight: 'axialTilt', hideControlPanel: false, hideViewToggle: false, hideLegend: false, hideEarthControls: false, followEarth: true },
            },
            {
                title: 'Solstices',
                body: `<p>At <strong>Day 172</strong> (Summer Solstice), the North Pole points <em>toward</em> the Sun. With <strong>Earth View</strong> at 45°N, you get 15 hours of daylight.</p>
                       <p>At <strong>Day 355</strong> (Winter Solstice), it points <em>away</em>, giving only 9 hours of weak sunlight. Switch views and scrub the days to see the sun's trajectory shift!</p>`,
                sceneState: { view: 'earth', setValues: { dayOfYear: 172, latitude: 45 }, highlight: 'dayOfYear' },
            },
            {
                title: 'Extreme Case: 90° Tilt',
                body: `<p>What if Earth was tilted on its side, like <strong>Uranus</strong>?</p>
                       <p>Set tilt to 90°. Notice how one pole points <em>directly</em> at the Sun during the solstice! Half the year is continuous daylight, the other half is continuous freezing night.</p>`,
                sceneState: { view: 'space', setValues: { axialTilt: 90, dayOfYear: 172 }, followEarth: true },
            },
            {
                title: 'The Tropics & Equinox',
                body: `<p>Between the Tropics (23.44° N/S), the Sun can pass <em>directly overhead</em>.</p>
                       <p>At the Equinox (Day 80 or 266), the tilt is sideways to the Sun. Everyone on Earth gets exactly 12 hours of day and 12 of night!</p>`,
                sceneState: { view: 'earth', setValues: { axialTilt: 23.44, dayOfYear: 80, latitude: 23.44 } },
            },
        ],
    },

    // ============================================================
    // Chapter 3: The Month
    // ============================================================
    {
        id: 3,
        title: 'The Month',
        icon: '🌙',
        sceneConfig: {
            showMoon: true,
            showEclipticPlane: true,
            showNodeLine: false,
            showShadowCones: false,
            cameraPos: { x: 0, y: 15, z: 30 },
            defaults: { lunarInclination: 0, moonPosition: 0 },
        },
        cards: [
            {
                title: 'What is a Month?',
                body: `<p>A <strong>month</strong> is derived from the "Moon." It takes about 29.5 days to complete its cycle.</p>
                       <p>Look at the scene — the Moon now orbits Earth. The lit side always faces the Sun.</p>`,
                sceneState: { view: 'space', hideControlPanel: false, hideViewToggle: false, hideLegend: false, collapseControlPanel: true, collapseLegend: false, lunarInclination: 0, followEarth: true },
            },
            {
                title: 'New vs Full Moon',
                body: `<p>When the Moon is between Earth and Sun (Phase = 0), we only see its dark side: <strong>New Moon</strong>.</p>
                       <p>When it's on the opposite side (Phase = 14.8), we see its fully lit face: <strong>Full Moon</strong>.</p>`,
                sceneState: { view: 'space', setValues: { moonPosition: 14.8 }, highlight: 'moonPosition', followEarth: true },
            },
            {
                title: 'Moon in the Sky',
                body: `<p>Switch to <em>Earth View</em>. Watch how the Moon phase matches its position in the sky!</p>
                       <p>A Full Moon rises exactly as the Sun sets. Scrub the <em>Moon Phase</em> slider to watch them dance.</p>`,
                sceneState: { view: 'earth', setValues: { moonPosition: 14.8 } },
            },
        ],
    },

    // ============================================================
    // Chapter 4: Eclipses
    // ============================================================
    {
        id: 4,
        title: 'Eclipses',
        icon: '🌑',
        sceneConfig: {
            showMoon: true,
            showEclipticPlane: true,
            showNodeLine: true,
            showShadowCones: true,
            cameraPos: { x: 10, y: 12, z: 20 },
            defaults: { lunarInclination: 5.14 },
        },
        cards: [
            {
                title: 'The Tilted Orbit',
                body: `<p>If eclipses happen when the Sun, Earth, and Moon align, why don't we get them every month?</p>
                       <p>The Moon's orbit is <strong>tilted 5.14°</strong> relative to Earth's. It usually passes above or below the shadow cones.</p>`,
                sceneState: { view: 'space', highlight: 'lunarInclination', hideControlPanel: false, hideViewToggle: false, hideLegend: false, followEarth: true, collapseControlPanel: true },
            },
            {
                title: 'Extreme Case: 0° Tilt',
                body: `<p>If the Moon's orbit was perfectly flat (0° tilt), we would have a <strong>solar eclipse</strong> every New Moon and a <strong>lunar eclipse</strong> every Full Moon!</p>
                       <p>Set inclination to 0° and phase to 14.8 to see a perfect lunar eclipse.</p>`,
                sceneState: { view: 'space', setValues: { lunarInclination: 0, moonPosition: 14.8 }, followEarth: true },
            },
            {
                title: 'The Line of Nodes',
                body: `<p>With a 5.14° tilt, eclipses only happen when the Moon crosses the <strong>red line of nodes</strong> exactly during a New or Full Moon.</p>
                       <p>This perfect alignment only happens 2-5 times a year!</p>`,
                sceneState: { view: 'space', setValues: { lunarInclination: 5.14, moonPosition: 0 }, followEarth: true },
            },
        ],
    },

    // ============================================================
    // Chapter 5: Solar Time
    // ============================================================
    {
        id: 5,
        title: 'Solar Time',
        icon: '⏱️',
        sceneConfig: {
            showMoon: true,
            showEclipticPlane: true,
            showNodeLine: false,
            showShadowCones: false,
            cameraPos: { x: 0, y: 20, z: 35 },
            defaults: { eccentricity: 0.0167 },
        },
        cards: [
            {
                title: 'Kepler\'s Second Law',
                body: `<p>Earth's orbit isn't a perfect circle — it's an <strong>ellipse</strong>. This means the Sun isn't perfectly at the center.</p>
                       <p>Because of this, Earth moves <strong>faster</strong> when closer to the Sun and <strong>slower</strong> when farther away. Solar noon doesn't arrive at the exact same time every day!</p>`,
                sceneState: { view: 'space', highlight: 'eccentricity', hideControlPanel: false, hideViewToggle: false, hideLegend: false, followEarth: false, collapseControlPanel: true },
            },
            {
                title: 'Extreme Case: High Eccentricity',
                body: `<p>Set eccentricity to 0.8 to see an orbit like a <strong>comet</strong>!</p>
                       <p>Notice how extremely fast it moves near the Sun and how it crawls when far away. The length of a solar day would vary wildly.</p>`,
                sceneState: { view: 'space', setValues: { eccentricity: 0.8 }, followEarth: false },
            },
            {
                title: 'The Analemma',
                body: `<p>Because of eccentricity (varying speed) and obliquity (axial tilt), the Sun isn't in the exact same spot at noon every day.</p>
                       <p>Turn on the <strong>Analemma</strong> and switch to <strong>Earth View</strong>. The figure-8 shape shows where the Sun is at the <em>same clock time</em> every day of the year!</p>
                       <p><em>Note: The analemma as computed by this website is likely wrong and has not been verified for astronomical accuracy. Take it with a grain of salt, especially when varying the parameters wildly.</em></p>
                       <p>This completes our journey. Enjoy the Playground! 🌌</p>`,
                sceneState: { view: 'earth', setValues: { analemmaTrail: true, eccentricity: 0.0167 }, highlight: 'analemmaTrail' },
            },
        ],
    },

    // ============================================================
    // Chapter 6: Playground
    // ============================================================
    {
        id: 6,
        title: 'Playground',
        icon: '🔭',
        sceneConfig: {
            showMoon: true,
            showEclipticPlane: true,
            showNodeLine: false,
            showShadowCones: false,
            cameraPos: { x: 0, y: 25, z: 40 },
            defaults: {},
        },
        cards: [
            {
                title: 'Free Exploration',
                body: `<p>All controls and toggles are now unlocked. Experiment to see how different parameters interact!</p>
                       <p>Note: The distances and sizes in this model are highly exaggerated so both Earth and Moon can be seen at once.</p>
                       <label class="surface-toggle" style="margin-top:12px; display:flex;">
                           <input type="checkbox" class="set-to-scale-toggle">
                           <span class="surface-track"></span>
                           <span class="surface-label" style="margin-left:8px;">Set models to actual values</span>
                       </label>
                       <p>Try the <strong>play</strong> button to watch time flow.</p>`,
                sceneState: {
                    view: 'space',
                    setValues: {
                        timeOfDay: 0.35,
                        dayOfYear: 150,
                        sunSize: 1,
                        moonSize: 2.5,
                        moonPosition: 4.985
                    },
                    followEarth: false,
                    hideControlPanel: false,
                    collapseControlPanel: true,
                    hideDevTools: false,
                    hideEarthControls: false,
                    hideLegend: false,
                    hideSpacePerspectives: false,
                    hideViewToggle: false,
                    collapseLegend: false,
                },
            },
        ],
    },
];

/**
 * Preset configurations for the Playground chapter.
 */
export const PRESETS = [
    {
        label: '☀️ Summer Solstice 45°N',
        values: { latitude: 45, dayOfYear: 172, axialTilt: 23.44, timeOfDay: 12 },
        view: 'earth',
    },
    {
        label: '❄️ Winter Solstice 45°N',
        values: { latitude: 45, dayOfYear: 355, axialTilt: 23.44, timeOfDay: 12 },
        view: 'earth',
    },
    {
        label: '🌅 Midnight Sun 70°N',
        values: { latitude: 70, dayOfYear: 172, axialTilt: 23.44, timeOfDay: 0 },
        view: 'earth',
    },
    {
        label: '🌑 Lunar Eclipse',
        values: { lunarInclination: 0, moonPosition: 14.8, shadowCones: true },
        view: 'space',
    },
    {
        label: '🌘 Solar Eclipse',
        values: { lunarInclination: 0, moonPosition: 0, shadowCones: true },
        view: 'space',
    },
    {
        label: '∞ Analemma',
        values: { latitude: 45, analemmaTrail: true, eccentricity: 0.0167, axialTilt: 23.44 },
        view: 'earth',
    },
    {
        label: '🌐 Max Tilt (45°)',
        values: { axialTilt: 45, latitude: 45, dayOfYear: 172 },
        view: 'earth',
    },
];

// --- Card UI Management ---

let currentChapter = null;
let currentCardIndex = 0;
let onCardChangeCallback = null;
let onChapterChangeCallback = null;

/**
 * Register callback for when a card changes.
 * @param {Function} fn  Called with (chapter, cardIndex, card)
 */
export function onCardChange(fn) {
    onCardChangeCallback = fn;
}

/**
 * Register callback for when a chapter changes.
 * @param {Function} fn  Called with (chapter)
 */
export function onChapterChange(fn) {
    onChapterChangeCallback = fn;
}

/**
 * Navigate to a chapter and show its first card.
 */
export function goToChapter(chapterIdOrIndex, targetCardIndex = 0) {
    const chapter = typeof chapterIdOrIndex === 'number'
        ? CHAPTERS.find(c => c.id === chapterIdOrIndex) || CHAPTERS[chapterIdOrIndex]
        : CHAPTERS.find(c => String(c.id) === String(chapterIdOrIndex));
    if (!chapter) return;

    currentChapter = chapter;
    currentCardIndex = targetCardIndex < 0 ? Math.max(0, chapter.cards.length - 1) : Math.min(targetCardIndex, chapter.cards.length - 1);

    // Update sidebar active state
    document.querySelectorAll('.chapter-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.chapterId) === chapter.id);
    });

    if (onChapterChangeCallback) {
        onChapterChangeCallback(chapter);
    }

    showCard(currentCardIndex);
}

/**
 * Show a specific card in the current chapter.
 */
export function showCard(index) {
    if (!currentChapter) return;
    if (index < 0 || index >= currentChapter.cards.length) return;

    currentCardIndex = index;
    const card = currentChapter.cards[index];
    const container = document.getElementById('card-container');

    // Remove existing cards with animation
    const existingCards = container.querySelectorAll('.overlay-card');
    existingCards.forEach(existing => {
        existing.classList.add('exiting');
        setTimeout(() => existing.remove(), 250);
    });

    // Create new card after exit animation
    setTimeout(() => {
        const cardEl = document.createElement('div');
        cardEl.className = 'overlay-card';

        const isFirstCardInFirstChapter = index === 0 && currentChapter.id === 0;
        const isLast = index === currentChapter.cards.length - 1;

        cardEl.innerHTML = `
            <div class="card-header">
                <span class="card-title">${card.title}</span>
                <button class="card-collapse" aria-label="Collapse card">▼</button>
            </div>
            <div class="card-body">${card.body}</div>
            <div class="card-footer">
                <button class="card-prev-btn" ${isFirstCardInFirstChapter ? 'disabled style="opacity:0.3; cursor:default;"' : ''}>← Prev</button>
                <span class="card-progress">${index + 1} / ${currentChapter.cards.length}</span>
                <button class="card-next-btn">${isLast ? 'Explore ↓' : 'Next →'}</button>
            </div>
        `;

        // Collapse button
        const collapseBtn = cardEl.querySelector('.card-collapse');
        collapseBtn.addEventListener('click', () => {
            cardEl.classList.toggle('collapsed');
            collapseBtn.innerHTML = cardEl.classList.contains('collapsed') ? '▲' : '▼';
        });

        // Prev button
        cardEl.querySelector('.card-prev-btn').addEventListener('click', () => {
            if (isFirstCardInFirstChapter) return;
            if (index > 0) {
                showCard(index - 1);
            } else {
                const prevChapterId = currentChapter.id - 1;
                if (CHAPTERS.some(c => c.id === prevChapterId)) {
                    goToChapter(prevChapterId, -1);
                }
            }
        });

        // Next button
        cardEl.querySelector('.card-next-btn').addEventListener('click', () => {
            if (isLast) {
                cardEl.classList.add('collapsed');
                collapseBtn.innerHTML = '▲';
            } else {
                showCard(index + 1);
            }
        });

        // Set to scale toggle (if present)
        const scaleToggle = cardEl.querySelector('.set-to-scale-toggle');
        if (scaleToggle) {
            scaleToggle.addEventListener('change', (e) => {
                window.dispatchEvent(new CustomEvent('setToScale', { detail: e.target.checked }));
            });
        }

        container.appendChild(cardEl);

        // Trigger card change callback
        if (onCardChangeCallback) {
            onCardChangeCallback(currentChapter, index, card);
        }
    }, existingCards.length > 0 ? 280 : 0);
}

/**
 * Build the sidebar chapter list.
 */
export function buildSidebar() {
    const list = document.getElementById('chapter-list');
    list.innerHTML = '';

    for (const chapter of CHAPTERS) {
        const li = document.createElement('li');
        li.className = 'chapter-item';
        li.dataset.chapterId = chapter.id;
        li.innerHTML = `
            <span class="chapter-number">${chapter.id < 6 ? String(chapter.id).padStart(2, '0') : '★'}</span>
            <span class="chapter-label">${chapter.title}</span>
        `;
        li.addEventListener('click', () => goToChapter(chapter.id));
        list.appendChild(li);
    }
}

/**
 * Build preset buttons for the Playground chapter.
 */
export function buildPresets(container, controlManager, switchViewFn) {
    container.innerHTML = '';
    for (const preset of PRESETS) {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.textContent = preset.label;
        btn.addEventListener('click', () => {
            for (const [key, val] of Object.entries(preset.values)) {
                controlManager.setValue(key, val);
            }
            if (preset.view && switchViewFn) {
                switchViewFn(preset.view);
            }
        });
        container.appendChild(btn);
    }
}
