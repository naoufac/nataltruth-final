/**
 * NatalTruth Calculation API — api.nataltruth.com
 *
 * Chart: planets, houses, aspects, patterns (swiss + moshier)
 * Name: Pythagorean, Chaldean, Abjad, Hebrew, Vedic (+ full profile)
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
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

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(
  cors({
    origin: [
      "https://nataltruth.com",
      "https://www.nataltruth.com",
      "https://nao.nataltruth.com",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

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
  res.json({
    ok: true,
    service: "nataltruth-api",
    version: "1.0.0",
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

const port = parseInt(process.env.PORT || "3100", 10);
app.listen(port, () => {
  console.log(`NatalTruth API on http://0.0.0.0:${port}`);
});
