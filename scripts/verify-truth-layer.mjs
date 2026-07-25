/**
 * Durable truth-layer checks for NatalTruth.
 * Drives real shipped engine functions + structural checks on ROADMAP §1.1.
 *
 * Run: node scripts/verify-truth-layer.mjs
 * Exit 0 only if all assertions pass.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const require = createRequire(import.meta.url);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK  :", msg);
  }
}

// ── 1) ROADMAP 1.1 matrix structure (documentation truth) ───────────
const roadmapPath = join(ROOT, "ROADMAP.md");
assert(existsSync(roadmapPath), "ROADMAP.md exists");
const roadmap = readFileSync(roadmapPath, "utf8");

assert(
  roadmap.includes("## 1.1 Plan × calc matrix"),
  "ROADMAP contains §1.1 Plan × calc matrix heading"
);
assert(
  /LOCKED:\s*Swiss only/i.test(roadmap) ||
    /LOCKED:\s*\*\*Swiss only\*\*/i.test(roadmap) ||
    roadmap.includes("**LOCKED: Swiss only**"),
  "1.1 matrix locks Ultra report path to Swiss only"
);

// Free/$19/$49 must not invent LOCKED engine/name/report gates
const freeSection = roadmap.match(
  /### Chart engine access[\s\S]*?### Name \/ letter systems/
)?.[0];
assert(!!freeSection, "Chart engine access subsection present");
if (freeSection) {
  // Every Free / Monthly / Premium row should mark UNDECIDED for plan gates
  for (const plan of ["Free", "Monthly", "Premium"]) {
    assert(
      freeSection.includes(plan),
      `Chart matrix mentions plan row: ${plan}`
    );
  }
  // Count LOCKED occurrences in chart engine section — only Ultra report path
  const lockedHits = (freeSection.match(/\*\*LOCKED/g) || []).length;
  assert(
    lockedHits === 1,
    `Chart engine section has exactly 1 LOCKED cell (got ${lockedHits})`
  );
}

const nameSection = roadmap.match(
  /### Name \/ letter systems[\s\S]*?### Report depth/
)?.[0];
assert(!!nameSection, "Name systems subsection present");
if (nameSection) {
  const lockedName = (nameSection.match(/\*\*LOCKED/g) || []).length;
  assert(
    lockedName === 0,
    `Name systems section invents no LOCKED cells (got ${lockedName})`
  );
  assert(
    (nameSection.match(/\*\*UNDECIDED\*\*/g) || []).length >= 4,
    "Name systems section marks plan cells UNDECIDED"
  );
}

const reportSection = roadmap.match(
  /### Report depth[\s\S]*?### What is explicitly not claimed/
)?.[0];
assert(!!reportSection, "Report depth subsection present");
if (reportSection) {
  // Free/mid tiers UNDECIDED; Ultra depth UNDECIDED but Swiss lock referenced
  assert(
    reportSection.includes("**UNDECIDED**"),
    "Report depth keeps UNDECIDED cells"
  );
  assert(
    !/\|\s*Free\s*\|[^|]*\|\s*\*\*LOCKED/i.test(reportSection),
    "Free plan report depth is not LOCKED"
  );
}

assert(
  /1\.1.*\*\*PARTIAL\*\*/.test(roadmap) || roadmap.includes("**PARTIAL** — matrix written"),
  "Step 1.1 status is PARTIAL (matrix scaffold, founder fills UNDECIDED)"
);

// Phase 0.6 must cite remote audit (not bare DONE without evidence language)
assert(
  /0\.6.*\*\*DONE\*\*/.test(roadmap) &&
    /remote `main` audited|GitHub production tree/.test(roadmap),
  "Phase 0.6 DONE includes remote audit wording"
);

// ── 1b) Host status consistency + no stale "laptop only" stress claim ─
const nextUx = readFileSync(join(ROOT, "docs/NEXT_UX_UI.md"), "utf8");
assert(
  !/\*\*laptop only\*\*/i.test(nextUx) && !/laptop only/i.test(nextUx),
  "docs/NEXT_UX_UI.md does not claim stress reports are laptop-only"
);
assert(
  nextUx.includes("docs/STRESS_TEST_REPORT.md") ||
    nextUx.includes("STRESS_TEST_REPORT"),
  "NEXT_UX_UI points at stress report path"
);

const contract = readFileSync(join(ROOT, "docs/nataltruth.md"), "utf8");
const readme = readFileSync(join(ROOT, "README.md"), "utf8");
// nataltruth.com must not be called Placeholder in contract if README says live SPA
const contractHosts = contract.match(/## Hosts[\s\S]*?(?=\n## |\n\*|$)/)?.[0] || "";
assert(
  !/`nataltruth\.com`[^\n]*Placeholder/i.test(contractHosts),
  "docs/nataltruth.md Hosts: nataltruth.com is not Placeholder"
);
assert(
  /nataltruth\.com[^\n]*\*\*Live\*\*|nataltruth\.com[^\n]*Live static/i.test(
    contractHosts
  ) || contractHosts.includes("Live** static") || /`nataltruth\.com`[^\n]*\*\*Live\*\*/.test(contractHosts),
  "docs/nataltruth.md marks nataltruth.com as Live"
);
assert(
  /Live static SPA/i.test(readme),
  "README marks nataltruth.com as Live static SPA"
);
assert(
  /nao\.nataltruth\.com[^\n]*Placeholder/i.test(contractHosts) ||
    contractHosts.includes("nao.nataltruth.com") && contractHosts.includes("Placeholder"),
  "nao.nataltruth.com remains Placeholder in contract hosts"
);

// ── 2) Server route surface matches contract list ───────────────────
const serverSrc = readFileSync(join(ROOT, "server/src/index.ts"), "utf8");
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

// ── 3) Drive real shipped name engine (not a reimplementation) ──────
const nameModPath = join(ROOT, "engine/src/nameSystems.ts");
assert(existsSync(nameModPath), "engine/src/nameSystems.ts exists");

// Prefer built JS if present; else load TS via dynamic transpile of dist path after build.
// Use tsx if available, else build and import dist.
async function loadNameSystems() {
  const distJs = join(ROOT, "dist/engine/src/nameSystems.js");
  const gematriaDist = join(ROOT, "dist/engine/src/gematria.js");
  if (existsSync(distJs)) {
    return import(pathToFileURL(distJs).href);
  }
  // Try tsx register
  try {
    require("tsx/cjs");
    return import(pathToFileURL(nameModPath).href);
  } catch {
    /* fall through */
  }
  // Build with tsc override noEmit
  const { execSync } = await import("node:child_process");
  execSync("pnpm exec tsc --noEmit false --outDir dist", {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (!existsSync(distJs) && existsSync(gematriaDist)) {
    // older layout: name via gematria re-export — still need nameSystems.js after rebuild
  }
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

// ── 4) Drive real chart calculate (shipped engine) ──────────────────
async function loadCalculate() {
  const distJs = join(ROOT, "dist/engine/src/calculate.js");
  if (!existsSync(distJs)) {
    const { execSync } = await import("node:child_process");
    execSync("pnpm exec tsc --noEmit false --outDir dist", {
      cwd: ROOT,
      stdio: "inherit",
    });
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

// ── Summary ────────────────────────────────────────────────────────
if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll truth-layer assertions passed.");
process.exit(0);
