/**
 * Full chart orchestration — always runs ephemeris + patterns + gematria.
 * engineMode selects Swiss Ephemeris or Moshier; never drops output fields.
 */

import { resolveBirthMoment, type BirthMomentInput } from "./birthMoment.js";
import {
  calculateBirthChart,
  type EphemerisEngine,
  type PlanetPosition,
} from "./ephemeris.js";
import { detectAllPatterns } from "./patterns.js";
import { calculateCompleteProfile } from "./gematria.js";

export type EngineMode = EphemerisEngine; // "swiss" | "moshier"

export type FullCalcInput = BirthMomentInput & {
  fullName: string;
  birthPlaceLabel: string;
  latitude: number;
  longitude: number;
  /**
   * swiss   — Swiss Ephemeris (SEFLG_SWIEPH). Premium / high precision.
   * moshier — Moshier semi-analytic (SEFLG_MOSEPH). No ephemeris files needed.
   * Both return the same snapshot shape (full pipeline).
   */
  engineMode?: EngineMode;
  houseSystem?: string;
};

export type ChartSnapshot = {
  version: 1;
  engineMode: EngineMode;
  ephemeris: {
    backend: EngineMode;
    flag: number;
    description: string;
  };
  input: {
    fullName: string;
    birthPlaceLabel: string;
    latitude: number;
    longitude: number;
    birthDate: string;
    birthTimeLocal: string;
    birthTimeAccuracy: string;
    timeZoneId: string | null;
    utcOffsetUsed: string;
  };
  moment: {
    utcIso: string;
    julianDay: number;
    notes: string[];
  };
  planets: PlanetPosition[];
  houses: unknown[];
  aspects: unknown[];
  patterns: unknown[];
  numerology: ReturnType<typeof calculateCompleteProfile>;
  computedAt: string;
};

const ENGINE_META: Record<
  EngineMode,
  { flag: number; description: string }
> = {
  swiss: {
    flag: 2 | 256,
    description:
      "Swiss Ephemeris (SEFLG_SWIEPH|SPEED) — high-precision planetary positions.",
  },
  moshier: {
    flag: 4 | 256,
    description:
      "Moshier semi-analytic ephemeris (SEFLG_MOSEPH|SPEED) — self-contained, no ephemeris files.",
  },
};

/**
 * Calculate the complete natal snapshot.
 * Never skips gematria, patterns, or ephemeris.
 */
export async function calculateFullChart(
  input: FullCalcInput
): Promise<ChartSnapshot> {
  if (!input.fullName?.trim()) {
    throw new Error("fullName is required");
  }
  if (
    typeof input.latitude !== "number" ||
    typeof input.longitude !== "number" ||
    Number.isNaN(input.latitude) ||
    Number.isNaN(input.longitude)
  ) {
    throw new Error("latitude and longitude are required numbers");
  }

  const engineMode: EngineMode = input.engineMode === "moshier" ? "moshier" : "swiss";
  const moment = resolveBirthMoment(input);
  moment.notes.push(`Ephemeris backend: ${engineMode}`);

  const utcDate = new Date(moment.utcIso);
  const chart = await calculateBirthChart(
    utcDate,
    input.latitude,
    input.longitude,
    input.houseSystem,
    engineMode
  );

  const patterns = detectAllPatterns(
    chart.planets.map(p => ({
      name: p.planet,
      longitude: p.longitude,
      sign: p.sign,
      house: p.house,
    }))
  );

  const numerology = calculateCompleteProfile(
    input.fullName.trim(),
    input.birthDate
  );

  const meta = ENGINE_META[engineMode];

  return {
    version: 1,
    engineMode,
    ephemeris: {
      backend: engineMode,
      flag: meta.flag,
      description: meta.description,
    },
    input: {
      fullName: input.fullName.trim(),
      birthPlaceLabel: input.birthPlaceLabel,
      latitude: input.latitude,
      longitude: input.longitude,
      birthDate: moment.birthDate,
      birthTimeLocal: moment.birthTimeLocal,
      birthTimeAccuracy: moment.birthTimeAccuracy,
      timeZoneId: moment.timeZoneId,
      utcOffsetUsed: moment.utcOffsetUsed,
    },
    moment: {
      utcIso: moment.utcIso,
      julianDay: moment.julianDay,
      notes: moment.notes,
    },
    planets: chart.planets,
    houses: chart.houses,
    aspects: chart.aspects,
    patterns,
    numerology,
    computedAt: new Date().toISOString(),
  };
}
