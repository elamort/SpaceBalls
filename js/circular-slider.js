/**
 * circular-slider.js — Custom SVG-based circular dial for angular controls
 */

export class CircularSlider {
    constructor(container, def, initialValue, onChange) {
        this.container = container;
        this.def = def;
        this.value = initialValue !== undefined ? initialValue : def.defaultVal;
        this.onChange = onChange;

        this.isDragging = false;
        this._buildUI();
    }

    _buildUI() {
        this.container.innerHTML = '';
        this.container.classList.add('circular-slider-container');
        this.container.id = `ctrl-container-${this.def.id}`; // added for reference

        // Create label
        const label = document.createElement('div');
        label.className = 'circular-slider-label';
        label.textContent = this.def.label;
        this.container.appendChild(label);

        const size = 76; // Slightly larger to fit content
        const strokeWidth = 5;
        const radius = (size - strokeWidth) / 2;
        this.radius = radius;
        this.center = size / 2;

        const svgContainer = document.createElement('div');
        svgContainer.className = 'circular-slider-svg-container';
        this.container.appendChild(svgContainer);

        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.setAttribute('class', 'circular-slider-svg');

        // Track circle
        const track = document.createElementNS(ns, 'circle');
        track.setAttribute('cx', this.center);
        track.setAttribute('cy', this.center);
        track.setAttribute('r', radius);
        track.setAttribute('class', 'circular-slider-track');
        svg.appendChild(track);

        // Value arc
        this.arc = document.createElementNS(ns, 'path');
        this.arc.setAttribute('class', 'circular-slider-arc');
        svg.appendChild(this.arc);

        // Thumb dot
        this.thumb = document.createElementNS(ns, 'circle');
        this.thumb.setAttribute('r', strokeWidth * 1.5);
        this.thumb.setAttribute('class', 'circular-slider-thumb');
        svg.appendChild(this.thumb);

        svgContainer.appendChild(svg);

        // Center content (value + buttons)
        const centerContent = document.createElement('div');
        centerContent.className = 'circular-slider-center-content';

        const btnMinus = document.createElement('button');
        btnMinus.className = 'circular-nudge-btn';
        btnMinus.innerHTML = '&minus;';
        btnMinus.addEventListener('click', (e) => { e.stopPropagation(); this.nudge(-1); });

        this.valDisplay = document.createElement('div');
        this.valDisplay.className = 'circular-slider-value';
        this.valDisplay.id = `val-${this.def.id}`;

        const btnPlus = document.createElement('button');
        btnPlus.className = 'circular-nudge-btn';
        btnPlus.innerHTML = '&plus;';
        btnPlus.addEventListener('click', (e) => { e.stopPropagation(); this.nudge(1); });

        centerContent.appendChild(btnMinus);
        centerContent.appendChild(this.valDisplay);
        centerContent.appendChild(btnPlus);
        svgContainer.appendChild(centerContent);

        // Events
        svg.addEventListener('mousedown', this._onPointerDown.bind(this));
        svg.addEventListener('touchstart', this._onPointerDown.bind(this), { passive: false });
        window.addEventListener('mousemove', this._onPointerMove.bind(this));
        window.addEventListener('touchmove', this._onPointerMove.bind(this), { passive: false });
        window.addEventListener('mouseup', this._onPointerUp.bind(this));
        window.addEventListener('touchend', this._onPointerUp.bind(this));

        this._updateVisuals();
    }

    _onPointerDown(e) {
        this.isDragging = true;
        this._updateFromEvent(e);
        e.preventDefault();
    }

    _onPointerMove(e) {
        if (!this.isDragging) return;
        this._updateFromEvent(e);
        e.preventDefault();
    }

    _onPointerUp(e) {
        this.isDragging = false;
    }

    _updateFromEvent(e) {
        const svgRect = this.container.querySelector('svg').getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - svgRect.left - this.center;
        const y = clientY - svgRect.top - this.center;

        // Calculate angle (0 is top, clockwise)
        let angle = Math.atan2(y, x) + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;

        // Map angle to value range
        const range = this.def.max - this.def.min;
        let val = this.def.min + (angle / (Math.PI * 2)) * range;

        // Step
        if (this.def.step) {
            val = Math.round(val / this.def.step) * this.def.step;
        }
        
        // Clamp
        if (val < this.def.min) val = this.def.min;
        if (val > this.def.max) val = this.def.max;

        // Snap points
        if (this.def.snapTo) {
            for (const snapVal of this.def.snapTo) {
                const threshold = (this.def.max - this.def.min) * 0.04; // 4% snap threshold
                if (Math.abs(val - snapVal) < threshold || Math.abs(val - (snapVal + range)) < threshold || Math.abs(val - (snapVal - range)) < threshold) {
                    val = snapVal;
                    break;
                }
            }
        }

        if (this.value !== val) {
            this.value = val;
            this._updateVisuals();
            this.onChange(val);
        }
    }

    nudge(direction) {
        let step = this.def.step || 1;
        let val = this.value + direction * step;
        
        // Step rounding to prevent floating point errors
        if (this.def.step) {
            val = Math.round(val / this.def.step) * this.def.step;
        }

        // Clamp
        if (val < this.def.min) val = this.def.min;
        if (val > this.def.max) val = this.def.max;

        if (this.value !== val) {
            this.value = val;
            this._updateVisuals();
            this.onChange(val);
        }
    }

    setValue(val) {
        this.value = val;
        this._updateVisuals();
    }

    _updateVisuals() {
        const range = this.def.max - this.def.min;
        const progress = (this.value - this.def.min) / range;
        
        let angle = progress * Math.PI * 2;
        // Adjust so 0 is at top
        angle -= Math.PI / 2;

        const x = this.center + this.radius * Math.cos(angle);
        const y = this.center + this.radius * Math.sin(angle);

        this.thumb.setAttribute('cx', x);
        this.thumb.setAttribute('cy', y);

        // Draw arc from top to current angle
        if (progress > 0 && progress < 1) {
            const startX = this.center;
            const startY = this.center - this.radius;
            const largeArc = progress > 0.5 ? 1 : 0;
            const d = `M ${startX} ${startY} A ${this.radius} ${this.radius} 0 ${largeArc} 1 ${x} ${y}`;
            this.arc.setAttribute('d', d);
        } else if (progress >= 1) {
            // Full circle arc
            this.arc.setAttribute('d', `M ${this.center} ${this.center - this.radius} A ${this.radius} ${this.radius} 0 1 1 ${this.center - 0.001} ${this.center - this.radius}`);
        } else {
            this.arc.setAttribute('d', '');
        }

        this.valDisplay.textContent = this._formatValue(this.value, this.def);
    }

    _formatValue(val, def) {
        if (def.id === 'latitude') {
            val = 90 * Math.cos(val * Math.PI / 180);
            return Math.round(val) + (def.unit || '');
        }
        if (def.id === 'timeOfDay') {
            const h = Math.floor(val);
            const m = Math.round((val - h) * 60);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }
        if (def.step < 1) {
            return val.toFixed(1) + (def.unit || '');
        }
        return Math.round(val) + (def.unit || '');
    }
}
