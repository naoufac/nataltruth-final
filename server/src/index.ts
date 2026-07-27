/**
 * NatalTruth Calculation + Product API.
 *
 * Calculation engine (13 endpoints): /v1/calculate, /v1/calculate/swiss,
 * /v1/calculate/moshier, /v1/name/*, /v1/gematria, /health.
 * Product: /api/auth/*, /api/charts, /api/posts, /api/admin/*.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { calculateFullChart } from "../../engine/src/calculate.js";
import type { EngineMode } from "../../engine/src/calculate.js";
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
import { db } from "./db.js";
import { attachUser } from "./auth.js";
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
        swiss: "POST /v1/calculate/swiss",
        moshier: "POST /v1/calculate/moshier",
        generic: "POST /v1/calculate",
      },
    },
    name: {
      systems: listLetterSystems(),
      full: "POST /v1/name/full",
    },
  });
});

// ── Chart ──────────────────────────────────────────────────────────

app.post("/v1/calculate", async (req, res) => {
  try {
    const body = BirthBody.parse(req.body);
    await runCalculate(body, res);
  } catch (err) {
    sendErr(res, err, "Invalid body");
  }
});

app.post("/v1/calculate/swiss", async (req, res) => {
  try {
    const body = BirthBodyBase.parse(req.body);
    await runCalculate({ ...body, engineMode: "swiss" }, res);
  } catch (err) {
    sendErr(res, err, "Invalid body");
  }
});

app.post("/v1/calculate/moshier", async (req, res) => {
  try {
    const body = BirthBodyBase.parse(req.body);
    await runCalculate({ ...body, engineMode: "moshier" }, res);
  } catch (err) {
    sendErr(res, err, "Invalid body");
  }
});

// ── Name systems ───────────────────────────────────────────────────

app.get("/v1/name/systems", (_req, res) => {
  res.json({ ok: true, systems: listLetterSystems() });
});

app.post("/v1/name/full", async (req, res) => {
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
  app.post(`/v1/name/${id}`, async (req, res) => {
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
app.post("/v1/gematria", async (req, res) => {
  try {
    const body = NameBody.parse(req.body);
    if (!body.birthDate) {
      res.status(400).json({
        ok: false,
        error: "birthDate required for /v1/gematria — or use /v1/name/full",
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

app.post("/v1/chat", async (req, res) => {
  try {
    const body = ChatBody.parse(req.body);
    const { response, model } = await chatCompletion({
      message: body.message,
      context: body.context,
    });

    // Store in session if session_id provided
    const sid = body.session_id || `s_${Date.now()}`;
    if (!chatSessions.has(sid)) {
      chatSessions.set(sid, { id: sid, messages: [], createdAt: new Date().toISOString() });
    }
    const session = chatSessions.get(sid)!;
    session.messages.push({ role: "user", content: body.message, ts: new Date().toISOString() });
    session.messages.push({ role: "assistant", content: response, ts: new Date().toISOString() });

    res.json({ ok: true, response, model, session_id: sid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat failed";
    res.status(msg.includes("not configured") ? 503 : 500).json({ ok: false, error: msg });
  }
});

// Legacy alias
app.post("/chat", async (req, res) => {
  try {
    const body = ChatBody.parse(req.body);
    const { response, model } = await chatCompletion({
      message: body.message,
      context: body.context,
    });
    res.json({ ok: true, response, model, session_id: body.session_id || null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat failed";
    res.status(msg.includes("not configured") ? 503 : 500).json({ ok: false, error: msg });
  }
});

// ── Deep reading generation ─────────────────────────────────────────
app.post("/v1/reading/deep", async (req, res) => {
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

// ── Chat session management (in-memory; no persistence needed for v1) ──
const chatSessions = new Map<string, { id: string; messages: { role: string; content: string; ts: string }[]; createdAt: string }>();

app.get("/v1/chat/sessions", (_req, res) => {
  const sessions = Array.from(chatSessions.values()).map(s => ({
    id: s.id,
    messageCount: s.messages.length,
    createdAt: s.createdAt,
  }));
  res.json({ ok: true, sessions });
});

app.get("/v1/chat/history/:id", (req, res) => {
  const session = chatSessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ ok: false, error: "Session not found." });
    return;
  }
  res.json({ ok: true, messages: session.messages });
});

app.delete("/v1/chat/session/:id", (req, res) => {
  if (!chatSessions.has(req.params.id)) {
    res.status(404).json({ ok: false, error: "Session not found." });
    return;
  }
  chatSessions.delete(req.params.id);
  res.json({ ok: true });
});

// ── Entitlements (plan lookup for frontend feature gating) ──────────
app.get("/v1/entitlements", (req, res) => {
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
