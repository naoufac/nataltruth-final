# Frontend inventory (exact capture)

**Source:** https://github.com/naoclaw/Gab44-V2/tree/main/frontend  
**Branch:** `main`  
**Local path:** `NatalTruth/frontend/`  
**Also saved:** `~/Downloads/NatalTruth/frontend/`  

**Rule:** This folder is a **verbatim** copy of that tree. Not mixed with `engine/` or `server/`. No API rewiring in this step.

## Integrity

- File count: **93** (source files; plus local `SOURCE.txt` / this inventory only)
- `diff -rq` vs GitHub zip extract: **identical** (excluding local provenance files)

### SHA-256 (key files)

| File | SHA-256 |
|------|---------|
| package.json | fef3acf858a1da7dfc75c98a23547e4e3e5a622274aa805a8ae0f40d83e54bdd |
| src/App.js | 3e6ce36eb839db4312f5dcf49bc4c3147661e85de54d135d2a522b00bdc0261c |
| src/index.js | 1699479f57b88a6600dba09d6326347bdd3c499102c53b2cc80663fb6fb72ec4 |
| src/pages/LandingPage.jsx | ec6f0295d804e0c127d7988dce981b0594ccc08aaf15b7b19519e2d580f7934d |
| src/pages/Dashboard.jsx | 9ee5a40ffbc13d98186c5393b41c35d418bac06f9af6707ba0e520eb3cc768ca |
| craco.config.js | a5947f15f67dca646dc63d9eab7bfcffcff5f8626d4c3450d5799496090e9db7 |
| tailwind.config.js | 9f3197c940756f91aa3f5998557328b762fc8c44dc953953760a3f17f41e10b2 |

## Stack (as-is)

| Item | Value |
|------|--------|
| Package name | `frontend` |
| React | 19 + CRA/craco |
| Router | react-router-dom 7 |
| Styling | Tailwind 3 + Radix/shadcn UI kit |
| HTTP | axios |
| Backend URL env | `REACT_APP_BACKEND_URL` (default example `http://localhost:8001`) |
| API base in App | `` `${REACT_APP_BACKEND_URL}/api` `` |
| Auth token key (as-is) | `localStorage.gab44_token` |

## Routes (from `src/App.js`)

**Public (eager):** Landing, Auth, Pricing, VerifyEmail, ResetPassword, PublicChart, ZodiacLanding, HoroscopeToday, ReadingThanks  

**Authed (lazy):** Dashboard, Chat, Friend, Chart, Transits, Settings, ShareChart, Admin, Compatibility, Numerology, Gematria  

## Pages (`src/pages/`)

AdminPage, AuthPage, ChartPage, ChatPage, CompatibilityPage, Dashboard, FriendPage, GematriaPage, HoroscopeTodayPage, LandingPage, NumerologyPage, PricingPage, PublicChartPage, ReadingThanksPage, ResetPasswordPage, SettingsPage, ShareChartPage, TransitsPage, VerifyEmailPage, ZodiacLandingPage  

## Not done in this step

- No wiring to `api.nataltruth.com`
- No rebrand
- No push of this frontend to NatalTruth GitHub production (laptop-held until UX wiring step)
