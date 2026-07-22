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

        let deltaHours = 0;
        if (this.mode === 'day') {
            // 1x = 0.5 hours per real second
            deltaHours = dtSec * this.speed * 0.5 * this.direction;
        } else if (this.mode === 'year') {
            // 1x = 0.5 days per real second = 12 hours per real second
            deltaHours = dtSec * this.speed * 12 * this.direction;
        }

        // Apply deltaHours to Time of Day
        let tod = this.controls.getValue('timeOfDay');
        tod += deltaHours;
        
        const deltaDays = deltaHours / 24;

        // Wrap tod
        tod = ((tod % 24) + 24) % 24;
        this.controls.setValue('timeOfDay', tod, true); // true = silent to prevent rebuild loops

        // Update Day of Year
        let doy = this.controls.getValue('dayOfYear');
        if (doy !== undefined) {
            doy += deltaDays;
            doy = ((doy % 365) + 365) % 365;
            this.controls.setValue('dayOfYear', doy, true);
        }

        // Update Moon Phase
        let mp = this.controls.getValue('moonPosition');
        if (mp !== undefined) {
            mp += deltaDays;
            mp = ((mp % 29.53) + 29.53) % 29.53;
            this.controls.setValue('moonPosition', mp, true);
        }
    }
}
