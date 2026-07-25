# Architecture

## What this repo is

`nataltruth-final` is the **canonical** NatalTruth codebase. It consolidates the validated calculation engine (formerly the `NatalTruth-v2` public repo) and rebuilds the product surface around it from scratch.

```
            ┌──────────────────────────────────────────┐
            │              web/ (frontend)             │
            │   fresh build · brand tokens · shareable │
            └───────────────────┬──────────────────────┘
                                │ HTTPS (same origin)
            ┌───────────────────▼──────────────────────┐
            │            server/ (Express API)         │
            │   13 calculation endpoints · /health     │
            └───────────────────┬──────────────────────┘
                                │ in-process import
            ┌───────────────────▼──────────────────────┐
            │            engine/ (pure calc)           │
            │  ephemeris · patterns · name systems     │
            │  Swiss + Moshier · TS · no I/O           │
            └──────────────────────────────────────────┘
```

The engine is **pure TypeScript with no network or disk I/O** — deterministic functions from birth/name input to a structured snapshot. The server is a thin Express layer that validates input (zod) and maps engine output to HTTP. This separation keeps the calc machine auditable and reusable.

---

## The calculation engine

| File | Responsibility |
|------|----------------|
| `engine/src/ephemeris.ts` | Swiss + Moshier planetary positions, house cusps, julian-day math |
| `engine/src/birthMoment.ts` | Resolve birth date/time/place/offset → UTC + julian day |
| `engine/src/calculate.ts` | Assemble the full chart snapshot (orchestrates the rest) |
| `engine/src/patterns.ts` | Detect grand trine, t-square, yod, stellium, grand cross |
| `engine/src/nameSystems.ts` | Pythagorean, Chaldean, Abjad, Hebrew, Vedic + full profile |
| `engine/src/gematria.ts` | Re-exports |
| `engine/src/index.ts` | Public barrel |

**Truth contract:** every chart snapshot always contains planets · 12 houses · aspects · patterns · the multi-system name profile. No lite mode. Missing input is reported, not faked.

The truth discipline is enforced by `scripts/verify-truth-layer.mjs`, which drives the real shipped functions and asserts the docs do not overclaim.

---

## Hosting (this server)

This host already has the routing scaffold in place. The target topology:

```
public DNS  →  Caddy (TLS)  →  NatalTruth container (Node API)
                           →  /var/www/nataltruth (static web build)
```

| Piece | Current state | Target |
|-------|---------------|--------|
| `NatalTruth` docker container | `ubuntu:24.04`, `sleep infinity`, mount `/var/lib/NatalTruth/data → /data` | Node runtime + built API, serving on the container's port |
| Caddy | Routes `nataltruth.<ip>.sslip.io/api/*` → `172.17.0.6:8000`; root → `/var/www/nataltruth` | Point `/api/*` at the Node API port; root serves the fresh `web/` build |
| `/var/www/nataltruth` | Old CRA SPA build | Fresh `web/` production build |
| `ephemeris.<ip>.sslip.io` → `127.0.0.1:8717` | Nothing listening | Optional dedicated calc subdomain |

Deploy sequence (to be executed in the hosting phase):
1. Install Node 20+ in the `NatalTruth` container.
2. Copy this repo into the container (or mount `/var/lib/NatalTruth/data`).
3. `pnpm install --frozen-lockfile && pnpm build`.
4. Run `pnpm start` (port from `PORT` env). Keep alive with a process manager (pm2 or a tiny systemd-style supervisor inside the container).
5. Update the Caddyfile `/api/*` reverse-proxy target to the container's Node port.
6. Build `web/` and rsync to `/var/www/nataltruth`.

Secrets (OpenRouter key for the future chat endpoint) are supplied via environment / GitHub secrets — never committed.

---

## Relationship to the older stacks (clarity, not preservation)

| Repo | Status |
|------|--------|
| `naoufac/NatalTruth-v2` (public, TS) | **Source of the engine.** Its validated engine + truth-layer script were lifted into this repo. Superseded here. |
| `naoufac/natal-truth` (private, Python) | A parallel rebuild (FastAPI + Mongo + auth). Distinct engine (fewer patterns, no name systems). **Not the canonical path.** Its honest-uncertainty handling is worth porting into the TS engine later. |
| `nataltruth-final` (this repo) | **Canonical going forward.** |

Old internal codename **"Gab44"** is retired and must not be reintroduced.

---

## Public vs. this host

- `nataltruth.com` (and `api.nataltruth.com`) currently resolve to separate cPanel hosting. That public surface can later be repointed at this host, or this host can serve as staging via the sslip.io domain. Either way, this repo is the source of truth for the code.
