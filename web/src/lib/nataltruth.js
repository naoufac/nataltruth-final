/**
 * NatalTruth API client + UI adapters.
 * Only talks to api.nataltruth.com validated endpoints.
 */
import axios from "axios";
import { BACKEND_URL } from "./apiConfig";

const http = axios.create({
  baseURL: BACKEND_URL,
  timeout: 90_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Low-level calls (calc + name only; no health polling) ───────────

/**
 * @param {object} birth
 * @param {"swiss"|"moshier"} engine
 */
export async function calculateChart(birth, engine = "swiss") {
  const path =
    engine === "moshier" ? "/v1/calculate/moshier" : "/v1/calculate/swiss";
  const { data } = await http.post(path, toCalculateBody(birth));
  if (!data?.ok) throw new Error(data?.error || "Calculate failed");
  return data;
}

export async function nameFull(fullName, birthDate) {
  const { data } = await http.post("/v1/name/full", {
    fullName,
    birthDate: birthDate || null,
  });
  if (!data?.ok) throw new Error(data?.error || "Name calculation failed");
  return data.profile;
}

export async function nameSystem(system, fullName) {
  const { data } = await http.post(`/v1/name/${system}`, { fullName });
  if (!data?.ok) throw new Error(data?.error || `${system} failed`);
  return data.result;
}

/**
 * Chat via api.nataltruth.com → OpenRouter (Qwen3.5-122B).
 * Matches ChatPage contract: { message, session_id } → { response, session_id }.
 */
export async function chatMessage(message, sessionId = null, context = null) {
  const { data } = await http.post("/chat", {
    message,
    session_id: sessionId || null,
    context: context || null,
  });
  if (!data?.ok && !data?.response) {
    throw new Error(data?.error || "Chat failed");
  }
  return data;
}

export async function chatSessions() {
  const { data } = await http.get("/chat/sessions");
  return Array.isArray(data) ? data : data?.sessions || [];
}

export async function chatHistory(sessionId) {
  const { data } = await http.get(`/chat/history/${sessionId}`);
  return Array.isArray(data) ? data : data?.messages || [];
}

export async function chatDeleteSession(sessionId) {
  await http.delete(`/chat/session/${sessionId}`);
}

// ─── Request mapping ─────────────────────────────────────────────────

function toCalculateBody(birth) {
  const fullName =
    birth.fullName || birth.birth_name || birth.name || "Unknown";
  const birthDate = birth.birthDate || birth.birth_date;
  if (!birthDate) throw new Error("birthDate is required");

  let birthTime = birth.birthTime || birth.birth_time || null;
  let birthTimeAccuracy =
    birth.birthTimeAccuracy || birth.birth_time_accuracy || "unknown";
  if (!birthTime) birthTimeAccuracy = "unknown";

  const latitude = num(birth.latitude ?? birth.lat);
  const longitude = num(birth.longitude ?? birth.lng ?? birth.lon);
  if (latitude == null || longitude == null) {
    throw new Error("latitude and longitude are required for chart calculation");
  }

  return {
    fullName: String(fullName).trim(),
    birthDate,
    birthTime,
    birthTimeAccuracy,
    birthPlaceLabel:
      birth.birthPlaceLabel || birth.birth_place || birth.place || "Unknown",
    latitude,
    longitude,
    timeZoneId: birth.timeZoneId || birth.timezone || null,
    utcOffset: birth.utcOffset || birth.utc_offset || null,
  };
}

function num(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ─── Response → ChartPage shape ──────────────────────────────────────

/**
 * Map NatalTruth calculate response → shape ChartPage expects.
 */
export function adaptChartForUi(apiResponse, birthMeta = {}) {
  const planetsArr =
    apiResponse.planetaryPositions ||
    apiResponse.snapshot?.planets ||
    [];
  const housesArr =
    apiResponse.houseCusps || apiResponse.snapshot?.houses || [];
  const aspectsArr =
    apiResponse.aspects || apiResponse.snapshot?.aspects || [];
  const patternsArr =
    apiResponse.patterns || apiResponse.snapshot?.patterns || [];
  const nameBlock = apiResponse.name || apiResponse.snapshot?.numerology || {};

  const planets = {};
  for (const p of planetsArr) {
    const key = planetKey(p.planet || p.name);
    planets[key] = {
      sign: p.sign,
      sign_degree: p.signDegree ?? p.sign_degree ?? p.degree,
      degree: p.signDegree ?? p.sign_degree ?? p.degree,
      house: p.house,
      longitude: p.longitude,
      retrograde: !!(p.isRetrograde ?? p.retrograde),
    };
  }

  const houses = {};
  for (const h of housesArr) {
    const n = String(h.house ?? h.number ?? "");
    if (!n) continue;
    houses[n] = {
      sign: h.sign,
      sign_degree: h.signDegree ?? h.sign_degree ?? h.degree,
    };
  }

  const aspects = aspectsArr.map((a) => ({
    planet1: planetKey(a.planet1),
    planet2: planetKey(a.planet2),
    aspect: a.type || a.aspect || a.aspect_type,
    aspect_type: a.type || a.aspect || a.aspect_type,
    orb: a.orb ?? 0,
  }));

  const patterns = patternsArr.map((p) =>
    typeof p === "string" ? p : p.type || p.description || "pattern"
  );

  const core = nameBlock.coreNumbers || nameBlock.numerology || {};
  const numerology = {
    life_path: wrapNum(core.lifePathNumber ?? core.life_path_number),
    expression: wrapNum(core.expressionNumber ?? core.expression_number),
    soul_urge: wrapNum(core.soulUrgeNumber ?? core.soul_urge_number),
    personality: wrapNum(core.personalityNumber ?? core.personality_number),
    birthday: wrapNum(core.birthDayNumber ?? core.birth_day_number),
  };

  return {
    sun_sign: planets.sun?.sign || null,
    moon_sign: planets.moon?.sign || null,
    rising_sign: houses["1"]?.sign || null,
    planets,
    houses,
    aspects,
    patterns,
    numerology,
    engineMode: apiResponse.engineMode || apiResponse.snapshot?.engineMode,
    ephemeris: apiResponse.ephemeris || apiResponse.snapshot?.ephemeris,
    snapshot: apiResponse.snapshot,
    name: nameBlock,
    birth_date: birthMeta.birth_date || birthMeta.birthDate,
    birth_place: birthMeta.birth_place || birthMeta.birthPlaceLabel,
    raw: apiResponse,
  };
}

function planetKey(name) {
  if (!name) return "unknown";
  return String(name)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/north_node|true_node/, "north_node")
    .replace(/part_of_fortune/, "part_of_fortune");
}

function wrapNum(n) {
  if (n == null) return { number: "—", meaning: "" };
  return { number: n, meaning: "" };
}

// ─── Response → GematriaPage shape ───────────────────────────────────

export function adaptGematriaForUi(profile, text) {
  const py = profile.systems?.pythagorean;
  const ch = profile.systems?.chaldean;
  return {
    text,
    chaldean: systemToUi(ch, "chaldean"),
    english_ordinal: systemToUi(py, "english_ordinal"),
    systems: profile.systems,
    coreNumbers: profile.coreNumbers,
    profile,
  };
}

function systemToUi(sys, systemId) {
  if (!sys) return null;
  return {
    system: systemId === "english_ordinal" ? "english_ordinal" : sys.system,
    total: sys.total,
    reduced: sys.reduced,
    letters: (sys.letters || []).map((l) => ({
      letter: l.char || l.letter,
      value: l.value,
    })),
    words: sys.words || [],
    significance: sys.notes || null,
  };
}

// ─── Response → NumerologyPage shape ─────────────────────────────────

export function adaptNumerologyForUi(profile) {
  const core = profile.coreNumbers || {};
  const py = profile.systems?.pythagorean;
  const letters = (py?.letters || []).map((l) => ({
    letter: l.char || l.letter,
    value: l.value,
  }));

  const card = (n, extra = {}) => ({
    number: n ?? "—",
    meaning: "",
    total: extra.total,
    letter_values: extra.letters || letters,
  });

  return {
    life_path: card(core.lifePathNumber),
    expression: card(core.expressionNumber, {
      total: py?.total,
      letters,
    }),
    soul_urge: card(core.soulUrgeNumber),
    personality: card(core.personalityNumber),
    birthday: card(core.birthDayNumber),
    personal_year: card(null),
    systems: profile.systems,
    profile,
  };
}

// ─── Local profile (no auth on calc API) ─────────────────────────────

export const PROFILE_KEY = "nataltruth_profile";

export function loadLocalProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function clearLocalProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

/**
 * Plan entitlement from API (file-backed on server).
 * @returns {{ plan: string, engineDefault: string, email: string } | null}
 */
export async function fetchEntitlement(email) {
  if (!email?.trim()) return null;
  const { data } = await http.get("/v1/entitlements", {
    params: { email: email.trim() },
  });
  if (!data?.ok) return null;
  return data.entitlement;
}

/** Preferred engine from plan or local override. */
export function resolveEngine(profile) {
  const local = typeof window !== "undefined" && localStorage.getItem("nataltruth_engine");
  if (local === "swiss" || local === "moshier") return local;
  if (profile?.engineDefault === "swiss" || profile?.plan === "ultra") return "swiss";
  return "swiss"; // product default high precision until gating enforced
}
