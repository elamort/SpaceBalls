/**
 * analemma.js — Equation of time computation and EoT graph overlay
 */

/**
 * Compute the Equation of Time for a given day of year.
 * Returns offset in minutes (positive = sun ahead of clock).
 * Uses the standard approximation decomposed into obliquity and eccentricity components.
 *
 * @param {number} dayOfYear  0-365
 * @param {number} eccentricity  ~0.0167
 * @param {number} axialTilt  degrees (~23.44)
 * @returns {{ total: number, obliquity: number, eccentricity: number }} in minutes
 */
export function computeEquationOfTime(dayOfYear, eccentricity = 0.0167, axialTilt = 23.44) {
    const D = dayOfYear;
    const B = (2 * Math.PI * (D - 81)) / 365;
    const tiltRad = axialTilt * Math.PI / 180;

    // Obliquity component (due to tilt)
    const obliquityComp = -9.87 * Math.sin(2 * B); // Simplified

    // Eccentricity component (due to elliptical orbit)
    // Scale by eccentricity relative to Earth's real value
    const eccScale = eccentricity / 0.0167;
    const eccComp = (7.53 * Math.cos(B) + 1.5 * Math.sin(B)) * eccScale;

    // Total EoT
    const total = obliquityComp + eccComp;

    return {
        total,
        obliquity: obliquityComp,
        eccentricity: eccComp,
    };
}

/**
 * Render the EoT graph on a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {number} currentDay  Current day of year (for marker)
 * @param {number} eccentricity
 * @param {number} axialTilt
 */
export function renderEoTGraph(canvas, currentDay, eccentricity, axialTilt) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(6, 10, 20, 0.5)';
    ctx.fillRect(0, 0, W, H);

    const padL = 40, padR = 10, padT = 10, padB = 30;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    // Horizontal zero line
    const zeroY = padT + plotH / 2;
    ctx.beginPath();
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(padL + plotW, zeroY);
    ctx.stroke();

    // Vertical lines for months
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
    const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    for (let i = 0; i < 12; i++) {
        const x = padL + (monthStarts[i] / 365) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + plotH);
        ctx.stroke();
        ctx.fillText(months[i], x + ((i < 11 ? monthStarts[i + 1] : 365) - monthStarts[i]) / 365 * plotW / 2, padT + plotH + 14);
    }

    // Y-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    for (const mins of [-15, -10, -5, 0, 5, 10, 15]) {
        const y = zeroY - (mins / 17) * (plotH / 2);
        ctx.fillText(`${mins}m`, padL - 4, y + 3);
        if (mins !== 0) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx.moveTo(padL, y);
            ctx.lineTo(padL + plotW, y);
            ctx.stroke();
        }
    }

    // Compute and plot
    const maxMins = 17;

    function dayToX(d) { return padL + (d / 365) * plotW; }
    function minsToY(m) { return zeroY - (m / maxMins) * (plotH / 2); }

    // Plot total EoT
    ctx.beginPath();
    ctx.strokeStyle = '#ffab00';
    ctx.lineWidth = 2;
    for (let d = 0; d <= 365; d++) {
        const { total } = computeEquationOfTime(d, eccentricity, axialTilt);
        const x = dayToX(d);
        const y = minsToY(total);
        if (d === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Plot obliquity component (dashed)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let d = 0; d <= 365; d++) {
        const { obliquity } = computeEquationOfTime(d, eccentricity, axialTilt);
        const x = dayToX(d);
        const y = minsToY(obliquity);
        if (d === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot eccentricity component (dotted)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(105, 240, 174, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    for (let d = 0; d <= 365; d++) {
        const { eccentricity: ecc } = computeEquationOfTime(d, eccentricity, axialTilt);
        const x = dayToX(d);
        const y = minsToY(ecc);
        if (d === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Current day marker
    if (currentDay >= 0 && currentDay <= 365) {
        const { total } = computeEquationOfTime(currentDay, eccentricity, axialTilt);
        const cx = dayToX(currentDay);
        const cy = minsToY(total);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffab00';
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 171, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.moveTo(cx, padT);
        ctx.lineTo(cx, padT + plotH);
        ctx.stroke();
    }

    // Legend
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'left';
    const legendX = padL + 8;
    let legendY = padT + 14;
    ctx.fillStyle = '#ffab00';
    ctx.fillRect(legendX, legendY - 4, 12, 2);
    ctx.fillText('Total EoT', legendX + 16, legendY);
    legendY += 14;
    ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.fillRect(legendX, legendY - 4, 12, 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('Obliquity', legendX + 16, legendY);
    legendY += 14;
    ctx.fillStyle = 'rgba(105, 240, 174, 0.4)';
    ctx.fillRect(legendX, legendY - 4, 12, 2);
    ctx.fillStyle = '#69f0ae';
    ctx.fillText('Eccentricity', legendX + 16, legendY);
}
