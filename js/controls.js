/**
 * controls.js — Declarative slider/toggle control system with progressive unlock
 */
import { CircularSlider } from './circular-slider.js';

// --- Control Definitions ---
export const CONTROL_DEFS = [
    // Chapter 0: Intro (Controls revealed early)
    { id: 'timeOfDay',      label: 'Time of Day',      type: 'circular', min: 0,    max: 24,   step: 0.05, defaultVal: 12,     unit: 'h',    chapter: 0, snapTo: [0, 6, 12, 18, 24] },
    { id: 'dayOfYear',      label: 'Day of Year',      type: 'circular', min: 0,    max: 365,  step: 1,    defaultVal: 1,      unit: 'd',    chapter: 0, snapTo: [80, 172, 264, 355] },
    { id: 'compassLabels',  label: 'Compass Labels',   type: 'toggle',   defaultVal: true,                                                   chapter: 0, isVisual: true, view: 'earth' },
    { id: 'sunSize',        label: 'Sun Size',         type: 'slider',   min: 0.5,  max: 5,    step: 0.5,  defaultVal: 1.0,    unit: 'x',    chapter: 0, isVisual: true },
    { id: 'moonSize',       label: 'Moon Size',        type: 'slider',   min: 0.5,  max: 5,    step: 0.5,  defaultVal: 2.0,    unit: 'x',    chapter: 0, isVisual: true },

    // Chapter 1: The Day
    { id: 'latitude',       label: 'Latitude',         type: 'circular', min: 0,    max: 360,  step: 1,    defaultVal: 90,     unit: '°',    chapter: 1, snapTo: [0, 90, 180, 270], symmetricMapping: true },

    // Chapter 2: The Seasons
    { id: 'axialTilt',      label: 'Axial Tilt',       type: 'circular', min: 0,    max: 360,  step: 0.5,  defaultVal: 23.44,  unit: '°',    chapter: 2, snapTo: [0, 23.44, 45, 90, 180, 270, 360] },

    // Chapter 3: Moon and Months
    { id: 'moonPosition',   label: 'Moon Position',    type: 'circular', min: 0,    max: 29.53,step: 0.1,  defaultVal: 18,     unit: 'd',    chapter: 3, snapTo: [0, 7.38, 14.76, 22.15] },
    { id: 'moonTrailLength',label: 'Trail Length',     type: 'slider',   min: 24,   max: 708,  step: 12,   defaultVal: 36,     unit: 'h',    chapter: 3, isVisual: true, view: 'earth' },

    // Chapter 4: Eclipses
    { id: 'lunarInclination',label: 'Lunar Incl.',     type: 'circular', min: 0,    max: 180,  step: 0.1,  defaultVal: 5.14,   unit: '°',    chapter: 4, snapTo: [0, 5.14, 90, 180] },
    { id: 'shadowCones',    label: 'Shadow Cones',     type: 'toggle',   defaultVal: false,                                                  chapter: 4, isVisual: true, view: 'space' },
    { id: 'nodeLine',       label: 'Node Line',        type: 'toggle',   defaultVal: false,                                                  chapter: 4, isVisual: true, view: 'space' },

    // Chapter 5: Solar Time
    { id: 'eccentricity',   label: 'Eccentricity',     type: 'slider',   min: 0,    max: 0.8,  step: 0.001,defaultVal: 0.0167, unit: '',     chapter: 5 },
    { id: 'daysPerYear',    label: 'Days per Year',    type: 'slider',   min: -1,   max: 600,  step: 0.1,  defaultVal: 365.2,  unit: 'd',    chapter: 5, snapTo: [365.2] },
    { id: 'analemmaTrail',  label: 'Analemma',         type: 'toggle',   defaultVal: false,                                                  chapter: 5, isVisual: true, view: 'earth' },

];

// --- ControlManager ---
export class ControlManager {
    constructor() {
        this.values = {};
        this.listeners = {};
        this.currentChapter = 1;
        this.container = document.getElementById('controls-body');
        this.visualContainer = document.getElementById('visual-controls-body');
        this.circularControls = {};

        // Initialize default values
        for (const def of CONTROL_DEFS) {
            this.values[def.id] = def.defaultVal;
        }

        this._initResizer();
    }

    _initResizer() {
        const resizer = document.getElementById('panel-resizer');
        const visualSection = document.querySelector('.visual-controls-section');
        const bodyWrapper = document.querySelector('.control-panel-body-wrapper');
        
        if (!resizer || !visualSection || !bodyWrapper) return;

        let isDragging = false;

        resizer.addEventListener('mousedown', (e) => {
            isDragging = true;
            resizer.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const wrapperRect = bodyWrapper.getBoundingClientRect();
            // Width is from mouse position to the right edge
            let newWidth = wrapperRect.right - e.clientX;
            // Clamping constraints
            if (newWidth < 180) newWidth = 180;
            if (newWidth > wrapperRect.width - 250) newWidth = wrapperRect.width - 250;
            
            visualSection.style.width = newWidth + 'px';
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                resizer.classList.remove('dragging');
                document.body.style.cursor = '';
            }
        });
    }

    /**
     * Get the current value of a control.
     */
    getValue(id) {
        if (id === 'latitude' && typeof this.values[id] === 'number') {
            return 90 * Math.cos(this.values[id] * Math.PI / 180);
        }
        return this.values[id];
    }

    /**
     * Set a control value programmatically and update the UI.
     */
    setValue(id, value, silent = false) {
        if (id === 'latitude' && typeof value === 'number') {
            value = Math.acos(Math.max(-1, Math.min(1, value / 90))) * 180 / Math.PI;
        }
        this.values[id] = value;
        // Update the DOM element
        const el = document.getElementById(`ctrl-${id}`);
        if (el) {
            if (el.type === 'checkbox') {
                el.checked = !!value;
            } else {
                el.value = value;
            }
        }
        // Update circular slider if exists
        if (this.circularControls[id]) {
            this.circularControls[id].setValue(value);
        }
        if (id === 'daysPerYear') {
            const doyDef = CONTROL_DEFS.find(d => d.id === 'dayOfYear');
            if (doyDef) {
                const safeDays = value === 0 ? 365.24 : value;
                doyDef.max = Math.max(0.1, Math.abs(safeDays));
                const scale = Math.abs(safeDays) / 365.24;
                doyDef.snapTo = [80 * scale, 172 * scale, 264 * scale, 355 * scale];
                if (this.circularControls['dayOfYear']) {
                    this.circularControls['dayOfYear']._updateVisuals();
                }
            }
        }
        // Update value display
        const valEl = document.getElementById(`val-${id}`);
        if (valEl) {
            const def = CONTROL_DEFS.find(d => d.id === id);
            valEl.textContent = this._formatValue(value, def);
        }
        if (!silent) {
            this._emit(id, value);
        }
    }

    /**
     * Listen for changes on a specific control.
     */
    onChange(id, fn) {
        if (!this.listeners[id]) this.listeners[id] = [];
        this.listeners[id].push(fn);
    }

    /**
     * Listen for changes on any control.
     */
    onAnyChange(fn) {
        if (!this.listeners['*']) this.listeners['*'] = [];
        this.listeners['*'].push(fn);
    }

    _emit(id, value) {
        const fns = this.listeners[id] || [];
        for (const fn of fns) fn(value, id);
        const anyFns = this.listeners['*'] || [];
        for (const fn of anyFns) fn(value, id);
    }

    /**
     * Render controls for the given chapter (shows all controls up to and including this chapter).
     */
    renderForChapter(chapterNum, highlightNew = true) {
        this.currentChapter = chapterNum;
        this.container.innerHTML = '';
        if (this.visualContainer) this.visualContainer.innerHTML = '';
        this.circularControls = {};

        for (const def of CONTROL_DEFS) {
            if (def.chapter > chapterNum) continue;
            const isNew = highlightNew && def.chapter === chapterNum;
            this._renderControl(def, isNew);
        }
    }

    /**
     * Show or hide controls based on the active view ('space' or 'earth')
     */
    updateVisibilityForView(view) {
        for (const def of CONTROL_DEFS) {
            const el = (this.container && this.container.querySelector(`[data-control-id="${def.id}"]`)) ||
                       (this.visualContainer && this.visualContainer.querySelector(`[data-control-id="${def.id}"]`));
            if (el) {
                if (def.view && def.view !== view) {
                    el.style.display = 'none';
                } else {
                    el.style.display = '';
                }
            }
        }
    }

    _renderControl(def, isNew) {
        const group = document.createElement('div');
        group.className = 'control-group' + (isNew ? ' new-highlight' : '');
        group.dataset.controlId = def.id;

        if (def.type === 'circular') {
            const slider = new CircularSlider(group, def, this.values[def.id], (val) => {
                this.values[def.id] = val;
                this._emit(def.id, val);
            });
            this.circularControls[def.id] = slider;
        } else {
            const label = document.createElement('span');
            label.className = 'control-label';
            label.textContent = def.label;
            group.appendChild(label);

            if (def.type === 'slider') {
                const slider = document.createElement('input');
                slider.type = 'range';
                slider.className = 'control-slider';
                slider.id = `ctrl-${def.id}`;
                slider.min = def.min;
                slider.max = def.max;
                slider.step = def.step;
                slider.value = this.values[def.id];
                slider.addEventListener('input', () => {
                    const v = parseFloat(slider.value);
                    this.values[def.id] = v;
                    valSpan.textContent = this._formatValue(v, def);
                    this._emit(def.id, v);
                });

                const btnMinus = document.createElement('button');
                btnMinus.className = 'linear-nudge-btn';
                btnMinus.innerHTML = '&minus;';
                btnMinus.addEventListener('click', () => {
                    let v = parseFloat(slider.value) - def.step;
                    if (def.step) v = Math.round(v / def.step) * def.step;
                    if (v < def.min) v = def.min;
                    slider.value = v;
                    this.values[def.id] = v;
                    valSpan.textContent = this._formatValue(v, def);
                    this._emit(def.id, v);
                });
                group.appendChild(btnMinus);

                group.appendChild(slider);

                const btnPlus = document.createElement('button');
                btnPlus.className = 'linear-nudge-btn';
                btnPlus.innerHTML = '&plus;';
                btnPlus.addEventListener('click', () => {
                    let v = parseFloat(slider.value) + def.step;
                    if (def.step) v = Math.round(v / def.step) * def.step;
                    if (v > def.max) v = def.max;
                    slider.value = v;
                    this.values[def.id] = v;
                    valSpan.textContent = this._formatValue(v, def);
                    this._emit(def.id, v);
                });
                group.appendChild(btnPlus);

                const valSpan = document.createElement('span');
                valSpan.className = 'control-value';
                valSpan.id = `val-${def.id}`;
                valSpan.textContent = this._formatValue(this.values[def.id], def);
                group.appendChild(valSpan);

            } else if (def.type === 'toggle') {
                const toggleWrap = document.createElement('label');
                toggleWrap.className = 'control-toggle';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = `ctrl-${def.id}`;
                input.checked = !!this.values[def.id];
                input.addEventListener('change', () => {
                    this.values[def.id] = input.checked;
                    this._emit(def.id, input.checked);
                });
                const track = document.createElement('span');
                track.className = 'toggle-track';
                toggleWrap.appendChild(input);
                toggleWrap.appendChild(track);
                group.appendChild(toggleWrap);
            }
        }

        const targetContainer = def.isVisual && this.visualContainer ? this.visualContainer : this.container;
        targetContainer.appendChild(group);
    }

    _formatValue(val, def) {
        if (def.type === 'toggle') return '';
        if (def.id === 'latitude') {
            val = 90 * Math.cos(val * Math.PI / 180);
            return Math.round(val) + (def.unit || '');
        }
        if (def.id === 'timeOfDay') {
            const h = Math.floor(val);
            const m = Math.round((val - h) * 60);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }
        if (def.id === 'eccentricity') {
            return val.toFixed(3);
        }
        if (def.step < 1) {
            return val.toFixed(1) + (def.unit || '');
        }
        return Math.round(val) + (def.unit || '');
    }

    /**
     * Reset all controls to their default values.
     */
    resetToDefaults() {
        for (const def of CONTROL_DEFS) {
            this.setValue(def.id, def.defaultVal, true);
        }
    }
}
