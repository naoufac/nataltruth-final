// Typed client for the NatalTruth calculation API (see docs/API.md).
// Same-origin in prod; Vite proxies /v1 + /health to :3100 in dev.

const BASE = import.meta.env.VITE_API_BASE ?? "";

export type EngineMode = "swiss" | "moshier";

export interface BirthInput {
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  birthTime?: string | null; // HH:mm
  birthTimeAccuracy: "exact" | "approximate" | "unknown";
  birthPlaceLabel: string;
  latitude: number;
  longitude: number;
  utcOffset?: string | null; // +HH:MM
  timeZoneId?: string | null;
  engineMode?: EngineMode;
}

export interface PlanetPosition {
  planet: string;
  longitude: number;
  latitude?: number;
  distance?: number;
  longitudeSpeed?: number;
  sign: string;
  signDegree: number;
  house?: number | null;
  isRetrograde?: boolean;
}

export interface ChartSnapshot {
  version: number;
  engineMode: EngineMode;
  ephemeris: { backend: string; flag: number; description: string };
  input: Record<string, unknown>;
  moment: { utcIso?: string; julianDay: number; notes?: string[] };
  planets: PlanetPosition[];
  houses: { house: number; longitude: number; sign: string; signDegree: number }[];
  aspects: { planet1: string; planet2: string; type: string; angle: number; orb: number }[];
  patterns: {
    type: string;
    planets?: string[];
    signs?: string[];
    element?: string;
    strength?: number;
    description?: string;
  }[];
  numerology: {
    systems?: Record<string, { total: number; reduced: number }>;
    coreNumbers?: Record<string, number>;
  };
  computedAt: string;
}

export interface CalculateResponse {
  ok: boolean;
  engineMode: EngineMode;
  ephemeris: ChartSnapshot["ephemeris"];
  planetaryPositions: PlanetPosition[];
  houseCusps: unknown[];
  aspects: ChartSnapshot["aspects"];
  patterns: ChartSnapshot["patterns"];
  name: ChartSnapshot["numerology"];
  snapshot: ChartSnapshot;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  health: () => fetch(`${BASE}/health`).then((r) => r.json()),
  calculate: (input: BirthInput) => post<CalculateResponse>("/v1/calculate", input),
  calculateSwiss: (input: BirthInput) =>
    post<CalculateResponse>("/v1/calculate/swiss", { ...input, engineMode: undefined }),
  calculateMoshier: (input: BirthInput) =>
    post<CalculateResponse>("/v1/calculate/moshier", { ...input, engineMode: undefined }),
  nameFull: (fullName: string, birthDate?: string) =>
    post<{ ok: boolean; profile: ChartSnapshot["numerology"] }>("/v1/name/full", {
      fullName,
      birthDate: birthDate ?? null,
    }),
};
