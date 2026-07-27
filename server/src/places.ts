// Birthplace geocoding via OpenStreetMap Nominatim (free, no API key needed).
// Returns city suggestions + resolves to lat/lon/timezone.
// Can be swapped to Google Places later by changing this one module.

import type { Router } from "express";
import { Router as ExpressRouter } from "express";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const tzLookup = require("tz-lookup") as (lat: number, lon: number) => string;

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  latitude: number;
  longitude: number;
}

export interface ResolvedPlace {
  placeId: string;
  place: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffset: string;
  source: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  boundingbox?: string[];
}

function extractCityName(result: NominatimResult): { main: string; secondary: string } {
  const addr = result.address || {};
  const city = addr.city || addr.town || addr.village || addr.municipality || result.name || "";
  const region = [addr.state, addr.country].filter(Boolean).join(", ");
  return { main: city || result.display_name.split(",")[0], secondary: region };
}

// Accurate timezone from coordinates using tz-lookup (offline boundary database).
function timezoneFromCoords(lat: number, lon: number): { tz: string; offset: string } {
  const tz = tzLookup(lat, lon);
  // Compute current UTC offset from the timezone using Intl.
  // shortOffset yields strings like "GMT+1", "GMT-4", "GMT+5:30", "GMT", "GMT+0".
  // The birth-moment engine requires strict ±HH:MM, so normalize here.
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
  const parts = formatter.formatToParts(new Date());
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "";
  const stripped = offsetPart.startsWith("GMT") ? offsetPart.replace("GMT", "") : offsetPart;
  return { tz, offset: normalizeOffset(stripped) };
}

/** Coerce a Nominatim/Intl short offset ("+1", "-4", "+5:30", "+0", "") into ±HH:MM. */
function normalizeOffset(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed || trimmed === "+0" || trimmed === "-0") return "+00:00";
  const m = trimmed.match(/^([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return "+00:00";
  const sign = m[1];
  const hh = m[2].padStart(2, "0");
  const mm = m[3] ?? "00";
  return `${sign}${hh}:${mm}`;
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (query.trim().length < 2) return [];

  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&accept-language=en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "NatalTruth/1.0 (nataltruth.com)" },
  });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const results = (await res.json()) as NominatimResult[];

  return results.map((r) => {
    const { main, secondary } = extractCityName(r);
    return {
      placeId: String(r.place_id),
      description: r.display_name,
      mainText: main,
      secondaryText: secondary,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    };
  });
}

export async function resolvePlace(placeId: string): Promise<ResolvedPlace> {
  const url = `${NOMINATIM_BASE}/lookup?osm_ids=${placeId}&format=json&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "NatalTruth/1.0 (nataltruth.com)" },
  });
  if (!res.ok) throw new Error(`Place resolution failed (${res.status})`);
  const results = (await res.json()) as NominatimResult[];
  if (!results.length) throw new Error("Place not found.");
  const r = results[0];
  const lat = parseFloat(r.lat);
  const lon = parseFloat(r.lon);
  const { tz, offset } = timezoneFromCoords(lat, lon);

  return {
    placeId: String(r.place_id),
    place: r.display_name,
    latitude: lat,
    longitude: lon,
    timezone: tz,
    utcOffset: offset,
    source: "OpenStreetMap Nominatim + tz-lookup",
  };
}

// Direct resolve from query (autocomplete + resolve in one step).
// Nominatim's /search endpoint returns 0 results when the q parameter
// includes a country name alongside a city (e.g. "Casablanca, Morocco"),
// so we fall back to the first comma-separated token, which is the city
// the autocomplete dropdown already showed the user.
export async function searchAndResolve(query: string): Promise<ResolvedPlace | null> {
  if (query.trim().length < 2) return null;

  const candidates = [query.trim()];
  const firstToken = query.split(",")[0].trim();
  if (firstToken && firstToken !== query.trim()) candidates.push(firstToken);

  for (const q of candidates) {
    const place = await resolveWithNominatim(q);
    if (place) return place;
  }
  return null;
}

async function resolveWithNominatim(query: string): Promise<ResolvedPlace | null> {
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&accept-language=en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "NatalTruth/1.0 (nataltruth.com)" },
  });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const results = (await res.json()) as NominatimResult[];
  if (!results.length) return null;
  const r = results[0];
  const lat = parseFloat(r.lat);
  const lon = parseFloat(r.lon);
  const { tz, offset } = timezoneFromCoords(lat, lon);
  const { main } = extractCityName(r);

  return {
    placeId: String(r.place_id),
    place: r.display_name,
    latitude: lat,
    longitude: lon,
    timezone: tz,
    utcOffset: offset,
    source: "OpenStreetMap Nominatim + tz-lookup",
  };
}

export function placesRouter(): ExpressRouter {
  const router = ExpressRouter();

  // Timezone by coordinates: GET /api/places/timezone?lat=33.59&lon=-7.62
  // Instant + offline (tz-lookup boundary DB). No external call, no flakiness.
  router.get("/timezone", (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        res.status(400).json({ ok: false, error: "lat and lon must be valid numbers." });
        return;
      }
      const { tz, offset } = timezoneFromCoords(lat, lon);
      res.json({ ok: true, timezone: tz, utcOffset: offset, latitude: lat, longitude: lon });
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "Timezone lookup failed." });
    }
  });

  // Autocomplete: GET /api/places/autocomplete?q=casablanca
  router.get("/autocomplete", async (req, res) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (q.length < 2) {
        res.json({ ok: true, suggestions: [] });
        return;
      }
      const suggestions = await searchPlaces(q);
      res.json({ ok: true, suggestions });
    } catch (err) {
      res.status(502).json({ ok: false, error: err instanceof Error ? err.message : "Search failed." });
    }
  });

  // Resolve: GET /api/places/resolve?q=Casablanca, Morocco
  router.get("/resolve", async (req, res) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (q.length < 2) {
        res.status(400).json({ ok: false, error: "Query too short." });
        return;
      }
      const place = await searchAndResolve(q);
      if (!place) {
        res.status(404).json({ ok: false, error: "Place not found. Try the city name without the country." });
        return;
      }
      res.json({ ok: true, place });
    } catch (err) {
      res.status(502).json({ ok: false, error: err instanceof Error ? err.message : "Resolution failed." });
    }
  });

  return router;
}
