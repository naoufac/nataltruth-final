/**
 * NatalTruth Calculation + Product API.
 *
 * Calculation engine (13 endpoints): /calculate, /calculate/swiss,
 * /calculate/moshier, /name/*, /gematria, /health.
 * Product: /api/auth/*, /api/charts, /api/posts, /api/admin/*.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { calculateFullChart } from "../../engine/src/calculate.js";
import type { EngineMode } from "../../engine/src/calculate.js";
import { calculateBirthChart } from "../../engine/src/ephemeris.js";
import {
  calculateFullNameProfile,
  calculatePythagorean,
  calculateChaldean,
  calculateAbjad,
  calculateHebrew,
  calculateVedic,
  listLetterSystems,
  type LetterSystemId,
} from "../../engine/src/nameSystems.js";
import { db, newId, nowIso } from "./db.js";
import { attachUser, type AuthUser } from "./auth.js";
import type { Request as ExpressRequest } from "express";
import { authRouter } from "./routes/auth.js";
import { chartsRouter } from "./routes/charts.js";
import { blogRouter, adminRouter } from "./routes/blog.js";
import { seed } from "./seed.js";
import { placesRouter } from "./places.js";

// First-run seeding (admin account from env + starter posts). Safe to call every boot.
seed();

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// ── Plan tier limits ────────────────────────────────────────────────
const PLAN_LIMITS: Record<string, { chatDaily: number; friendDaily: number; readingWords: number }> = {
  free:         { chatDaily: 0,   friendDaily: 0,   readingWords: 0 },
  enthusiast:   { chatDaily: 50,  friendDaily: 50,  readingWords: 2000 },
  advanced:     { chatDaily: -1,  friendDaily: -1,  readingWords: 3000 },
  professional: { chatDaily: -1,  friendDaily: -1,  readingWords: 4000 },
};

function getUserTier(req: ExpressRequest): string {
  const user = (req as ExpressRequest & { user?: AuthUser }).user;
  if (!user) return "free";
  const founderEmails = (process.env.FOUNDER_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  if (founderEmails.includes(user.email.toLowerCase())) return "professional";
  const row = db.prepare("SELECT subscription_tier FROM users WHERE id = ?").get(user.id) as { subscription_tier: string } | undefined;
  return row?.subscription_tier || "free";
}

function checkApiLimit(userId: string, endpoint: string, dailyLimit: number): { allowed: boolean; reason?: string } {
  if (dailyLimit === -1) return { allowed: true };
  if (dailyLimit === 0) return { allowed: false, reason: "Upgrade to use AI features." };
  const today = new Date().toISOString().slice(0, 10);
  const row = db.prepare("SELECT count FROM api_usage WHERE user_id = ? AND date = ? AND endpoint = ?").get(userId, today, endpoint) as { count: number } | undefined;
  if ((row?.count || 0) >= dailyLimit) {
    return { allowed: false, reason: `Daily limit reached (${dailyLimit}). Upgrade for more.` };
  }
  return { allowed: true };
}

function incrementApiUsage(userId: string, endpoint: string): void {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare("INSERT OR REPLACE INTO api_usage(user_id, date, endpoint, count) VALUES(?,?,?,COALESCE((SELECT count FROM api_usage WHERE user_id=? AND date=? AND endpoint=?),0)+1)")
    .run(userId, today, endpoint, userId, today, endpoint);
}
app.use(
  cors({
    origin: [
      "https://nataltruth.com",
      "https://www.nataltruth.com",
      "https://nataltruth.135.181.44.161.sslip.io",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
// Attach the current user (if any) to every request. Never blocks.
app.use(attachUser);

const BirthBodyBase = z.object({
  fullName: z.string().min(1),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().nullable().optional(),
  birthTimeAccuracy: z
    .enum(["exact", "approximate", "unknown"])
    .default("unknown"),
  birthPlaceLabel: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timeZoneId: z.string().nullable().optional(),
  utcOffset: z.string().nullable().optional(),
  houseSystem: z.string().optional(),
});

const BirthBody = BirthBodyBase.extend({
  engineMode: z.enum(["swiss", "moshier"]).optional().default("swiss"),
});

const NameBody = z.object({
  fullName: z.string().min(1),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

function sendErr(res: express.Response, err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : fallback;
  const status =
    message.includes("required") ||
    message.includes("must be") ||
    message.includes("Invalid")
      ? 400
      : 500;
  res.status(status).json({ ok: false, error: message });
}

async function runCalculate(
  body: z.infer<typeof BirthBodyBase> & { engineMode: EngineMode },
  res: express.Response
) {
  try {
    const snapshot = await calculateFullChart({
      fullName: body.fullName,
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      birthTimeAccuracy: body.birthTimeAccuracy,
      birthPlaceLabel: body.birthPlaceLabel,
      latitude: body.latitude,
      longitude: body.longitude,
      timeZoneId: body.timeZoneId,
      utcOffset: body.utcOffset,
      engineMode: body.engineMode,
      houseSystem: body.houseSystem,
    });

    // Explicit top-level blocks for consumers
    res.json({
      ok: true,
      engineMode: snapshot.engineMode,
      ephemeris: snapshot.ephemeris,
      planetaryPositions: snapshot.planets,
      houseCusps: snapshot.houses,
      aspects: snapshot.aspects,
      patterns: snapshot.patterns,
      name: snapshot.numerology,
      snapshot,
    });
  } catch (err) {
    console.error("[calculate]", body.engineMode, err);
    sendErr(res, err, "Calculate failed");
  }
}

app.get("/health", (_req, res) => {
  let database = "ok";
  try {
    db.prepare("SELECT 1").get();
  } catch {
    database = "error";
  }
  res.json({
    ok: true,
    service: "nataltruth-api",
    version: "1.0.0",
    database,
    chart: {
      engines: ["swiss", "moshier"],
      includes: [
        "planetaryPositions",
        "houseCusps",
        "aspects",
        "patterns",
        "nameSystems",
      ],
      patterns: [
        "grand_trine",
        "t_square",
        "yod",
        "stellium",
        "grand_cross",
      ],
      routes: {
        swiss: "POST /calculate/swiss",
        moshier: "POST /calculate/moshier",
        generic: "POST /calculate",
      },
    },
    name: {
      systems: listLetterSystems(),
      full: "POST /name/full",
    },
  });
});

// ── Chart ──────────────────────────────────────────────────────────

app.post("/calculate", async (req, res) => {
  try {
    const body = BirthBody.parse(req.body);
    await runCalculate(body, res);
  } catch (err) {
    sendErr(res, err, "Invalid body");
  }
});

app.post("/calculate/swiss", async (req, res) => {
  try {
    const body = BirthBodyBase.parse(req.body);
    await runCalculate({ ...body, engineMode: "swiss" }, res);
  } catch (err) {
    sendErr(res, err, "Invalid body");
  }
});

app.post("/calculate/moshier", async (req, res) => {
  try {
    const body = BirthBodyBase.parse(req.body);
    await runCalculate({ ...body, engineMode: "moshier" }, res);
  } catch (err) {
    sendErr(res, err, "Invalid body");
  }
});

// ── Name systems ───────────────────────────────────────────────────

app.get("/name/systems", (_req, res) => {
  res.json({ ok: true, systems: listLetterSystems() });
});

app.post("/name/full", async (req, res) => {
  try {
    const body = NameBody.parse(req.body);
    const profile = calculateFullNameProfile(body.fullName, body.birthDate);
    res.json({ ok: true, profile });
  } catch (err) {
    sendErr(res, err, "Name full failed");
  }
});

const systemHandlers: Record<
  LetterSystemId,
  (name: string) => unknown
> = {
  pythagorean: calculatePythagorean,
  chaldean: calculateChaldean,
  abjad: calculateAbjad,
  hebrew: calculateHebrew,
  vedic: calculateVedic,
};

for (const id of Object.keys(systemHandlers) as LetterSystemId[]) {
  app.post(`/name/${id}`, async (req, res) => {
    try {
      const body = NameBody.parse(req.body);
      const result = systemHandlers[id](body.fullName);
      res.json({ ok: true, system: id, result });
    } catch (err) {
      sendErr(res, err, `${id} failed`);
    }
  });
}

/** Legacy alias */
app.post("/gematria", async (req, res) => {
  try {
    const body = NameBody.parse(req.body);
    if (!body.birthDate) {
      res.status(400).json({
        ok: false,
        error: "birthDate required for /gematria — or use /name/full",
      });
      return;
    }
    const profile = calculateFullNameProfile(body.fullName, body.birthDate);
    res.json({ ok: true, profile });
  } catch (err) {
    sendErr(res, err, "Gematria failed");
  }
});

// ── Chat (OpenRouter, grounded coaching) ───────────────────────────
import { chatCompletion, generateDeepReading } from "./openrouter.js";

const ChatBody = z.object({
  message: z.string().min(1),
  session_id: z.string().optional(),
  context: z.string().nullable().optional(),
});

function buildChartContext(userId: string): string | null {
  const row = db
    .prepare(
      "SELECT name, input_json, snapshot_json FROM charts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    )
    .get(userId) as
    | { name: string; input_json: string; snapshot_json: string }
    | undefined;
  if (!row) return null;

  let snap: any;
  let input: any;
  try {
    snap = JSON.parse(row.snapshot_json);
    input = JSON.parse(row.input_json);
  } catch {
    return null;
  }

  const lines: string[] = [];
  lines.push(`The user's saved birth chart ("${row.name}"):`);

  if (input?.fullName) lines.push(`- Name: ${input.fullName}`);
  if (input?.birthDate) lines.push(`- Birth date: ${input.birthDate}`);
  if (input?.birthTimeLocal || input?.birthTime)
    lines.push(`- Birth time: ${input.birthTimeLocal || input.birthTime}`);
  if (input?.birthPlaceLabel) lines.push(`- Birth place: ${input.birthPlaceLabel}`);

  const planets: any[] = snap.planets || [];
  const planetSign = (name: string) => planets.find((p) => p.planet === name)?.sign;
  const sun = planetSign("Sun");
  const moon = planetSign("Moon");

  const houses: any[] = snap.houses || [];
  const rising = houses.find((h: any) => h.house === 1)?.sign;

  if (sun) lines.push(`- Sun sign: ${sun}`);
  if (moon) lines.push(`- Moon sign: ${moon}`);
  if (rising) lines.push(`- Rising / Ascendant: ${rising}`);

  const keyPlanets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const planetLines: string[] = [];
  for (const name of keyPlanets) {
    const p = planets.find((x: any) => x.planet === name);
    if (p?.sign) {
      const house = p.house ? `, House ${p.house}` : "";
      const retro = p.isRetrograde ? " (Rx)" : "";
      planetLines.push(`- ${name}: ${p.sign}${house}${retro}`);
    }
  }
  if (planetLines.length) {
    lines.push("Key planets:", ...planetLines);
  }

  return lines.length > 1 ? lines.join("\n") : null;
}

app.post("/chat", async (req, res) => {
  try {
    const body = ChatBody.parse(req.body);
    const user = (req as ExpressRequest & { user?: AuthUser }).user;
    const userId = user?.id;
    const sid = body.session_id || newId("s");

    let context = body.context?.trim() || "";
    let history: { role: string; content: string }[] | undefined;

    if (userId) {
      const tier = getUserTier(req as ExpressRequest);
      const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;
      if (limits.chatDaily === 0) {
        res.status(403).json({ ok: false, error: "AI Coach requires a paid plan. Upgrade to chat." });
        return;
      }
      const limitCheck = checkApiLimit(userId, "chat", limits.chatDaily);
      if (!limitCheck.allowed) {
        res.status(429).json({ ok: false, error: limitCheck.reason });
        return;
      }

      const histRows = db
        .prepare(
          "SELECT role, content FROM chat_messages WHERE session_id = ? AND user_id = ? ORDER BY timestamp ASC LIMIT 50"
        )
        .all(sid, userId) as { role: string; content: string }[];
      history = histRows.map((r) => ({ role: r.role, content: r.content }));

      const chartCtx = buildChartContext(userId);
      if (chartCtx) {
        context = context ? `${chartCtx}\n\n${context}` : chartCtx;
      }

      db.prepare(
        "INSERT INTO chat_messages(id, user_id, session_id, role, content, timestamp) VALUES(?,?,?,?,?,?)"
      ).run(newId("msg"), userId, sid, "user", body.message, nowIso());
    }

    const { response, model } = await chatCompletion({
      message: body.message,
      history,
      context: context || undefined,
    });

    if (userId) {
      db.prepare(
        "INSERT INTO chat_messages(id, user_id, session_id, role, content, timestamp) VALUES(?,?,?,?,?,?)"
      ).run(newId("msg"), userId, sid, "assistant", response, nowIso());
      incrementApiUsage(userId, "chat");
    }

    res.json({ ok: true, response, model, session_id: sid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat failed";
    res.status(msg.includes("not configured") ? 503 : 500).json({ ok: false, error: msg });
  }
});

// ── Deep reading generation ─────────────────────────────────────────
app.post("/reading/deep", async (req, res) => {
  try {
    const snapshot = req.body?.snapshot;
    if (!snapshot) {
      res.status(400).json({ ok: false, error: "snapshot is required in the request body." });
      return;
    }
    const { reading, model } = await generateDeepReading(snapshot);
    res.json({ ok: true, reading, model });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Deep reading failed";
    res.status(msg.includes("not configured") ? 503 : 500).json({ ok: false, error: msg });
  }
});

// ── Chat session management (SQLite-backed) ─────────────────────────
app.get("/chat/sessions", (req, res) => {
  const user = (req as ExpressRequest & { user?: AuthUser }).user;
  const userId = user?.id;
  if (!userId) {
    res.json({ ok: true, sessions: [] });
    return;
  }
  const rows = db
    .prepare(
      "SELECT session_id, COUNT(*) AS message_count, MAX(timestamp) AS last_message_time FROM chat_messages WHERE user_id = ? GROUP BY session_id ORDER BY last_message_time DESC LIMIT 20"
    )
    .all(userId) as {
    session_id: string;
    message_count: number;
    last_message_time: string;
  }[];
  res.json({
    ok: true,
    sessions: rows.map((r) => ({
      id: r.session_id,
      messageCount: r.message_count,
      lastMessageTime: r.last_message_time,
    })),
  });
});

app.get("/chat/history/:id", (req, res) => {
  const user = (req as ExpressRequest & { user?: AuthUser }).user;
  const userId = user?.id;
  if (!userId) {
    res.status(401).json({ ok: false, error: "Sign in required." });
    return;
  }
  const rows = db
    .prepare(
      "SELECT role, content, timestamp FROM chat_messages WHERE session_id = ? AND user_id = ? ORDER BY timestamp ASC LIMIT 100"
    )
    .all(req.params.id, userId) as { role: string; content: string; timestamp: string }[];
  res.json({
    ok: true,
    messages: rows.map((r) => ({ role: r.role, content: r.content, ts: r.timestamp })),
  });
});

app.delete("/chat/session/:id", (req, res) => {
  const user = (req as ExpressRequest & { user?: AuthUser }).user;
  const userId = user?.id;
  if (!userId) {
    res.status(401).json({ ok: false, error: "Sign in required." });
    return;
  }
  const info = db
    .prepare("DELETE FROM chat_messages WHERE session_id = ? AND user_id = ?")
    .run(req.params.id, userId);
  if (info.changes === 0) {
    res.status(404).json({ ok: false, error: "Session not found." });
    return;
  }
  res.json({ ok: true });
});

// ── Entitlements (plan lookup for frontend feature gating) ──────────
app.get("/entitlements", (req, res) => {
  const email = (req.query.email as string || "").trim().toLowerCase();
  const founderEmails = (process.env.FOUNDER_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const isFounder = founderEmails.includes(email);
  res.json({
    ok: true,
    entitlement: {
      email: email || "anonymous",
      plan: isFounder ? "ultra" : "free",
      engineDefault: "swiss",
      features: {
        chat: true,
        deepReading: isFounder,
        moshierEngine: true,
        swissEngine: true,
      },
    },
  });
});

// ── Transits: current planet positions vs natal chart ──────────────
const TRANSIT_PLANETS = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180,
};
const TRANSIT_ORB = 3;

app.get("/transits", async (req, res) => {
  try {
    const user = (req as ExpressRequest & { user?: AuthUser }).user;
    const userId = user?.id;
    if (!userId) { res.status(401).json({ ok: false, error: "Sign in required." }); return; }

    const chartRow = db
      .prepare("SELECT snapshot_json FROM charts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(userId) as { snapshot_json: string } | undefined;
    if (!chartRow) { res.status(404).json({ ok: false, error: "No saved chart found." }); return; }

    const natal = JSON.parse(chartRow.snapshot_json);
    const natalPlanets: any[] = natal.planets || [];

    const now = new Date();
    const currentChart = await calculateBirthChart(now, 0, 0, "E", "swiss");
    const currentPlanets = currentChart.planets;

    const transits: any[] = [];
    for (const tp of currentPlanets) {
      if (!TRANSIT_PLANETS.includes(tp.planet)) continue;
      for (const np of natalPlanets) {
        let diff = Math.abs(tp.longitude - np.longitude);
        if (diff > 180) diff = 360 - diff;
        for (const [aspectName, angle] of Object.entries(ASPECT_ANGLES)) {
          const orb = Math.abs(diff - angle);
          if (orb <= TRANSIT_ORB) {
            transits.push({
              id: `${tp.planet}-${np.planet}-${aspectName}`,
              transit_type: `${tp.planet} ${aspectName} ${np.planet}`,
              planet: tp.planet,
              aspect: aspectName,
              natal_planet: np.planet,
              transit_sign: tp.sign,
              orb: Math.round(orb * 100) / 100,
              strength: Math.round((1 - orb / TRANSIT_ORB) * 100) / 100,
              peak_date: now.toISOString().slice(0, 10),
              interpretation: `${tp.planet} transiting ${tp.sign} forms a ${aspectName} to your natal ${np.planet} in ${np.sign}. This ${aspectName === "trine" || aspectName === "sextile" ? "harmonious" : aspectName === "square" || aspectName === "opposition" ? "challenging" : "powerful"} aspect ${aspectName === "trine" ? "brings natural flow and opportunity" : aspectName === "square" ? "creates productive friction for growth" : aspectName === "opposition" ? "demands balance between two forces" : aspectName === "sextile" ? "offers an opportunity if you act" : "concentrates energy intensely"} in the area of life ruled by ${np.planet}.`,
            });
          }
        }
      }
    }

    transits.sort((a, b) => b.strength - a.strength);
    res.json({ ok: true, transits: transits.slice(0, 6), date: now.toISOString().slice(0, 10) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Transit calculation failed";
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── Daily guidance: GLM-5.2 reading from chart + transits ──────────
app.get("/guidance/daily", async (req, res) => {
  try {
    const user = (req as ExpressRequest & { user?: AuthUser }).user;
    const userId = user?.id;
    if (!userId) { res.status(401).json({ ok: false, error: "Sign in required." }); return; }

    const today = new Date().toISOString().slice(0, 10);
    const cached = db.prepare("SELECT content_json FROM daily_guidance WHERE user_id = ? AND date = ?").get(userId, today) as { content_json: string } | undefined;
    if (cached) {
      res.json({ ok: true, ...JSON.parse(cached.content_json), date: today });
      return;
    }

    const chartRow = db
      .prepare("SELECT snapshot_json FROM charts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(userId) as { snapshot_json: string } | undefined;

    let context = "Generate personalized daily astrology guidance.";
    if (chartRow) {
      const snap = JSON.parse(chartRow.snapshot_json);
      const sun = snap.planets?.find((p: any) => p.planet === "Sun");
      const moon = snap.planets?.find((p: any) => p.planet === "Moon");
      const rising = snap.houses?.find((h: any) => h.house === 1);
      context = `User: Sun ${sun?.sign || "?"}, Moon ${moon?.sign || "?"}, Rising ${rising?.sign || "?"}. Generate daily guidance for ${today}.`;
    }

    const { response } = await chatCompletion({
      message: `${context}\n\nProvide today's guidance as a JSON object with: overall_energy (1-2 sentences), focus_areas (3 items), action_items (3 items). Respond ONLY with valid JSON.`,
      internal: true,
    });

    let guidance: any;
    try {
      const match = response.match(/\{[\s\S]*\}/);
      guidance = match ? JSON.parse(match[0]) : { overall_energy: response, focus_areas: [], action_items: [] };
    } catch {
      guidance = { overall_energy: response, focus_areas: [], action_items: [] };
    }

    db.prepare("INSERT OR REPLACE INTO daily_guidance(user_id, date, content_json) VALUES(?,?,?)")
      .run(userId, today, JSON.stringify(guidance));

    res.json({ ok: true, ...guidance, date: today });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Daily guidance failed";
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── Daily horoscope: per-sign GLM-5.2 content ──────────────────────
const ZODIAC_SIGNS_LIST = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

app.get("/horoscope/:sign", async (req, res) => {
  try {
    const sign = ZODIAC_SIGNS_LIST.find(s => s.toLowerCase() === req.params.sign.toLowerCase());
    if (!sign) { res.status(400).json({ ok: false, error: "Invalid zodiac sign." }); return; }

    const today = new Date().toISOString().slice(0, 10);
    const cached = db.prepare("SELECT content_json FROM daily_horoscopes WHERE sign = ? AND date = ?").get(sign, today) as { content_json: string } | undefined;
    if (cached) {
      res.json({ ok: true, ...JSON.parse(cached.content_json), sign, date: today });
      return;
    }

    const { response } = await chatCompletion({
      message: `Generate today's (${today}) horoscope for ${sign}. Return ONLY valid JSON: { "summary": "2-3 sentences", "love": "1 sentence", "career": "1 sentence", "wellness": "1 sentence", "lucky_number": <1-9>, "mood": "one word" }`,
      internal: true,
    });

    let horo: any;
    try {
      const match = response.match(/\{[\s\S]*\}/);
      horo = match ? JSON.parse(match[0]) : { summary: response };
    } catch {
      horo = { summary: response };
    }

    db.prepare("INSERT OR REPLACE INTO daily_horoscopes(sign, date, content_json) VALUES(?,?,?)")
      .run(sign, today, JSON.stringify(horo));

    res.json({ ok: true, ...horo, sign, date: today });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Horoscope failed";
    res.status(500).json({ ok: false, error: msg });
  }
});

app.get("/horoscope", async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const signs = ZODIAC_SIGNS_LIST;
  const results: any[] = [];
  for (const sign of signs) {
    const cached = db.prepare("SELECT content_json FROM daily_horoscopes WHERE sign = ? AND date = ?").get(sign, today) as { content_json: string } | undefined;
    if (cached) {
      results.push({ ...JSON.parse(cached.content_json), sign });
    }
  }
  res.json({ ok: true, date: today, signs: results });
});


// ── Route aliases for Gab44-V2 frontend compatibility ──────────────
app.get("/transits/upcoming", async (req, res) => {
  try {
    const user = (req as ExpressRequest & { user?: AuthUser }).user;
    if (!user?.id) { res.status(401).json({ detail: "Authentication required" }); return; }
    const chartRow = db.prepare("SELECT snapshot_json FROM charts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(user.id) as { snapshot_json: string } | undefined;
    if (!chartRow) { res.json([]); return; }
    const natal = JSON.parse(chartRow.snapshot_json);
    const natalPlanets: any[] = natal.planets || [];
    const now = new Date();
    const currentChart = await calculateBirthChart(now, 0, 0, "E", "swiss");
    const transits: any[] = [];
    for (const tp of currentChart.planets) {
      if (!["Jupiter","Saturn","Uranus","Neptune","Pluto"].includes(tp.planet)) continue;
      for (const np of natalPlanets) {
        let diff = Math.abs(tp.longitude - np.longitude);
        if (diff > 180) diff = 360 - diff;
        for (const [aspectName, angle] of Object.entries({ conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 })) {
          const orb = Math.abs(diff - angle);
          if (orb <= 5) {
            transits.push({
              id: `${tp.planet}-${np.planet}-${aspectName}`, transit_type: `${tp.planet} ${aspectName} ${np.planet}`,
              planet: tp.planet, aspect: aspectName, natal_planet: np.planet, transit_sign: tp.sign,
              orb: Math.round(orb * 100) / 100, strength: Math.round((1 - orb / 5) * 100) / 100,
              start_date: now.toISOString(), peak_date: now.toISOString(),
              end_date: new Date(now.getTime() + 7 * 86400000).toISOString(),
              interpretation: `${tp.planet} ${aspectName} ${np.planet} transit.`,
              action_items: ["Pay attention", "Journal"],
            });
          }
        }
      }
    }
    transits.sort((a, b) => b.strength - a.strength);
    res.json(transits.slice(0, 6));
  } catch { res.json([]); }
});

app.get("/numerology/me", (req, res) => {
  const user = (req as ExpressRequest & { user?: AuthUser }).user;
  if (!user?.id) { res.status(401).json({ detail: "Authentication required" }); return; }
  const chartRow = db.prepare("SELECT snapshot_json FROM charts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(user.id) as { snapshot_json: string } | undefined;
  if (!chartRow) { res.json({}); return; }
  try {
    const snap = JSON.parse(chartRow.snapshot_json);
    const num = snap.numerology?.coreNumbers || {};
    const result: any = {};
    for (const [key, val] of Object.entries(num)) {
      const shortKey = key.replace("Number", "").toLowerCase();
      result[shortKey] = { number: val, keyword: "", theme: "" };
    }
    res.json(result);
  } catch { res.json({}); }
});

app.get("/chart/me", (req, res) => {
  const user = (req as ExpressRequest & { user?: AuthUser }).user;
  if (!user?.id) { res.status(401).json({ detail: "Authentication required" }); return; }
  const chartRow = db.prepare("SELECT snapshot_json, input_json FROM charts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(user.id) as { snapshot_json: string; input_json: string } | undefined;
  if (!chartRow) { res.status(404).json({ detail: "No chart found" }); return; }
  try {
    const snap = JSON.parse(chartRow.snapshot_json);
    const input = JSON.parse(chartRow.input_json);
    const planets: any = {};
    for (const p of snap.planets || []) {
      const key = p.planet.toLowerCase().replace(/\s+/g, "_");
      planets[key] = { sign: p.sign, degree: p.longitude, sign_degree: p.signDegree, house: p.house, retrograde: p.isRetrograde };
    }
    const houses: any = {};
    for (const h of snap.houses || []) { houses[h.house] = { sign: h.sign, sign_degree: h.signDegree }; }
    res.json({
      sun_sign: snap.planets?.find((p: any) => p.planet === "Sun")?.sign,
      moon_sign: snap.planets?.find((p: any) => p.planet === "Moon")?.sign,
      rising_sign: snap.houses?.find((h: any) => h.house === 1)?.sign,
      planets, houses, aspects: snap.aspects || [],
      patterns: (snap.patterns || []).map((p: any) => p.type),
      numerology: snap.numerology?.coreNumbers || {},
      birth_date: input?.birthDate, birth_place: input?.birthPlaceLabel,
    });
  } catch { res.status(500).json({ detail: "Chart parse error" }); }
});

app.get("/guidance/voice/:id", (_req, res) => { res.status(503).json({ detail: "Voice guidance not configured" }); });

// The frontend calls /admin/* with Authorization: Bearer <token>.
// Auth is via our JWT cookie OR the bearer token.

function founderCheck(req: express.Request): boolean {
  const founderEmails = (process.env.FOUNDER_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const user = (req as any).user;
  if (user?.email && founderEmails.includes(user.email.toLowerCase())) return true;
  // Also allow by email query param (for backward compat)
  const email = (req.query.email as string || "").trim().toLowerCase();
  if (founderEmails.includes(email)) return true;
  return false;
}

// GET /admin/stats — platform metrics
app.get("/admin/stats", attachUser, (req, res) => {
  if (!founderCheck(req)) { res.status(403).json({ detail: "Admin access required." }); return; }

  const users = db.prepare("SELECT id, email, name, role, created_at FROM users").all() as any[];
  const founderEmails = (process.env.FOUNDER_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const chatMsgCount = (db.prepare("SELECT COUNT(*) AS n FROM chat_messages").get() as { n: number }).n;
  const chatSessionCount = (db.prepare("SELECT COUNT(DISTINCT session_id) AS n FROM chat_messages").get() as { n: number }).n;

  const subscriptionBreakdown: Record<string, number> = { seeker: 0, enthusiast: 0, advanced: 0, professional: 0 };
  for (const u of users) {
    const isFounder = founderEmails.includes(u.email.toLowerCase());
    subscriptionBreakdown[isFounder ? "professional" : "seeker"]++;
  }

  const sunSignDistribution: Record<string, number> = {};
  try {
    const charts = db.prepare("SELECT snapshot_json FROM charts").all() as any[];
    for (const c of charts) {
      try {
        const snap = JSON.parse(c.snapshot_json);
        const sun = snap.planets?.find((p: any) => p.planet === "Sun");
        if (sun?.sign) sunSignDistribution[sun.sign] = (sunSignDistribution[sun.sign] || 0) + 1;
      } catch {}
    }
  } catch {}

  res.json({
    total_users: users.length,
    total_chat_messages: chatMsgCount,
    total_chat_sessions: chatSessionCount,
    total_compatibility_reports: 0,
    recent_signups: 0,
    subscription_breakdown: subscriptionBreakdown,
    sun_sign_distribution: sunSignDistribution,
  });
});

// GET /admin/users — list all users
app.get("/admin/users", attachUser, (req, res) => {
  if (!founderCheck(req)) { res.status(403).json({ detail: "Admin access required." }); return; }
  const founderEmails = (process.env.FOUNDER_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const rows = db.prepare("SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC LIMIT ?").all(limit) as any[];
  const users = rows.map(u => ({
    ...u,
    is_admin: u.role === "admin" || founderEmails.includes(u.email.toLowerCase()),
    subscription_tier: founderEmails.includes(u.email.toLowerCase()) ? "professional" : "seeker",
    sun_sign: null,
    birth_date: null,
  }));
  res.json({ users });
});

// PUT /admin/users/:id/tier — change user tier
app.put("/admin/users/:id/tier", attachUser, (req, res) => {
  if (!founderCheck(req)) { res.status(403).json({ detail: "Admin access required." }); return; }
  const tier = req.query.tier as string;
  // Store tier in a settings-like field (for now just acknowledge)
  res.json({ ok: true, user_id: req.params.id, tier });
});

// PUT /admin/users/:id/role — change user role
app.put("/admin/users/:id/role", attachUser, (req, res) => {
  if (!founderCheck(req)) { res.status(403).json({ detail: "Admin access required." }); return; }
  const role = req.query.role as string;
  if (role !== "user" && role !== "admin") { res.status(400).json({ detail: "Invalid role." }); return; }
  const info = db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
  if (info.changes === 0) { res.status(404).json({ detail: "User not found." }); return; }
  res.json({ ok: true });
});

// POST /admin/upgrade-all-users — bulk upgrade
app.post("/admin/upgrade-all-users", attachUser, (req, res) => {
  if (!founderCheck(req)) { res.status(403).json({ detail: "Admin access required." }); return; }
  res.json({ ok: true, modified_count: 0, message: "Tier storage not yet implemented." });
});

// GET /admin/reading-orders — list reading orders
app.get("/admin/reading-orders", attachUser, (req, res) => {
  if (!founderCheck(req)) { res.status(403).json({ detail: "Admin access required." }); return; }
  res.json({ orders: [], counts: { pending: 0, paid: 0, fulfilled: 0, refunded: 0 }, paid_total_cents: 0 });
});

// PUT /admin/reading-orders/:id/status — update order status
app.put("/admin/reading-orders/:id/status", attachUser, (req, res) => {
  if (!founderCheck(req)) { res.status(403).json({ detail: "Admin access required." }); return; }
  res.json({ ok: true });
});

// POST /admin/send-email-blast — send email (stub)
app.post("/admin/send-email-blast", attachUser, (req, res) => {
  if (!founderCheck(req)) { res.status(403).json({ detail: "Admin access required." }); return; }
  res.json({ ok: true, queued: 0, message: "Email blast not yet configured." });
});

// ── Product (auth, saved charts, blog, admin CMS) ──────────────────
app.use("/api/auth", authRouter);
app.use("/api/charts", chartsRouter);
app.use("/api", blogRouter);   // /api/posts, /api/posts/:slug
app.use("/api/admin", adminRouter);
app.use("/api/places", placesRouter());  // /api/places/autocomplete, /api/places/resolve

const port = parseInt(process.env.PORT || "3100", 10);
app.listen(port, () => {
  console.log(`NatalTruth API on http://0.0.0.0:${port}`);
});
