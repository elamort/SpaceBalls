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
            showMoon: false,
            showEclipticPlane: false,
            showNodeLine: false,
            showShadowCones: false,
            cameraPos: { x: 0, y: 35, z: 50 },
            defaults: { axialTilt: 0, dayOfYear: 172, eccentricity: 0, lunarInclination: 0 },
        },
        cards: [
            {
                title: 'Welcome to TimeOrbit',
                body: `<p>Have you ever wondered <strong>why</strong> a day is 24 hours, a month is about 30 days, or a year has seasons?</p>
                       <p>This interactive platform visually explains the astronomical mechanics behind our units of time. You'll learn by doing!</p>`,
                sceneState: { view: 'space' },
            },
            {
                title: 'How to Navigate',
                body: `<p><strong>Space View:</strong> You are currently floating in space. <strong>Right-Click and drag</strong> to pan around. Left-Click to rotate, and Scroll to zoom.</p>
                       <p><strong>Earth View:</strong> Later, you will switch to Earth View to see what the sky looks like from the surface. In Earth View, you can look around but cannot pan.</p>
                       <p>Use the <strong>Controls Panel</strong> at the bottom to manipulate the cosmos. Try dragging the <strong>Time of Day</strong> dial to spin the Earth, or the <strong>Day of Year</strong> dial to move it along its orbit!</p>`,
                sceneState: { view: 'space' },
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
            showMoon: false,
            showEclipticPlane: false,
            showNodeLine: false,
            showShadowCones: false,
            cameraPos: { x: 0, y: 20, z: 35 },
            defaults: { axialTilt: 0, dayOfYear: 172, eccentricity: 0, lunarInclination: 0 },
        },
        cards: [
            {
                title: 'What is a Day?',
                body: `<p>A <strong>day</strong> is the most fundamental unit of time we experience. But what actually causes it?</p>
                       <p>Before you is a simple model: the <em>Sun</em> (center) and the <em>Earth</em> orbiting it. For now, the orbit is perfectly circular, and Earth has no axial tilt.</p>
                       <p>Let's explore what happens when Earth <strong>spins on its axis</strong>.</p>`,
                sceneState: { view: 'space' },
            },
            {
                title: 'Earth\'s Rotation',
                body: `<p>Earth completes one full rotation every <strong>24 hours</strong>. This rotation is what creates the cycle of day and night.</p>
                       <p>Try the <em>Time of Day</em> slider — watch Earth spin! The red dot on Earth's surface represents an observer.</p>
                       <p>When the observer faces the Sun → daytime. When they face away → nighttime.</p>`,
                sceneState: { view: 'space', highlight: 'timeOfDay' },
            },
            {
                title: 'The Sun Across the Sky',
                body: `<p>Now switch to <em>Earth View</em> using the toggle above. You're now standing on Earth, looking up at the sky dome.</p>
                       <p>The <em>golden arc</em> traces the Sun's path across the sky during one full day. The <em>green ring</em> is the horizon.</p>
                       <p>Drag the <em>Time of Day</em> slider and watch the Sun move along its arc!</p>`,
                sceneState: { view: 'earth' },
            },
            {
                title: 'Sunrise & Sunset',
                body: `<p>Where the Sun's arc <strong>crosses the horizon</strong>, that's sunrise (🟡) and sunset (🔴).</p>
                       <p>With no axial tilt and a circular orbit, every day is <strong>exactly 12 hours</strong> of sunlight everywhere on Earth. The Sun rises due East and sets due West.</p>
                       <p>But real Earth isn't this simple…</p>`,
                sceneState: { view: 'earth' },
            },
            {
                title: 'Latitude Matters',
                body: `<p>Try moving the <em>Latitude</em> slider. At the equator (0°), the Sun passes directly overhead. At higher latitudes, it takes a lower arc.</p>
                       <p>Even without tilt, latitude changes the <strong>angle</strong> of the Sun's path — but not the <strong>length</strong> of the day (still 12h everywhere).</p>
                       <p>That changes when we add Earth's tilt. Ready for Chapter 2?</p>`,
                sceneState: { view: 'earth', highlight: 'latitude' },
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
                       <p>The faint disc you see is the <em>ecliptic plane</em> — the plane of Earth's orbit. Notice how Earth's axis pokes out at an angle to it.</p>
                       <p>Try the <em>Axial Tilt</em> slider to see what different tilts would look like!</p>`,
                sceneState: { view: 'space', highlight: 'axialTilt' },
            },
            {
                title: 'Summer Solstice',
                body: `<p>Set <em>Day of Year</em> to ~172 (June 21). The North Pole tilts <strong>toward</strong> the Sun.</p>
                       <p>Switch to <em>Earth View</em> — the Sun's arc is HIGH in the sky and very long. At 45°N, you get about <strong>15 hours</strong> of daylight!</p>
                       <p>This is the longest day of the year in the Northern Hemisphere.</p>`,
                sceneState: { view: 'earth', setValues: { dayOfYear: 172, latitude: 45 } },
            },
            {
                title: 'Winter Solstice',
                body: `<p>Now try <em>Day of Year</em> ~355 (December 21). The North Pole tilts <strong>away</strong> from the Sun.</p>
                       <p>In Earth View, the Sun barely climbs above the horizon. Only about <strong>9 hours</strong> of weak sunlight at 45°N. This is winter.</p>
                       <p>Notice how sunrise and sunset positions shift along the horizon!</p>`,
                sceneState: { view: 'earth', setValues: { dayOfYear: 355, latitude: 45 } },
            },
            {
                title: 'Equinox',
                body: `<p>At <em>Day ~80</em> (March 21) and <em>Day ~266</em> (September 23), Earth's tilt is sideways relative to the Sun.</p>
                       <p>Result: <strong>equal day and night</strong> everywhere on Earth (equi-nox = "equal night"). The Sun rises due East and sets due West.</p>`,
                sceneState: { view: 'earth', setValues: { dayOfYear: 80 } },
            },
            {
                title: 'Polar Extremes',
                body: `<p>Set latitude to <strong>70°N</strong> and scrub through the year. At the summer solstice, the Sun <em>never sets</em> — this is the <strong>midnight Sun</strong>!</p>
                       <p>At the winter solstice, the Sun <em>never rises</em> — <strong>polar night</strong>.</p>
                       <p>The Arctic and Antarctic circles (66.56°) are the boundaries where this occurs.</p>`,
                sceneState: { view: 'earth', setValues: { latitude: 70, dayOfYear: 172 } },
            },
            {
                title: 'The Tropics',
                body: `<p>At <strong>23.44°N</strong> (Tropic of Cancer), the Sun passes <em>directly overhead</em> at noon on the summer solstice.</p>
                       <p>At <strong>23.44°S</strong> (Tropic of Capricorn), the same happens on the December solstice.</p>
                       <p>Between the tropics, the Sun can be directly overhead twice per year!</p>
                       <p>Try the <em>Day of Year</em> slider and watch the seasons change. 🔄</p>`,
                sceneState: { view: 'earth', setValues: { latitude: 23.44, dayOfYear: 172 }, highlight: 'dayOfYear' },
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
                body: `<p>A <strong>month</strong> comes from the word "Moon." The Moon takes about <strong>29.5 days</strong> to go from one New Moon to the next — this is the <em>synodic period</em>.</p>
                       <p>Look at the scene — the Moon now orbits Earth. For now, its orbit is in the same plane as Earth's orbit (the ecliptic).</p>`,
                sceneState: { view: 'space' },
            },
            {
                title: 'New Moon',
                body: `<p>Set <em>Moon Phase</em> to <strong>0</strong>. The Moon is between Earth and the Sun.</p>
                       <p>The lit side of the Moon faces the Sun — which means it faces <em>away</em> from us. We see the dark side. This is a <strong>New Moon</strong>.</p>
                       <p>In real life, the Moon is invisible during this phase.</p>`,
                sceneState: { view: 'space', setValues: { moonPosition: 0 } },
            },
            {
                title: 'Full Moon',
                body: `<p>Set <em>Moon Phase</em> to <strong>~14.8</strong> (halfway). Now the Moon is on the <em>opposite</em> side of Earth from the Sun.</p>
                       <p>Sunlight fully illuminates the face we see — a <strong>Full Moon</strong>! Notice how the entire lit hemisphere faces Earth.</p>`,
                sceneState: { view: 'space', setValues: { moonPosition: 14.8 } },
            },
            {
                title: 'Quarter Phases',
                body: `<p>At <em>~7.4 days</em> (First Quarter) and <em>~22.1 days</em> (Last Quarter), the Moon is at 90° to the Sun-Earth line.</p>
                       <p>We see exactly <strong>half</strong> of the lit face — a half-moon! Try these values and observe from both Space and Earth View.</p>`,
                sceneState: { view: 'space', setValues: { moonPosition: 7.4 }, highlight: 'moonPosition' },
            },
            {
                title: 'Moon in the Sky',
                body: `<p>Switch to <em>Earth View</em>. The Moon appears on the sky dome with the correct phase!</p>
                       <p>At <strong>Full Moon</strong>, it rises as the Sun sets (opposite side of sky). At <strong>New Moon</strong>, it's near the Sun and invisible.</p>
                       <p>Drag the Moon Phase slider and watch both the phase and sky position change together. This is why "month" = "Moon"! 🌓</p>`,
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
                title: 'Why Not Every Month?',
                body: `<p>If the Moon orbits Earth, and eclipses happen when the Sun-Earth-Moon align… why don't we get eclipses <em>every</em> New and Full Moon?</p>
                       <p>The answer: the Moon's orbit is <strong>tilted ~5.14°</strong> relative to Earth's orbital plane. See how the Moon's path isn't flat?</p>`,
                sceneState: { view: 'space', highlight: 'lunarInclination' },
            },
            {
                title: 'If There Were No Tilt…',
                body: `<p>Set <em>Lunar Inclination</em> to <strong>0°</strong>. Now the Moon orbits in the ecliptic plane.</p>
                       <p>Move the <em>Moon Phase</em> to ~14.8 (full moon) — the shadow cones show a perfect <strong>lunar eclipse</strong>! At phase ~0 (new moon) — <strong>solar eclipse</strong>!</p>
                       <p>With no tilt, we'd have eclipses <em>every</em> month. But reality is different…</p>`,
                sceneState: { view: 'space', setValues: { lunarInclination: 0, moonPosition: 14.8 } },
            },
            {
                title: 'The Tilted Orbit',
                body: `<p>Set <em>Lunar Inclination</em> back to <strong>5.14°</strong>. Now at most moon phases, the Moon passes <em>above</em> or <em>below</em> the shadow cones.</p>
                       <p>The <em>red line</em> shows the <strong>line of nodes</strong> — where the Moon's orbit crosses the ecliptic plane. Eclipses can only happen near these crossing points!</p>`,
                sceneState: { view: 'space', setValues: { lunarInclination: 5.14, moonPosition: 14.8 } },
            },
            {
                title: 'Solar Eclipse',
                body: `<p>A <strong>solar eclipse</strong> occurs when the Moon's shadow falls on Earth. This requires:</p>
                       <p>1. <strong>New Moon</strong> (Moon between Earth and Sun)<br>
                       2. Moon near a <strong>node</strong> (crossing the ecliptic)</p>
                       <p>The dark cone from the Moon must reach Earth's surface. Try setting inclination to ~0° and phase to ~0 to see it!</p>`,
                sceneState: { view: 'space', setValues: { lunarInclination: 0, moonPosition: 0 } },
            },
            {
                title: 'Lunar Eclipse',
                body: `<p>A <strong>lunar eclipse</strong> occurs when the Moon passes through Earth's shadow. This requires:</p>
                       <p>1. <strong>Full Moon</strong> (Moon opposite the Sun)<br>
                       2. Moon near a <strong>node</strong></p>
                       <p>The wider, fainter cone is the <em>penumbra</em> (partial shadow); the darker inner cone is the <em>umbra</em> (total shadow).</p>
                       <p>In reality, eclipses happen only 2-5 times per year! 🌑</p>`,
                sceneState: { view: 'space', setValues: { lunarInclination: 0, moonPosition: 14.8 } },
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
                title: 'Is Every Day the Same?',
                body: `<p>We've been assuming a circular orbit, but Earth's orbit is actually an <strong>ellipse</strong> — slightly egg-shaped.</p>
                       <p>Look at the orbit path — with the <em>Eccentricity</em> slider, you can see how the circle becomes an ellipse. The Sun isn't at the center; it's at one <strong>focus</strong>.</p>`,
                sceneState: { view: 'space', highlight: 'eccentricity' },
            },
            {
                title: 'Kepler\'s Second Law',
                body: `<p>Planets move <strong>faster</strong> when closer to the Sun (perihelion, ~January) and <strong>slower</strong> when farther (aphelion, ~July).</p>
                       <p>This means the Sun's apparent speed across the sky isn't constant. Some days, solar noon arrives a bit early; other days, a bit late.</p>`,
                sceneState: { view: 'space', setValues: { eccentricity: 0.0167 } },
            },
            {
                title: 'The Equation of Time',
                body: `<p>Two effects combine to make solar noon drift:</p>
                       <p>1. <em>Eccentricity</em> — varying orbital speed<br>
                       2. <em>Obliquity</em> (axial tilt) — the Sun's path along the ecliptic projects non-uniformly onto the equator</p>
                       <p>Toggle the <em>EoT Graph</em> to see both components and their total. The Sun can be up to <strong>16 minutes</strong> ahead or behind the clock!</p>`,
                sceneState: { view: 'space', setValues: { eotGraph: true }, highlight: 'eotGraph' },
            },
            {
                title: 'The Analemma',
                body: `<p>Switch to <em>Earth View</em> and toggle <em>Analemma</em> on. This shows where the Sun is at the <strong>same clock time each day</strong> throughout the year.</p>
                       <p>The result is a beautiful <strong>figure-8</strong> pattern! The vertical spread comes from the changing seasons (declination). The horizontal drift comes from the Equation of Time.</p>`,
                sceneState: { view: 'earth', setValues: { analemmaTrail: true }, highlight: 'analemmaTrail' },
            },
            {
                title: 'Sundial vs. Clock',
                body: `<p>A sundial measures <em>apparent solar time</em> — where the Sun actually is. A clock measures <em>mean solar time</em> — a perfectly averaged day.</p>
                       <p>The Equation of Time is the difference between the two. It's why sundials and clocks don't always agree!</p>
                       <p>This completes our journey through the origins of time units. Head to the <strong>Playground</strong> to explore freely! 🌌</p>`,
                sceneState: { view: 'earth' },
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
                           <span class="surface-label" style="margin-left:8px;">Set models to (more) realistic scale</span>
                       </label>
                       <p>Try the <strong>play</strong> button to watch time flow.</p>
                       <p>Some things to try:</p>
                       <p>• Midnight Sun at 70°N in June<br>
                       • A lunar eclipse (inclination → 0°, phase → 14.8)<br>
                       • The analemma at different latitudes<br>
                       • Maximum tilt (45°) — what happens to the seasons?</p>`,
                sceneState: { view: 'space' },
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
export function goToChapter(chapterIdOrIndex) {
    const chapter = typeof chapterIdOrIndex === 'number'
        ? CHAPTERS.find(c => c.id === chapterIdOrIndex) || CHAPTERS[chapterIdOrIndex - 1]
        : CHAPTERS.find(c => c.id === chapterIdOrIndex);
    if (!chapter) return;

    currentChapter = chapter;
    currentCardIndex = 0;

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

    // Remove existing card with animation
    const existing = container.querySelector('.overlay-card');
    if (existing) {
        existing.classList.add('exiting');
        setTimeout(() => existing.remove(), 250);
    }

    // Create new card after exit animation
    setTimeout(() => {
        const cardEl = document.createElement('div');
        cardEl.className = 'overlay-card';

        const isLast = index === currentChapter.cards.length - 1;

        cardEl.innerHTML = `
            <div class="card-header">
                <span class="card-title">${card.title}</span>
                <button class="card-dismiss" aria-label="Dismiss card">&times;</button>
            </div>
            <div class="card-body">${card.body}</div>
            <div class="card-footer">
                <span class="card-progress">${index + 1} / ${currentChapter.cards.length}</span>
                <button class="card-next-btn">${isLast ? 'Explore ↓' : 'Next →'}</button>
            </div>
        `;

        // Dismiss button
        cardEl.querySelector('.card-dismiss').addEventListener('click', () => {
            cardEl.classList.add('exiting');
            setTimeout(() => cardEl.remove(), 250);
        });

        // Next button
        cardEl.querySelector('.card-next-btn').addEventListener('click', () => {
            if (isLast) {
                const nextChapterId = currentChapter.id + 1;
                if (CHAPTERS.some(c => c.id === nextChapterId)) {
                    goToChapter(nextChapterId);
                } else {
                    cardEl.classList.add('exiting');
                    setTimeout(() => cardEl.remove(), 250);
                }
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
    }, existing ? 280 : 0);
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
            <span class="chapter-icon">${chapter.icon}</span>
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
