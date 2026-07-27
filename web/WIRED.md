# Frontend ↔ API (full product shell, live calc)

**Direction:** existing SPA + api.nataltruth.com. No marketing-only static product pages for user tools.

## Live

| Page | API |
|------|-----|
| Chart, Transits (natal dynamics), Horoscope today | calculate swiss/moshier |
| Numerology, Gematria, Dashboard | name/full |
| Compatibility, Friend | 2× calculate + 2× name/full |
| Public chart | calculate via query params |
| Zodiac | optional live overlay + calculate |
| Chat | /chat |
| Plan | GET /v1/entitlements?email= |
| Admin (in SPA) | shows entitlement; nao host for future CMS |

## Ultra seed

`nchobah@gmail.com` → plan **ultra**, engineDefault **swiss** (`data/entitlements.json` on API host).
