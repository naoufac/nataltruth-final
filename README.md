# NatalTruth

**Precision natal astrology + multi-tradition name numerology — built to be trusted, read, and shared.**

NatalTruth calculates a birth chart and a full name-number profile with real ephemeris math, then presents it in plain, honest language. No invented placements. No神秘 theater. The goal is a reading that a first-time visitor can actually understand and trust enough to share.

This repository (`nataltruth-final`) is the consolidated, canonical home for the calculation engine and the product around it.

---

## Why this exists

Most astrology online is either a thin daily blurb or an expensive PDF dressed in mystic luxury. NatalTruth is neither. It is:

- **Precise.** Real Swiss Ephemeris (and a Moshier cross-check) for planets, houses, aspects, and patterns. Real letter-to-number engines across five traditions.
- **Truthful.** If data is missing, the engine says so and omits the affected fields rather than inventing them. Every output is reproducible from the inputs.
- **Readable.** Big, calm type. Plain language. A chart you can actually read on a phone.
- **Generous.** Substantial value free, by design — because a genuinely useful free reading is the best marketing there is.
- **Shareable.** Every reading produces a clean, branded card meant to be passed along. Organic reach is a feature, not an afterthought.

---

## What is in this repo

```
nataltruth-final/
├── engine/              # the calculation machine (TypeScript) — the heart, do not dilute
│   └── src/
│       ├── ephemeris.ts     # Swiss + Moshier planetary positions
│       ├── birthMoment.ts   # UTC/julian-day resolution from birth input
│       ├── calculate.ts     # full chart assembly
│       ├── patterns.ts      # grand trine, t-square, yod, stellium, grand cross
│       ├── nameSystems.ts   # Pythagorean, Chaldean, Abjad, Hebrew, Vedic
│       ├── gematria.ts
│       └── index.ts
├── server/              # Express API — the 13 calculation endpoints
│   └── src/index.ts
├── scripts/
│   └── verify-truth-layer.mjs   # programmatic check that the engine + docs do not lie
├── docs/
│   ├── API.md               # the endpoint contract
│   └── STRESS_TEST_REPORT.md
├── web/                 # the product frontend (fresh build, in progress)
├── BRAND.md             # the brand direction (comfort + trust, not luxury)
└── ARCHITECTURE.md      # how the pieces fit + hosting
```

---

## The calculation machine (13 endpoints)

| # | Endpoint | Returns |
|---|----------|---------|
| 1 | `POST /v1/calculate` | Full chart (engineMode: swiss \| moshier) |
| 2 | `POST /v1/calculate/swiss` | Full chart — Swiss Ephemeris |
| 3 | `POST /v1/calculate/moshier` | Full chart — Moshier cross-check |
| 4 | `POST /v1/name/full` | All five name systems + core numbers |
| 5 | `POST /v1/name/pythagorean` | 1–9, Latin |
| 6 | `POST /v1/name/chaldean` | 1–8, no letter 9 |
| 7 | `POST /v1/name/abjad` | 1–1000, Arabic script |
| 8 | `POST /v1/name/hebrew` | 1–400, Mispar Hechrechi |
| 9 | `POST /v1/name/vedic` | 1–8, Chaldean practice on Latin |
| 10 | `GET /v1/name/systems` | System metadata |
| 11 | `POST /v1/gematria` | Alias to full name profile |
| 12 | `GET /health` | Service + capability inventory |
| — | `POST /v1/chat` | Grounded coaching (503 until `OPENROUTER_API_KEY` is set) |

Full request/response shapes: **[docs/API.md](./docs/API.md)**.

Every chart response always includes: planetary positions · 12 house cusps · aspects with orbs · detected patterns · the multi-system name profile. No lite mode. No skipped blocks.

---

## Status (honest)

| Layer | Status |
|-------|--------|
| Calculation engine (chart + patterns) | **Validated** — Swiss + Moshier |
| Name systems (5 traditions) | **Validated** |
| Express API (13 endpoints) | **Validated** — stress-tested 10× each |
| Truth-layer verification script (`pnpm verify:full`) | **Passing** — now includes anti-invention checks (every sign matches `floor(longitude/30)`, every aspect/pattern references a real planet) |
| Product frontend (`web/`) | **Live** — landing, reading, compatibility grid, blog, saved charts, settings, admin CMS |
| Auth + saved charts | **Live** — bcrypt + JWT cookie, SQLite persistence |
| Chat (`/v1/chat`) | **Built, dormant** — Z.AI GLM-5.2 (default) with astrology-only guardrail; 503 until `ZAI_API_KEY` is set in the container |
| Hosting | **Live** — `https://nataltruth.com/` + `https://nataltruth.135.181.44.161.sslip.io/` (SPA + same-origin API), `https://api.nataltruth.com/` (API only) |
| Plans / payments | **Not built** — free-value-first for now |

## Use the app

- **The product (the 12 pages):** <https://nataltruth.com> or <https://nataltruth.135.181.44.161.sslip.io>
- **The API only:** <https://api.nataltruth.com/health>
- The SPA talks **same-origin** to `/v1/*` and `/api/*`; no CORS, no key required for free use.

```bash
# Quick smoke (no key needed):
curl -s https://nataltruth.com/api/posts | jq '.posts | length'
curl -s -X POST https://nataltruth.com/v1/name/pythagorean \
  -H 'content-type: application/json' \
  -d '{"fullName":"Jane Example"}' | jq '.result'
```

## Capacity (free at this scale)

At **~100 clients/month** every layer is free:

- **Calculation engine** — runs in-container. A full chart costs ~40 ms. 100 users × 5 charts = 500 calcs/month, negligible.
- **SQLite** — in-container. Handles thousands of reads/writes per second; no DB bill.
- **Geocoding (OpenStreetMap Nominatim)** — free, 1 req/sec public limit. At 100 users this is never the bottleneck.
- **Hosting (this server + Caddy + TLS)** — already paid. Caddy auto-renews certs.
- **The only paid thing: the chat model.** Z.AI GLM-5.2 bills per token. At 100 users × ~10 chat turns × ~2K tokens = ~2M tokens/month — typically well under $5. Disable `/v1/chat` (don't set `ZAI_API_KEY`) and the bill is $0; the rest of the app keeps working.

## Chat model + guardrail

- Default provider: **Z.AI GLM-5.2** (`ZAI_API_KEY`, optional `ZAI_BASE_URL`, `ZAI_MODEL`). OpenRouter remains as a fallback if only `OPENROUTER_API_KEY` is set.
- The chat endpoint **refuses non-astrology requests** (code, homework, general Q&A, content drafting, translation) at two layers:
  1. Cheap regex pre-filter (costs zero tokens).
  2. System prompt that forbids inventing placements and going off-lane.
- It never fabricates chart data; if birth data is missing it asks for it.

This README will never claim "done" for something that is not done.

---

## Quick run

```bash
pnpm install
pnpm build
pnpm start          # API on http://0.0.0.0:3100

# verify the engine + docs stay honest
pnpm verify:full
```

Smoke test:

```bash
node -e "fetch('http://localhost:3100/v1/name/full',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fullName:'Jane Example',birthDate:'1990-06-15'})}).then(r=>r.json()).then(console.log)"
```

---

## Standard for the work

Truth and precision first. Deep readings must be complete, useful, and honest — never thin horoscope filler, never invented positions. See **[BRAND.md](./BRAND.md)** for the product's voice and **[ARCHITECTURE.md](./ARCHITECTURE.md)** for how it is hosted.
