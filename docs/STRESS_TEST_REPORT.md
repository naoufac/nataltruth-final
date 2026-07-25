# NatalTruth stress test report

- Base: `http://api.nataltruth.com`
- Calls per endpoint: **10** (140 total)
- Generated: 2026-07-14T19:38:36.745Z
- Overall: **PASS 100%**

| Endpoint | Path | Success | Min ms | Avg ms | Max ms | Total ms | Issues |
|----------|------|---------|--------|--------|--------|----------|--------|
| health | `/health` | 10/10 | 223.88 | 283.28 | 548.98 | 2832.77 | — |
| calculate-swiss | `/v1/calculate/swiss` | 10/10 | 227.36 | 257.27 | 317.27 | 2572.74 | — |
| calculate-moshier | `/v1/calculate/moshier` | 10/10 | 228.5 | 279.06 | 403.72 | 2790.63 | — |
| calculate-generic-swiss | `/v1/calculate` | 10/10 | 227.5 | 243.84 | 305.17 | 2438.43 | — |
| name-systems-list | `/v1/name/systems` | 10/10 | 221.61 | 232.42 | 303.83 | 2324.17 | — |
| name-full-latin | `/v1/name/full` | 10/10 | 225.23 | 260.85 | 308.69 | 2608.5 | — |
| name-full-arabic | `/v1/name/full` | 10/10 | 224.32 | 228.31 | 237.84 | 2283.14 | — |
| name-full-hebrew | `/v1/name/full` | 10/10 | 224.4 | 233.28 | 256.78 | 2332.84 | — |
| name-pythagorean | `/v1/name/pythagorean` | 10/10 | 223.69 | 226.23 | 229.46 | 2262.32 | — |
| name-chaldean | `/v1/name/chaldean` | 10/10 | 222.5 | 254.18 | 307.43 | 2541.75 | — |
| name-abjad | `/v1/name/abjad` | 10/10 | 223.87 | 258.24 | 393.97 | 2582.44 | — |
| name-hebrew | `/v1/name/hebrew` | 10/10 | 223.48 | 255.23 | 311.48 | 2552.33 | — |
| name-vedic | `/v1/name/vedic` | 10/10 | 227.63 | 270.81 | 309.67 | 2708.09 | — |
| name-gematria-alias | `/v1/gematria` | 10/10 | 225.05 | 240.18 | 290.43 | 2401.84 | — |

## Precision validation (sample chart, post-stress)

| Check | Swiss | Moshier |
|-------|-------|---------|
| Planetary positions | 15 | 15 |
| House cusps | 12 | 12 |
| Aspects | 51 | (full list) |
| Patterns detected | grand_trine, t_square, yod, stellium (+ more) | same detectors |
| Name systems on chart | all 5 | all 5 |
| Sun lon (sample) | 84.189249° Gemini | Δ ≈ 1.1e-5° vs Swiss |

## Name systems sample totals

| System | Sample input | Total | Reduced |
|--------|--------------|-------|---------|
| Pythagorean | Jean Pierre | 56 | 11 (master) |
| Chaldean | Rajesh Kumar | 32 | 5 |
| Arabic Abjad | محمد | 92 | 2 |
| Hebrew Hechrechi | אברהם | 248 | 5 |
| Vedic (Chaldean practice) | Priya Sharma | 29 | 2 |

## Issues / misswork

| Item | Truth |
|------|--------|
| Failed API calls in stress | **None** (0/140) |
| Lite/partial chart | **None** — always full blocks |
| Missing letter systems | **None** — 5/5 installed |
| SSL browser warnings | May still apply on apex domain; API responded on HTTP and HTTPS(-k) |
| Script mismatch | Latin names → Abjad/Hebrew total 0 (expected; need native script) |

## Overall

**PASS 100%** — safe to treat this API surface as validated for the next product step.
