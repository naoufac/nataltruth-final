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

app.post("/v1/chat", async (req, res) => {
  try {
    const body = ChatBody.parse(req.body);
    const user = (req as ExpressRequest & { user?: AuthUser }).user;
    const userId = user?.id;
    const sid = body.session_id || newId("s");

    let context = body.context?.trim() || "";
    let history: { role: string; content: string }[] | undefined;

    if (userId) {
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
    }

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

// ── Chat session management (SQLite-backed) ─────────────────────────
app.get("/v1/chat/sessions", (req, res) => {
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

app.get("/v1/chat/history/:id", (req, res) => {
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

app.delete("/v1/chat/session/:id", (req, res) => {
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

// ── Admin endpoints (called by Gab44-V2 AdminPage) ──────────────────
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
