// Typed client for the NatalTruth calculation + product API.
// Same-origin in prod; Vite proxies /v1 + /health + /api in dev.

const BASE = import.meta.env.VITE_API_BASE ?? "";

export type EngineMode = "swiss" | "moshier";

export interface BirthInput {
  fullName: string;
  birthDate: string;
  birthTime?: string | null;
  birthTimeAccuracy: "exact" | "approximate" | "unknown";
  birthPlaceLabel: string;
  latitude: number;
  longitude: number;
  utcOffset?: string | null;
  timeZoneId?: string | null;
  engineMode?: EngineMode;
}

export interface PlanetPosition {
  planet: string;
  longitude: number;
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
    systems?: Record<string, { total: number; reduced: number; letters?: { char: string; value: number }[] }>;
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

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export interface SavedChart {
  id: string;
  name: string;
  label: string | null;
  input: Record<string, unknown>;
  snapshot: ChartSnapshot;
  created_at: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  cover: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "same-origin",
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
  });
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    /* non-json */
  }
  if (!res.ok || (data && typeof data === "object" && "ok" in data && (data as any).ok === false)) {
    const msg = (data as any)?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return req<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export const api = {
  // calc
  health: () => fetch(`${BASE}/health`).then((r) => r.json()),
  calculate: (input: BirthInput) => post<CalculateResponse>("/v1/calculate", input),
  nameFull: (fullName: string, birthDate?: string) =>
    post<{ ok: boolean; profile: ChartSnapshot["numerology"] }>("/v1/name/full", {
      fullName,
      birthDate: birthDate ?? null,
    }),

  // auth
  register: (email: string, password: string, name?: string) =>
    post<{ ok: boolean; user: AuthUser }>("/api/auth/register", { email, password, name }),
  login: (email: string, password: string) =>
    post<{ ok: boolean; user: AuthUser }>("/api/auth/login", { email, password }),
  logout: () => post<{ ok: boolean }>("/api/auth/logout", {}),
  me: () => req<{ ok: boolean; user: AuthUser }>("/api/auth/me"),

  // charts
  listCharts: () => req<{ ok: boolean; charts: SavedChart[] }>("/api/charts"),
  getChart: (id: string) => req<{ ok: boolean; chart: SavedChart }>(`/api/charts/${id}`),
  saveChart: (chart: { name: string; label?: string; input: unknown; snapshot: unknown }) =>
    post<{ ok: boolean; id: string }>("/api/charts", chart),
  deleteChart: (id: string) => req<{ ok: boolean }>(`/api/charts/${id}`, { method: "DELETE" }),

  // blog (public)
  listPosts: () => req<{ ok: boolean; posts: Post[] }>("/api/posts"),
  getPost: (slug: string) => req<{ ok: boolean; post: Post }>(`/api/posts/${slug}`),

  // admin
  adminListPosts: () => req<{ ok: boolean; posts: Post[] }>("/api/admin/posts"),
  adminCreatePost: (data: Partial<Post>) => post<{ ok: boolean; id: string; slug: string }>("/api/admin/posts", data),
  adminUpdatePost: (id: string, data: Partial<Post>) =>
    req<{ ok: boolean }>(`/api/admin/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeletePost: (id: string) =>
    req<{ ok: boolean }>(`/api/admin/posts/${id}`, { method: "DELETE" }),
  adminListUsers: () => req<{ ok: boolean; users: (AuthUser & { created_at: string })[] }>("/api/admin/users"),
};
