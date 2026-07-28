/**
 * analemma.js — Equation of time computation
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
export function computeEquationOfTime(dayOfYear, eccentricity = 0.0167, axialTilt = 23.44, daysPerYear = 365.24) {
    const D = dayOfYear;
    const safeDays = daysPerYear === 0 ? 365.24 : daysPerYear;
    const absDays = Math.abs(safeDays);
    const eqOffset = 81 * (absDays / 365.24);
    const B = (2 * Math.PI * (D - eqOffset)) / absDays;
    const tiltRad = axialTilt * Math.PI / 180;

    // Obliquity component (due to tilt)
    // Coefficient is approx -229.18 * tan^2(tilt/2)
    const y = Math.pow(Math.tan(tiltRad / 2), 2);
    const obliquityComp = -229.18 * y * Math.sin(2 * B);

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
