/**
 * Durable truth-layer checks for NatalTruth.
 *
 * Drives the real shipped engine functions and asserts the canonical docs
 * (README, ARCHITECTURE, docs/API.md) agree with the code that is actually
 * shipped. No reliance on roadmap/plan files, which are banned as truth
 * sources by the workspace coding discipline.
 *
 * Run: node scripts/verify-truth-layer.mjs
 * Exit 0 only if all assertions pass.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK  :", msg);
  }
}

function readDoc(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

// ── 1) Canonical docs exist and do not overclaim ───────────────────
const README = readDoc("README.md");
const ARCH = readDoc("ARCHITECTURE.md");
const API = readDoc("docs/API.md");

assert(/# NatalTruth/.test(README), "README.md is the NatalTruth readme");
assert(
  /Swiss Ephemeris/.test(README) && /Moshier/.test(README),
  "README names both Swiss Ephemeris and Moshier engines"
);
assert(
  /Pythagorean/.test(README) && /Chaldean/.test(README) && /Abjad/.test(README) && /Hebrew/.test(README) && /Vedic/.test(README),
  "README names all five name-letter systems"
);
assert(/pnpm verify:full/.test(README), "README documents the verify:full gate");
assert(/Precision natal astrology/.test(README), "README opens with the product promise");

assert(/engine\//.test(ARCH) && /server\//.test(ARCH) && /web\//.test(ARCH), "ARCHITECTURE describes the three layers");
assert(/pure TypeScript/.test(ARCH), "ARCHITECTURE documents the engine as pure TS");

assert(/POST \/v1\/calculate/.test(API), "docs/API.md documents POST /v1/calculate");
assert(/POST \/v1\/calculate\/swiss/.test(API), "docs/API.md documents the swiss route");
assert(/POST \/v1\/calculate\/moshier/.test(API), "docs/API.md documents the moshier route");
assert(/POST \/v1\/name\/full/.test(API), "docs/API.md documents /v1/name/full");
assert(/GET \/health/.test(API), "docs/API.md documents GET /health");
assert(/grand_trine|t_square|yod|stellium|grand_cross/.test(API), "docs/API.md lists the detected pattern types");

// ── 2) Server route surface matches what the contract lists ───────
const serverSrc = readDoc("server/src/index.ts");
const requiredRoutes = [
  ['app.get("/health"', "GET /health"],
  ['app.post("/v1/calculate"', "POST /v1/calculate"],
  ['app.post("/v1/calculate/swiss"', "POST /v1/calculate/swiss"],
  ['app.post("/v1/calculate/moshier"', "POST /v1/calculate/moshier"],
  ['app.get("/v1/name/systems"', "GET /v1/name/systems"],
  ['app.post("/v1/name/full"', "POST /v1/name/full"],
  ['app.post("/v1/gematria"', "POST /v1/gematria"],
  ["`/v1/name/${id}`", "POST /v1/name/:system loop"],
];
for (const [needle, label] of requiredRoutes) {
  assert(serverSrc.includes(needle), `server/src/index.ts registers ${label}`);
}
assert(
  serverSrc.includes("planetaryPositions: snapshot.planets"),
  "server maps planetaryPositions from snapshot.planets"
);
assert(
  serverSrc.includes("houseCusps: snapshot.houses"),
  "server maps houseCusps from snapshot.houses"
);

// ── 3) Drive real shipped name engine (not a reimplementation) ────
const nameModPath = join(ROOT, "engine/src/nameSystems.ts");
assert(existsSync(nameModPath), "engine/src/nameSystems.ts exists");

async function loadNameSystems() {
  const distJs = join(ROOT, "dist/engine/src/nameSystems.js");
  if (existsSync(distJs)) {
    return import(pathToFileURL(distJs).href);
  }
  execSync("pnpm exec tsc --noEmit false --outDir dist", { cwd: ROOT, stdio: "inherit" });
  assert(existsSync(distJs), "dist/engine/src/nameSystems.js exists after build");
  return import(pathToFileURL(distJs).href);
}

const nameApi = await loadNameSystems();
assert(
  typeof nameApi.calculateFullNameProfile === "function",
  "exported calculateFullNameProfile is a function"
);

const profile = nameApi.calculateFullNameProfile("Jane Example", "1990-06-15");
assert(profile.fullName === "Jane Example", "profile.fullName preserved");
assert(profile.birthDate === "1990-06-15", "profile.birthDate preserved");
assert(!!profile.systems, "profile.systems present");
for (const id of ["pythagorean", "chaldean", "abjad", "hebrew", "vedic"]) {
  assert(!!profile.systems[id], `systems.${id} present`);
  assert(
    typeof profile.systems[id].total === "number",
    `systems.${id}.total is number`
  );
}
// Latin name → abjad/hebrew totals 0 (documented truth)
assert(
  profile.systems.abjad.total === 0,
  "Latin input → abjad total 0 (documented)"
);
assert(
  profile.systems.hebrew.total === 0,
  "Latin input → hebrew total 0 (documented)"
);
// Pythagorean on "Jane Example" — drive real function, assert non-zero + reduced digit
assert(
  profile.systems.pythagorean.total > 0,
  "Pythagorean total > 0 for Latin name"
);
assert(
  profile.systems.pythagorean.reduced === 7 ||
    profile.systems.pythagorean.total === 43,
  `Pythagorean matches live sample (total=43 reduced=7); got total=${profile.systems.pythagorean.total} reduced=${profile.systems.pythagorean.reduced}`
);
assert(!!profile.coreNumbers, "coreNumbers present");
assert(
  profile.coreNumbers.lifePathNumber === 4,
  `lifePath for 1990-06-15 is 4 (got ${profile.coreNumbers.lifePathNumber})`
);

// Single-system handlers (shipped)
const py = nameApi.calculatePythagorean("Jane Example");
assert(py.system === "pythagorean", "calculatePythagorean.system id");
assert(py.total === profile.systems.pythagorean.total, "pythagorean total consistent with full profile");

const systemsList = nameApi.listLetterSystems();
assert(Array.isArray(systemsList) && systemsList.length === 5, "listLetterSystems returns 5");

// ── 4) Drive real chart calculate (shipped engine) ────────────────
async function loadCalculate() {
  const distJs = join(ROOT, "dist/engine/src/calculate.js");
  if (!existsSync(distJs)) {
    execSync("pnpm exec tsc --noEmit false --outDir dist", { cwd: ROOT, stdio: "inherit" });
  }
  assert(existsSync(distJs), "dist/engine/src/calculate.js exists");
  return import(pathToFileURL(distJs).href);
}

const calcApi = await loadCalculate();
assert(
  typeof calcApi.calculateFullChart === "function",
  "exported calculateFullChart is a function"
);

const snapshot = await calcApi.calculateFullChart({
  fullName: "Jane Example",
  birthDate: "1990-06-15",
  birthTime: "14:30",
  birthTimeAccuracy: "exact",
  birthPlaceLabel: "Casablanca, Morocco",
  latitude: 33.5731,
  longitude: -7.5898,
  utcOffset: "+01:00",
  engineMode: "swiss",
});

assert(snapshot.version === 1, "snapshot.version === 1");
assert(snapshot.engineMode === "swiss", "snapshot.engineMode swiss");
assert(
  Array.isArray(snapshot.planets) && snapshot.planets.length >= 10,
  `snapshot.planets present (len=${snapshot.planets?.length})`
);
assert(
  Array.isArray(snapshot.houses) && snapshot.houses.length === 12,
  `snapshot.houses length 12 (got ${snapshot.houses?.length})`
);
assert(
  Array.isArray(snapshot.aspects) && snapshot.aspects.length > 0,
  `snapshot.aspects non-empty (len=${snapshot.aspects?.length})`
);
assert(
  Array.isArray(snapshot.patterns),
  `snapshot.patterns is array (len=${snapshot.patterns?.length})`
);
assert(
  snapshot.numerology != null && typeof snapshot.numerology === "object",
  "snapshot.numerology present"
);
assert(
  !!snapshot.numerology?.systems,
  `snapshot.numerology.systems present (keys=${snapshot.numerology ? Object.keys(snapshot.numerology) : "null"})`
);
assert(
  snapshot.ephemeris != null && typeof snapshot.ephemeris === "object",
  `snapshot.ephemeris present (keys=${snapshot ? Object.keys(snapshot) : "null"})`
);
assert(
  snapshot.ephemeris?.backend === "swiss",
  `ephemeris.backend is swiss for swiss mode (got ${snapshot.ephemeris?.backend})`
);

// Astronomical sanity: mid-June 1990 Sun is in tropical Gemini
const sun = snapshot.planets.find((p) => p.planet === "Sun");
assert(!!sun, "Sun present in snapshot");
assert(
  sun?.sign === "Gemini",
  `Sun in Gemini for 1990-06-15 (got ${sun?.sign})`
);

// ── 4b) Anti-invention checks: every shipped planet/sign/house is internally consistent.
//       This is the durable purpose of the "no-lies bridge": the engine must never ship
//       a fabricated, NaN, out-of-range, or self-contradictory placement to a reading.
const ZODIAC = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

for (const p of snapshot.planets) {
  assert(typeof p.planet === "string" && p.planet.length > 0, `planet "${p.planet}" has a name`);
  assert(
    isFiniteNumber(p.longitude) && p.longitude >= 0 && p.longitude < 360,
    `${p.planet} longitude in [0,360) (got ${p.longitude})`
  );
  assert(isFiniteNumber(p.signDegree), `${p.planet} signDegree is finite (got ${p.signDegree})`);
  // Sign must match floor(longitude / 30)
  const expectedSign = ZODIAC[Math.floor(p.longitude / 30) % 12];
  assert(
    p.sign === expectedSign,
    `${p.planet} sign "${p.sign}" matches floor(longitude/30) → ${expectedSign}`
  );
  // signDegree must equal longitude mod 30 (within 1e-6 tolerance)
  const expectedDeg = p.longitude % 30;
  assert(
    Math.abs(p.signDegree - expectedDeg) < 1e-6,
    `${p.planet} signDegree ${p.signDegree} === longitude mod 30 ${expectedDeg}`
  );
  assert(
    typeof p.isRetrograde === "boolean",
    `${p.planet} isRetrograde is boolean (got ${typeof p.isRetrograde})`
  );
}

// Houses: 12 distinct, in [0,360)
assert(new Set(snapshot.houses.map(h => h.house)).size === 12, "12 distinct house numbers");
for (const h of snapshot.houses) {
  assert(
    isFiniteNumber(h.longitude) && h.longitude >= 0 && h.longitude < 360,
    `house ${h.house} cusp in [0,360) (got ${h.longitude})`
  );
  const expectedSign = ZODIAC[Math.floor(h.longitude / 30) % 12];
  assert(
    h.sign === expectedSign,
    `house ${h.house} sign matches floor(longitude/30)`
  );
}

// Aspects only reference planets that actually exist
const planetNames = new Set(snapshot.planets.map(p => p.planet));
for (const a of snapshot.aspects) {
  assert(planetNames.has(a.planet1), `aspect "${a.type}" planet1 "${a.planet1}" is a real planet`);
  assert(planetNames.has(a.planet2), `aspect "${a.type}" planet2 "${a.planet2}" is a real planet`);
  assert(isFiniteNumber(a.orb) && a.orb >= 0, `aspect ${a.planet1}-${a.planet2} orb is non-negative finite`);
  assert(isFiniteNumber(a.angle) && a.angle >= 0 && a.angle <= 180, `aspect ${a.planet1}-${a.planet2} angle in [0,180]`);
}

// Patterns only reference planets that actually exist
for (const pat of snapshot.patterns) {
  assert(Array.isArray(pat.planets), `pattern ${pat.type} has planets array`);
  for (const name of pat.planets || []) {
    assert(planetNames.has(name), `pattern ${pat.type} references real planet "${name}"`);
  }
  if (pat.strength !== undefined) {
    assert(
      isFiniteNumber(pat.strength) && pat.strength >= 0 && pat.strength <= 100,
      `pattern ${pat.type} strength in [0,100] (got ${pat.strength})`
    );
  }
}

// Moshier same shape
const snapM = await calcApi.calculateFullChart({
  fullName: "Jane Example",
  birthDate: "1990-06-15",
  birthTime: "14:30",
  birthTimeAccuracy: "exact",
  birthPlaceLabel: "Casablanca, Morocco",
  latitude: 33.5731,
  longitude: -7.5898,
  utcOffset: "+01:00",
  engineMode: "moshier",
});
assert(snapM.engineMode === "moshier", "moshier engineMode");
assert(
  Array.isArray(snapM.planets) && snapM.planets.length === snapshot.planets.length,
  "moshier same planet count as swiss"
);
assert(Array.isArray(snapM.houses) && snapM.houses.length === 12, "moshier 12 houses");
assert(Array.isArray(snapM.aspects), "moshier aspects array");
assert(Array.isArray(snapM.patterns), "moshier patterns array");

// ── Summary ───────────────────────────────────────────────────────
if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll truth-layer assertions passed.");
process.exit(0);
