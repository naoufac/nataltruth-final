import SwissEph from "swisseph-wasm";

// Initialize Swiss Ephemeris instance
let sweInstance: SwissEph | null = null;

async function getSwissEph(): Promise<SwissEph> {
  if (!sweInstance) {
    sweInstance = new SwissEph();
    await sweInstance.initSwissEph();
  }
  return sweInstance;
}

// Planet constants
export const PLANETS = {
  SUN: 0, // SE_SUN
  MOON: 1, // SE_MOON
  MERCURY: 2, // SE_MERCURY
  VENUS: 3, // SE_VENUS
  MARS: 4, // SE_MARS
  JUPITER: 5, // SE_JUPITER
  SATURN: 6, // SE_SATURN
  URANUS: 7, // SE_URANUS
  NEPTUNE: 8, // SE_NEPTUNE
  PLUTO: 9, // SE_PLUTO
  NORTH_NODE: 11, // SE_TRUE_NODE
  CHIRON: 15, // SE_CHIRON
} as const;

export const PLANET_NAMES = {
  [PLANETS.SUN]: "Sun",
  [PLANETS.MOON]: "Moon",
  [PLANETS.MERCURY]: "Mercury",
  [PLANETS.VENUS]: "Venus",
  [PLANETS.MARS]: "Mars",
  [PLANETS.JUPITER]: "Jupiter",
  [PLANETS.SATURN]: "Saturn",
  [PLANETS.URANUS]: "Uranus",
  [PLANETS.NEPTUNE]: "Neptune",
  [PLANETS.PLUTO]: "Pluto",
  [PLANETS.NORTH_NODE]: "North Node",
  [PLANETS.CHIRON]: "Chiron",
} as const;

// House system constants
export const HOUSE_SYSTEMS = {
  PLACIDUS: "P",
  KOCH: "K",
  EQUAL: "E",
  WHOLE_SIGN: "W",
} as const;

/**
 * Ephemeris engine backends (swisseph-wasm flags).
 * SEFLG_SWIEPH = 2  — Swiss Ephemeris (high precision; premium default)
 * SEFLG_MOSEPH = 4  — Moshier semi-analytic (no external ephemeris files)
 * SEFLG_SPEED  = 256 — include speed (retrograde detection)
 */
export type EphemerisEngine = "swiss" | "moshier";

export const EPHEMERIS_FLAGS = {
  swiss: 2 | 256,
  moshier: 4 | 256,
} as const;

// Aspect types with orbs
export const ASPECTS = {
  CONJUNCTION: { angle: 0, orb: 8, name: "Conjunction" },
  OPPOSITION: { angle: 180, orb: 8, name: "Opposition" },
  TRINE: { angle: 120, orb: 8, name: "Trine" },
  SQUARE: { angle: 90, orb: 8, name: "Square" },
  SEXTILE: { angle: 60, orb: 6, name: "Sextile" },
  QUINCUNX: { angle: 150, orb: 3, name: "Quincunx" },
  SEMISEXTILE: { angle: 30, orb: 2, name: "Semi-Sextile" },
  SEMISQUARE: { angle: 45, orb: 2, name: "Semi-Square" },
  SESQUIQUADRATE: { angle: 135, orb: 2, name: "Sesquiquadrate" },
  QUINTILE: { angle: 72, orb: 2, name: "Quintile" },
  BIQUINTILE: { angle: 144, orb: 2, name: "Bi-Quintile" },
} as const;

// Zodiac signs
export const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export interface PlanetPosition {
  planet: string;
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  sign: string;
  signDegree: number;
  house: number;
  isRetrograde: boolean;
}

interface HouseCusp {
  house: number;
  longitude: number;
  sign: string;
  signDegree: number;
}

interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  angle: number;
  orb: number;
}

interface BirthChart {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  aspects: Aspect[];
  patterns: any[];
}

/**
 * Convert Date to Julian Day
 */
function dateToJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getUTCDate();
  const hour =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;

  // Julian day calculation
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jd =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  jd = jd + (hour - 12) / 24;

  return jd;
}

/**
 * Get zodiac sign from longitude
 */
function getZodiacSign(longitude: number): { sign: string; degree: number } {
  const signIndex = Math.floor(longitude / 30);
  const degree = longitude % 30;
  return {
    sign: ZODIAC_SIGNS[signIndex],
    degree: degree,
  };
}

/**
 * Calculate house number for a given longitude
 */
function getHouseNumber(longitude: number, houseCusps: number[]): number {
  // Normalize longitude to 0-360
  let lon = longitude % 360;
  if (lon < 0) lon += 360;

  // Find which house the planet is in
  for (let i = 0; i < 12; i++) {
    const currentCusp = houseCusps[i];
    const nextCusp = houseCusps[(i + 1) % 12];

    if (nextCusp > currentCusp) {
      if (lon >= currentCusp && lon < nextCusp) {
        return i + 1;
      }
    } else {
      // Handle wrap around 360 degrees
      if (lon >= currentCusp || lon < nextCusp) {
        return i + 1;
      }
    }
  }

  return 1; // Default to first house if not found
}

/**
 * Calculate aspects between planets
 */
function calculateAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];

      // Calculate angle between planets
      let angle = Math.abs(planet1.longitude - planet2.longitude);
      if (angle > 180) angle = 360 - angle;

      // Check each aspect type
      for (const [aspectType, aspectData] of Object.entries(ASPECTS)) {
        const diff = Math.abs(angle - aspectData.angle);
        if (diff <= aspectData.orb) {
          aspects.push({
            planet1: planet1.planet,
            planet2: planet2.planet,
            type: aspectData.name,
            angle: aspectData.angle,
            orb: diff,
          });
        }
      }
    }
  }

  return aspects;
}

/**
 * Calculate birth chart
 * @param engine — "swiss" (default, high precision) or "moshier" (semi-analytic)
 */
export async function calculateBirthChart(
  birthDate: Date,
  latitude: number,
  longitude: number,
  houseSystem: string = HOUSE_SYSTEMS.PLACIDUS,
  engine: EphemerisEngine = "swiss"
): Promise<BirthChart> {
  const swe = await getSwissEph();

  // Convert date to Julian Day
  const julianDay = dateToJulianDay(birthDate);
  const flags = EPHEMERIS_FLAGS[engine] ?? EPHEMERIS_FLAGS.swiss;

  // Calculate planetary positions
  const planets: PlanetPosition[] = [];

  for (const [planetName, planetId] of Object.entries(PLANETS)) {
    try {
      const result = swe.calc_ut(julianDay, planetId, flags);

      if (result && result.length >= 3) {
        const zodiac = getZodiacSign(result[0]);

        planets.push({
          planet: PLANET_NAMES[planetId as keyof typeof PLANET_NAMES],
          longitude: result[0],
          latitude: result[1],
          distance: result[2],
          longitudeSpeed: result[3] || 0,
          sign: zodiac.sign,
          signDegree: zodiac.degree,
          house: 1, // Will be updated after calculating houses
          isRetrograde: (result[3] || 0) < 0,
        });
      }
    } catch (error) {
      console.error(`Error calculating position for ${planetName}:`, error);
    }
  }

  // Calculate house cusps
  const houseCusps: HouseCusp[] = [];
  const houseCuspLongitudes: number[] = [];

  try {
    // swisseph-wasm houses() returns { cusps: Float64Array(13), ascmc: Float64Array(10) }
    // cusps[0] is unused, cusps[1..12] are the 12 house cusps
    // ascmc[0] = Ascendant, ascmc[1] = MC, ascmc[2] = ARMC, ascmc[3] = Vertex
    const houseData = swe.houses(
      julianDay,
      latitude,
      longitude,
      houseSystem
    ) as any;

    if (houseData && houseData.cusps && houseData.cusps.length >= 13) {
      const cusps = houseData.cusps;

      // House cusps start at index 1 (index 0 is unused)
      for (let i = 1; i <= 12; i++) {
        const cuspLongitude = cusps[i];
        houseCuspLongitudes.push(cuspLongitude);

        const zodiac = getZodiacSign(cuspLongitude);
        houseCusps.push({
          house: i,
          longitude: cuspLongitude,
          sign: zodiac.sign,
          signDegree: zodiac.degree,
        });
      }

      // Update planet house positions
      planets.forEach(planet => {
        planet.house = getHouseNumber(planet.longitude, houseCuspLongitudes);
      });
    } else if (
      houseData &&
      Array.isArray(houseData) &&
      houseData[0] &&
      houseData[0].length >= 13
    ) {
      // Fallback for older swisseph API that returns [cusps[], ascmc[]]
      const cusps = houseData[0] as number[];
      for (let i = 1; i <= 12; i++) {
        const cuspLongitude = cusps[i];
        houseCuspLongitudes.push(cuspLongitude);
        const zodiac = getZodiacSign(cuspLongitude);
        houseCusps.push({
          house: i,
          longitude: cuspLongitude,
          sign: zodiac.sign,
          signDegree: zodiac.degree,
        });
      }
      planets.forEach(planet => {
        planet.house = getHouseNumber(planet.longitude, houseCuspLongitudes);
      });
    }
  } catch (error) {
    console.error("Error calculating houses:", error);
  }

  // Calculate derived points: Part of Fortune, South Node, Lilith
  const sun = planets.find(p => p.planet === "Sun");
  const moon = planets.find(p => p.planet === "Moon");
  const ascLongitude =
    houseCuspLongitudes.length > 0 ? houseCuspLongitudes[0] : 0;

  // Part of Fortune = Ascendant + Moon - Sun (for day charts)
  // For night charts (Sun below horizon): Ascendant + Sun - Moon
  if (sun && moon) {
    const isDayChart = sun.house >= 7 && sun.house <= 12; // Sun above horizon
    let pofLong;
    if (isDayChart) {
      pofLong = (ascLongitude + moon.longitude - sun.longitude + 720) % 360;
    } else {
      pofLong = (ascLongitude + sun.longitude - moon.longitude + 720) % 360;
    }
    const pofZodiac = getZodiacSign(pofLong);
    planets.push({
      planet: "Part of Fortune",
      longitude: pofLong,
      latitude: 0,
      distance: 0,
      longitudeSpeed: 0,
      sign: pofZodiac.sign,
      signDegree: pofZodiac.degree,
      house:
        houseCuspLongitudes.length > 0
          ? getHouseNumber(pofLong, houseCuspLongitudes)
          : 1,
      isRetrograde: false,
    });
  }

  // South Node = North Node + 180°
  const northNode = planets.find(p => p.planet === "North Node");
  if (northNode) {
    const snLong = (northNode.longitude + 180) % 360;
    const snZodiac = getZodiacSign(snLong);
    planets.push({
      planet: "South Node",
      longitude: snLong,
      latitude: 0,
      distance: 0,
      longitudeSpeed: 0,
      sign: snZodiac.sign,
      signDegree: snZodiac.degree,
      house:
        houseCuspLongitudes.length > 0
          ? getHouseNumber(snLong, houseCuspLongitudes)
          : 1,
      isRetrograde: false,
    });
  }

  // Black Moon Lilith (Mean Apogee) - SE_MEAN_APOG = 12
  try {
    const lilithResult = swe.calc_ut(julianDay, 12, flags);
    if (lilithResult && lilithResult.length >= 3) {
      const lilithZodiac = getZodiacSign(lilithResult[0]);
      planets.push({
        planet: "Lilith",
        longitude: lilithResult[0],
        latitude: lilithResult[1],
        distance: lilithResult[2],
        longitudeSpeed: lilithResult[3] || 0,
        sign: lilithZodiac.sign,
        signDegree: lilithZodiac.degree,
        house:
          houseCuspLongitudes.length > 0
            ? getHouseNumber(lilithResult[0], houseCuspLongitudes)
            : 1,
        isRetrograde: (lilithResult[3] || 0) < 0,
      });
    }
  } catch (error) {
    console.error("Error calculating Lilith:", error);
  }

  // Calculate aspects (including new points)
  const aspects = calculateAspects(planets);

  // Detect chart patterns
  const { detectAllPatterns } = await import("./patterns.js");
  const patterns = detectAllPatterns(
    planets.map(p => ({
      name: p.planet,
      longitude: p.longitude,
      sign: p.sign,
      house: p.house,
    }))
  );

  return {
    planets,
    houses: houseCusps,
    aspects,
    patterns,
  };
}

/**
 * Clean up Swiss Ephemeris instance
 */
export function closeSwissEph(): void {
  if (sweInstance) {
    sweInstance.close();
    sweInstance = null;
  }
}
