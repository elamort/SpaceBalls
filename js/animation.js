/**
 * animation.js — Play/pause, speed control, animation modes
 */

export class AnimationController {
    constructor(controlManager) {
        this.controls = controlManager;
        this.playing = false;
        this.speed = 10;         // multiplier
        this.direction = 1;      // 1 for forward, -1 for backward
        this.mode = 'day';       // 'day' or 'year'
        this.lastTime = null;

        this._initUI();
    }

    _initUI() {
        // Play/pause button
        this.playBtn = document.getElementById('btn-play-pause');
        this.playBtn.addEventListener('click', () => this.toggle());

        // Direction button
        this.dirBtn = document.getElementById('btn-direction');
        if (this.dirBtn) {
            this.dirBtn.addEventListener('click', () => {
                this.direction *= -1;
                this.dirBtn.textContent = this.direction === 1 ? '»' : '«';
            });
        }

        // Speed slider
        this.speedSlider = document.getElementById('speed-slider');
        this.speedLabel = document.getElementById('speed-label');
        
        const updateSpeed = () => {
            let val = parseFloat(this.speedSlider.value);
            const snapThreshold = 0.15;
            const nearestInt = Math.round(val);
            if (Math.abs(val - nearestInt) < snapThreshold) {
                val = nearestInt;
                this.speedSlider.value = val;
            }
            this.speed = Math.round(Math.pow(10, val));
            this.speedLabel.textContent = this.speed + '×';
        };

        this.speedSlider.addEventListener('input', updateSpeed);

        // Mode buttons
        document.getElementById('btn-mode-day').addEventListener('click', () => this.setMode('day'));
        document.getElementById('btn-mode-year').addEventListener('click', () => this.setMode('year'));
    }

    setMode(mode) {
        this.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('active');
    }

    setSpeed(speedMultiplier) {
        let val = Math.log10(speedMultiplier);
        this.speedSlider.value = val;
        this.speed = Math.round(speedMultiplier);
        this.speedLabel.textContent = this.speed + '×';
    }

    toggle() {
        this.playing = !this.playing;
        this.playBtn.textContent = this.playing ? '⏸' : '▶';
        this.playBtn.classList.toggle('playing', this.playing);
        if (this.playing) {
            this.lastTime = performance.now();
        }
    }

    play() {
        if (!this.playing) this.toggle();
    }

    pause() {
        if (this.playing) this.toggle();
    }

    /**
     * Called every frame. Advances sliders based on elapsed time and speed.
     * dt is in milliseconds.
     */
    tick(now) {
        if (!this.playing) {
            this.lastTime = null;
            return;
        }
        if (!this.lastTime) {
            this.lastTime = now;
            return;
        }
        const dtSec = (now - this.lastTime) / 1000;
        this.lastTime = now;

        const daysPerYear = this.controls.getValue('daysPerYear') ?? 365.24;
        const safeDays = daysPerYear === 0 ? 365.24 : daysPerYear;
        const absDays = Math.abs(safeDays);

        let deltaYears = 0;
        if (this.mode === 'year') {
            // 1x speed = 0.5 nominal days per real second (same physical speed as old logic)
            deltaYears = (dtSec * this.speed * 0.5 * this.direction) / absDays;
        } else if (this.mode === 'day') {
            // 1x speed = 0.5 hours of solar time per real second
            if (daysPerYear !== 0) {
                const deltaHours = dtSec * this.speed * 0.5 * this.direction;
                deltaYears = deltaHours / (daysPerYear * 24);
            } else {
                // Tidally locked: day mode falls back to moving the orbit slowly
                deltaYears = (dtSec * this.speed * 0.5 * this.direction) / (absDays * 24);
            }
        }

        // Apply to Orbital phase (dayOfYear)
        let doy = this.controls.getValue('dayOfYear');
        if (doy !== undefined) {
            doy += deltaYears * absDays;
            doy = ((doy % absDays) + absDays) % absDays;
            this.controls.setValue('dayOfYear', doy, true);
        }

        // Apply to Solar time (timeOfDay)
        let tod = this.controls.getValue('timeOfDay');
        if (tod !== undefined) {
            // If daysPerYear = 0, deltaHours = 0, freezing solar time for exact tidal locking.
            // If daysPerYear < 0, deltaHours is reversed, generating retrograde spin.
            const deltaHours = deltaYears * daysPerYear * 24;
            tod += deltaHours;
            tod = ((tod % 24) + 24) % 24;
            this.controls.setValue('timeOfDay', tod, true);
        }

        // Update Moon Phase
        let mp = this.controls.getValue('moonPosition');
        if (mp !== undefined) {
            const deltaDays = deltaYears * absDays;
            const monthsPerYear = this.controls.getValue('monthsPerYear') ?? 12.368;
            const mpPerDay = (monthsPerYear / absDays) * 29.53;
            mp += deltaDays * mpPerDay;
            mp = ((mp % 29.53) + 29.53) % 29.53;
            this.controls.setValue('moonPosition', mp, true);
        }
    }
}
