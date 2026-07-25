/**
 * Chart Patterns Detection Module
 * Identifies significant astrological configurations in birth charts
 */

export interface Planet {
  name: string;
  longitude: number;
  sign: string;
  house?: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  angle: number;
  orb: number;
}

export interface ChartPattern {
  type:
    | "grand_trine"
    | "t_square"
    | "yod"
    | "stellium"
    | "grand_cross"
    | "kite"
    | "mystic_rectangle";
  planets: string[];
  signs?: string[];
  element?: string;
  strength: number; // 0-100, based on orb exactness
  description: string;
}

/**
 * Calculate angular distance between two longitudes (0-180°)
 */
function angularDistance(lon1: number, lon2: number): number {
  let diff = Math.abs(lon1 - lon2);
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

/**
 * Check if two planets form a specific aspect within orb
 */
function hasAspect(
  p1: Planet,
  p2: Planet,
  targetAngle: number,
  orb: number = 8
): boolean {
  const distance = angularDistance(p1.longitude, p2.longitude);
  return Math.abs(distance - targetAngle) <= orb;
}

/**
 * Get element for a zodiac sign
 */
function getElement(sign: string): string {
  const fireSigns = ["Aries", "Leo", "Sagittarius"];
  const earthSigns = ["Taurus", "Virgo", "Capricorn"];
  const airSigns = ["Gemini", "Libra", "Aquarius"];
  const waterSigns = ["Cancer", "Scorpio", "Pisces"];

  if (fireSigns.includes(sign)) return "Fire";
  if (earthSigns.includes(sign)) return "Earth";
  if (airSigns.includes(sign)) return "Air";
  if (waterSigns.includes(sign)) return "Water";
  return "Unknown";
}

/**
 * Calculate pattern strength based on orb exactness
 */
function calculateStrength(orbs: number[]): number {
  const avgOrb = orbs.reduce((sum, orb) => sum + orb, 0) / orbs.length;
  // Strength decreases as orb increases (max orb = 8°)
  return Math.max(0, Math.min(100, 100 - (avgOrb / 8) * 100));
}

/**
 * Detect Grand Trines (3 planets ~120° apart, same element)
 */
export function detectGrandTrines(planets: Planet[]): ChartPattern[] {
  const patterns: ChartPattern[] = [];
  const orb = 8;

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      for (let k = j + 1; k < planets.length; k++) {
        const p1 = planets[i];
        const p2 = planets[j];
        const p3 = planets[k];

        // Check if all three form trines (120°) with each other
        if (
          hasAspect(p1, p2, 120, orb) &&
          hasAspect(p2, p3, 120, orb) &&
          hasAspect(p1, p3, 120, orb)
        ) {
          const orbs = [
            Math.abs(angularDistance(p1.longitude, p2.longitude) - 120),
            Math.abs(angularDistance(p2.longitude, p3.longitude) - 120),
            Math.abs(angularDistance(p1.longitude, p3.longitude) - 120),
          ];

          const element = getElement(p1.sign);

          patterns.push({
            type: "grand_trine",
            planets: [p1.name, p2.name, p3.name],
            signs: [p1.sign, p2.sign, p3.sign],
            element,
            strength: calculateStrength(orbs),
            description: `Grand Trine in ${element} signs: ${p1.name} (${p1.sign}), ${p2.name} (${p2.sign}), ${p3.name} (${p3.sign}). This harmonious configuration indicates natural talent, ease, and flow in ${element.toLowerCase()} matters.`,
          });
        }
      }
    }
  }

  return patterns;
}

/**
 * Detect T-Squares (2 planets in opposition, both square a third planet)
 */
export function detectTSquares(planets: Planet[]): ChartPattern[] {
  const patterns: ChartPattern[] = [];
  const orb = 8;

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      // Check for opposition (180°)
      if (hasAspect(planets[i], planets[j], 180, orb)) {
        // Find planets that square both
        for (let k = 0; k < planets.length; k++) {
          if (k !== i && k !== j) {
            if (
              hasAspect(planets[i], planets[k], 90, orb) &&
              hasAspect(planets[j], planets[k], 90, orb)
            ) {
              const orbs = [
                Math.abs(
                  angularDistance(planets[i].longitude, planets[j].longitude) -
                    180
                ),
                Math.abs(
                  angularDistance(planets[i].longitude, planets[k].longitude) -
                    90
                ),
                Math.abs(
                  angularDistance(planets[j].longitude, planets[k].longitude) -
                    90
                ),
              ];

              patterns.push({
                type: "t_square",
                planets: [planets[i].name, planets[j].name, planets[k].name],
                signs: [planets[i].sign, planets[j].sign, planets[k].sign],
                strength: calculateStrength(orbs),
                description: `T-Square: ${planets[i].name} opposes ${planets[j].name}, both square ${planets[k].name}. This dynamic configuration creates tension, drive, and motivation for achievement through challenge.`,
              });
            }
          }
        }
      }
    }
  }

  return patterns;
}

/**
 * Detect Yods (Finger of God: 2 planets sextile, both quincunx a third)
 */
export function detectYods(planets: Planet[]): ChartPattern[] {
  const patterns: ChartPattern[] = [];
  const orb = 3; // Tight orb for Yods (Finger of God requires precision)

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      // Check for sextile (60°)
      if (hasAspect(planets[i], planets[j], 60, orb)) {
        // Find planets that quincunx (150°) both
        for (let k = 0; k < planets.length; k++) {
          if (k !== i && k !== j) {
            const dist1 = angularDistance(
              planets[i].longitude,
              planets[k].longitude
            );
            const dist2 = angularDistance(
              planets[j].longitude,
              planets[k].longitude
            );

            if (Math.abs(dist1 - 150) <= orb && Math.abs(dist2 - 150) <= orb) {
              const orbs = [
                Math.abs(
                  angularDistance(planets[i].longitude, planets[j].longitude) -
                    60
                ),
                Math.abs(
                  angularDistance(planets[i].longitude, planets[k].longitude) -
                    150
                ),
                Math.abs(
                  angularDistance(planets[j].longitude, planets[k].longitude) -
                    150
                ),
              ];

              patterns.push({
                type: "yod",
                planets: [planets[i].name, planets[j].name, planets[k].name],
                signs: [planets[i].sign, planets[j].sign, planets[k].sign],
                strength: calculateStrength(orbs),
                description: `Yod (Finger of God): ${planets[i].name} and ${planets[j].name} sextile, both quincunx ${planets[k].name}. This rare configuration points to a special destiny, karmic lessons, and a unique life purpose focused on ${planets[k].name}.`,
              });
            }
          }
        }
      }
    }
  }

  return patterns;
}

/**
 * Detect Stelliums (3+ planets in the same sign or within 10°)
 */
export function detectStelliums(planets: Planet[]): ChartPattern[] {
  const patterns: ChartPattern[] = [];
  const orb = 10;

  // Group planets by sign
  const signGroups: { [sign: string]: Planet[] } = {};
  for (const planet of planets) {
    if (!signGroups[planet.sign]) {
      signGroups[planet.sign] = [];
    }
    signGroups[planet.sign].push(planet);
  }

  // Check for 3+ planets in same sign
  for (const [sign, planetsInSign] of Object.entries(signGroups)) {
    if (planetsInSign.length >= 3) {
      // Verify they're within orb of each other
      const longitudes = planetsInSign
        .map(p => p.longitude)
        .sort((a, b) => a - b);
      const spread = longitudes[longitudes.length - 1] - longitudes[0];

      if (spread <= 30 + orb) {
        // Within one sign + orb
        const element = getElement(sign);
        const planetNames = planetsInSign.map(p => p.name);

        patterns.push({
          type: "stellium",
          planets: planetNames,
          signs: [sign],
          element,
          strength: 100 - (spread / 30) * 50, // Tighter = stronger
          description: `Stellium in ${sign} (${element}): ${planetNames.join(", ")}. This concentration of planetary energy creates intense focus, power, and emphasis on ${sign} themes in life.`,
        });
      }
    }
  }

  return patterns;
}

/**
 * Detect Grand Cross (4 planets forming 2 oppositions and 4 squares)
 */
export function detectGrandCrosses(planets: Planet[]): ChartPattern[] {
  const patterns: ChartPattern[] = [];
  const orb = 8;
  const seen = new Set<string>();

  // Iterate over all combinations of 4 planets
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      for (let k = j + 1; k < planets.length; k++) {
        for (let l = k + 1; l < planets.length; l++) {
          const indices = [i, j, k, l];
          // Check all 3 pairings of the 4 planets into two opposition pairs
          const oppositionPairings: [number, number, number, number][] = [
            [i, j, k, l],
            [i, k, j, l],
            [i, l, j, k],
          ];

          for (const [a, b, c, d] of oppositionPairings) {
            const dist_ab = angularDistance(
              planets[a].longitude,
              planets[b].longitude
            );
            const dist_cd = angularDistance(
              planets[c].longitude,
              planets[d].longitude
            );

            if (
              Math.abs(dist_ab - 180) <= orb &&
              Math.abs(dist_cd - 180) <= orb
            ) {
              // Both oppositions are valid — check that all 4 cross-squares are within orb
              const dist_ac = angularDistance(
                planets[a].longitude,
                planets[c].longitude
              );
              const dist_ad = angularDistance(
                planets[a].longitude,
                planets[d].longitude
              );
              const dist_bc = angularDistance(
                planets[b].longitude,
                planets[c].longitude
              );
              const dist_bd = angularDistance(
                planets[b].longitude,
                planets[d].longitude
              );

              if (
                Math.abs(dist_ac - 90) <= orb &&
                Math.abs(dist_ad - 90) <= orb &&
                Math.abs(dist_bc - 90) <= orb &&
                Math.abs(dist_bd - 90) <= orb
              ) {
                // Deduplicate by sorted planet names
                const key = indices
                  .map(x => planets[x].name)
                  .sort()
                  .join(",");
                if (!seen.has(key)) {
                  seen.add(key);
                  const orbs = [
                    Math.abs(dist_ab - 180),
                    Math.abs(dist_cd - 180),
                    Math.abs(dist_ac - 90),
                    Math.abs(dist_ad - 90),
                  ];
                  const names = indices.map(x => planets[x].name);
                  patterns.push({
                    type: "grand_cross",
                    planets: names,
                    signs: indices.map(x => planets[x].sign),
                    strength: calculateStrength(orbs),
                    description: `Grand Cross: ${names.join(", ")}. This powerful configuration creates maximum tension and challenge, demanding balance and integration of opposing forces.`,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return patterns;
}

/**
 * Detect all patterns in a birth chart
 */
export function detectAllPatterns(planets: Planet[]): ChartPattern[] {
  const allPatterns: ChartPattern[] = [];

  allPatterns.push(...detectGrandTrines(planets));
  allPatterns.push(...detectTSquares(planets));
  allPatterns.push(...detectYods(planets));
  allPatterns.push(...detectStelliums(planets));
  allPatterns.push(...detectGrandCrosses(planets));

  // Sort by strength (strongest first)
  allPatterns.sort((a, b) => b.strength - a.strength);

  return allPatterns;
}
