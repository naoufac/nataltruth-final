# NatalTruth Calculation API — contract

**Base URL (staging):** `https://nataltruth.<host>.sslip.io` · **Public:** `https://api.nataltruth.com`
**Version:** 1.0.0 · **Status:** Chart + name APIs validated (stress-tested 10× each).

Only the endpoints listed here are live. Nothing else is implied. Every chart response is always full — there is no lite mode.

---

## Chart engines

| Engine | Route | Notes |
|--------|-------|-------|
| **Swiss Ephemeris** | `POST /calculate/swiss` | High precision. Default. |
| **Moshier** | `POST /calculate/moshier` | Semi-analytic cross-check; no external ephemeris files. |
| Generic | `POST /calculate` | Body field `engineMode: "swiss" \| "moshier"` (default `swiss`). |

### Request body (JSON)

```json
{
  "fullName": "Jane Example",
  "birthDate": "1990-06-15",
  "birthTime": "14:30",
  "birthTimeAccuracy": "exact | approximate | unknown",
  "birthPlaceLabel": "Casablanca, Morocco",
  "latitude": 33.5731,
  "longitude": -7.5898,
  "utcOffset": "+01:00",
  "engineMode": "swiss"
}
```

Required: `fullName`, `birthDate` (YYYY-MM-DD), `birthTimeAccuracy`, `birthPlaceLabel`, `latitude`, `longitude`. Optional: `birthTime` (HH:mm), `timeZoneId` (IANA), `utcOffset` (strongly recommended), `houseSystem` (default Placidus), `engineMode`.

When `birthTimeAccuracy` is `unknown`, local noon is used and flagged in `moment.notes`.

### Success response (always full)

Top-level convenience fields mirror a nested `snapshot`:

| Block | Top-level | In `snapshot` | Contents |
|-------|-----------|---------------|----------|
| Planets | `planetaryPositions` | `planets` | Sun→Pluto, Node, Chiron, PoF, S.Node, Lilith… |
| Houses | `houseCusps` | `houses` | 12 cusps (Placidus default) |
| Aspects | `aspects` | `aspects` | Full list with orbs |
| Patterns | `patterns` | `patterns` | grand_trine, t_square, yod, stellium, grand_cross |
| Name | `name` | `numerology` | Full multi-system profile |

```json
{
  "ok": true,
  "engineMode": "swiss",
  "ephemeris": { "backend": "swiss", "flag": 2, "description": "…" },
  "planetaryPositions": [ … ],
  "houseCusps": [ … ],
  "aspects": [ … ],
  "patterns": [ … ],
  "name": { … },
  "snapshot": {
    "version": 1,
    "engineMode": "swiss",
    "ephemeris": { … },
    "input": { … },
    "moment": { "utcIso": "…", "julianDay": 2448057.5, "notes": [] },
    "planets": [ … ],
    "houses": [ … ],
    "aspects": [ … ],
    "patterns": [ … ],
    "numerology": { … },
    "computedAt": "2026-07-25T12:00:00.000Z"
  }
}
```

Errors: `{ "ok": false, "error": "human-readable message" }`.

---

## Name / letter systems

| System | Range | Route |
|--------|-------|-------|
| Pythagorean | 1–9, Latin | `POST /name/pythagorean` |
| Chaldean | 1–8 (no letter 9) | `POST /name/chaldean` |
| Arabic Abjad | 1–1000, Arabic script | `POST /name/abjad` |
| Hebrew (Mispar Hechrechi) | 1–400, Hebrew script | `POST /name/hebrew` |
| Indian (Vedic) | 1–8, Chaldean on Latin | `POST /name/vedic` |
| **All at once** | — | `POST /name/full` |
| List systems | — | `GET /name/systems` |
| Alias | — | `POST /gematria` |

Name body: `{ "fullName": "…", "birthDate": "YYYY-MM-DD" }` (`birthDate` optional except for `/gematria` and core-number fields in `/full`).

**Truth:** Abjad requires Arabic letters; Hebrew requires Hebrew letters. Latin-only input correctly returns total `0` for those two systems — that is documented behavior, not a bug.

---

## Health & capability inventory

`GET /health` → service version + the list of engines, patterns, and routes. Process liveness + a machine-readable capability map (not a product surface).

---

## Patterns (always returned on calculate)

| Type | Meaning |
|------|---------|
| `grand_trine` | Three ~120° links — ease/flow |
| `t_square` | Opposition + squares — drive via tension |
| `yod` | Quincunx "finger" — adjustment |
| `stellium` | Cluster of planets — concentration |
| `grand_cross` | Four-way tension structure |

Each pattern item includes type, planets, strength, description.

---

## Validation discipline

`scripts/verify-truth-layer.mjs` drives the real shipped engine functions and asserts the docs above do not overclaim. Run `pnpm verify:full` before any release. Exit 0 is mandatory.
