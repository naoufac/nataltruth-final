import { useState } from "react";
import type { CalculateResponse, PlanetPosition } from "../lib/api";
import TrustStrip from "./TrustStrip";

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  "North Node": "☊", "South Node": "☋", Chiron: "⚷", Lilith: "⚸",
  "Part of Fortune": "⊕",
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: "text-orange-500", Earth: "text-emerald-600", Air: "text-cyan-500", Water: "text-blue-500",
};

function getElement(sign: string): string {
  const fire = ["Aries", "Leo", "Sagittarius"];
  const earth = ["Taurus", "Virgo", "Capricorn"];
  const air = ["Gemini", "Libra", "Aquarius"];
  const water = ["Cancer", "Scorpio", "Pisces"];
  if (fire.includes(sign)) return "Fire";
  if (earth.includes(sign)) return "Earth";
  if (air.includes(sign)) return "Air";
  if (water.includes(sign)) return "Water";
  return "";
}

function findPlanet(planets: PlanetPosition[], name: string) {
  return planets.find((p) => p.planet?.toLowerCase() === name);
}

function renderMarkdown(md: string): string {
  // Minimal safe markdown renderer (same as lib/markdown.ts but inline to avoid circular import).
  function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function inline(t: string): string {
    t = esc(t);
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return t;
  }
  return md.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (/^##\s/.test(trimmed)) return `<h2>${inline(trimmed.replace(/^##\s/, ""))}</h2>`;
    if (/^###\s/.test(trimmed)) return `<h3>${inline(trimmed.replace(/^###\s/, ""))}</h3>`;
    if (/^#\s/.test(trimmed)) return `<h2>${inline(trimmed.replace(/^#\s/, ""))}</h2>`;
    if (/^>\s/.test(trimmed)) return `<blockquote>${inline(trimmed.replace(/^>\s/, ""))}</blockquote>`;
    if (/^[-*]\s/.test(trimmed)) return `<li>${inline(trimmed.replace(/^[-*]\s/, ""))}</li>`;
    if (/^---$/.test(trimmed)) return `<hr />`;
    return `<p>${inline(trimmed)}</p>`;
  }).join("\n");
}

export default function Reading({ data }: { data: CalculateResponse }) {
  const { snapshot } = data;
  const sun = findPlanet(snapshot.planets, "sun");
  const moon = findPlanet(snapshot.planets, "moon");
  const risingSign = snapshot.houses?.[0]?.sign;

  const [deepReading, setDeepReading] = useState<string | null>(null);
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepError, setDeepError] = useState<string | null>(null);
  const [deepModel, setDeepModel] = useState<string>("");

  async function generateReading() {
    setDeepLoading(true);
    setDeepError(null);
    setDeepReading(null);
    try {
      const res = await fetch("/v1/reading/deep", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ snapshot }),
        signal: AbortSignal.timeout(120000),
      });
      const j = await res.json();
      if (j.ok) {
        setDeepReading(j.reading);
        setDeepModel(j.model);
      } else {
        setDeepError(j.error || "Could not generate reading.");
      }
    } catch (e) {
      setDeepError(e instanceof Error ? e.message : "Could not generate reading.");
    } finally {
      setDeepLoading(false);
    }
  }

  const topAspects = [...(snapshot.aspects || [])].sort((a, b) => (a.orb || 0) - (b.orb || 0)).slice(0, 15);

  return (
    <div className="flex flex-col gap-8">
      <TrustStrip engine={snapshot.ephemeris?.backend === "moshier" ? "Moshier" : "Swiss Ephemeris"} />

      {/* The Big Three — prominent cards */}
      <section>
        <h2 className="mb-4 text-2xl">Your Big Three</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <BigThreeCard icon="☉" label="Sun" sign={sun?.sign} degree={sun?.signDegree ?? undefined} house={sun?.house ?? undefined} element={sun?.sign ? getElement(sun.sign) : ""} />
          <BigThreeCard icon="☽" label="Moon" sign={moon?.sign} degree={moon?.signDegree ?? undefined} house={moon?.house ?? undefined} element={moon?.sign ? getElement(moon.sign) : ""} />
          <BigThreeCard icon="↑" label="Rising" sign={risingSign} degree={snapshot.houses?.[0]?.signDegree} house={1} element={risingSign ? getElement(risingSign) : ""} muted={!risingSign} />
        </div>
      </section>

      {/* Deep Reading CTA */}
      <section className="card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl">Your full reading</h2>
            <p className="mt-1 text-ink-soft">
              A comprehensive, personalized 4000+ word interpretation of your chart — covering your core identity,
              planetary deep dive, aspect dynamics, chart patterns, numerology, growth edges, and practical guidance.
              Generated by AI, grounded in your real Swiss Ephemeris positions.
            </p>
          </div>

          {!deepReading && !deepLoading && (
            <button onClick={generateReading} className="btn-primary w-fit text-base">
              ✦ Reveal my deep reading
            </button>
          )}

          {deepLoading && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-primary" />
                <p className="text-ink-soft">Generating your personalized reading (30-60 seconds)…</p>
              </div>
              <p className="text-sm text-ink-faint">This is a deep, multi-section analysis written specifically for your chart. It takes time to do well.</p>
            </div>
          )}

          {deepError && (
            <div className="flex flex-col gap-3">
              <p className="rounded-xl bg-[color:var(--bg-subtle)] px-4 py-3 text-sm text-warn">{deepError}</p>
              <button onClick={generateReading} className="btn-ghost w-fit text-sm">Try again</button>
            </div>
          )}

          {deepReading && (
            <div className="flex flex-col gap-2">
              <button onClick={generateReading} className="btn-ghost w-fit text-sm">↺ Regenerate</button>
              <p className="text-xs text-ink-faint">Generated by {deepModel}</p>
            </div>
          )}
        </div>
      </section>

      {/* Deep Reading Content */}
      {deepReading && (
        <section className="card p-6 sm:p-10">
          <div
            className="deep-reading-content max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(deepReading) }}
          />
        </section>
      )}

      {/* All Planets — detailed table */}
      <section>
        <h2 className="mb-4 text-2xl">All planetary positions</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-[color:var(--bg-subtle)] text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Planet</th>
                <th className="px-4 py-3 font-medium">Sign</th>
                <th className="px-4 py-3 font-medium">Degree</th>
                <th className="px-4 py-3 font-medium">House</th>
                <th className="px-4 py-3 font-medium">Direction</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.planets.map((p) => (
                <tr key={p.planet} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-medium">
                    <span className="mr-1.5 text-base">{PLANET_SYMBOLS[p.planet] || ""}</span>
                    {p.planet}
                  </td>
                  <td className="px-4 py-2.5">{p.sign} <span className={`text-xs ${ELEMENT_COLORS[getElement(p.sign)] || ""}`}>{getElement(p.sign)}</span></td>
                  <td className="px-4 py-2.5 font-mono">{p.signDegree.toFixed(2)}°</td>
                  <td className="px-4 py-2.5 text-ink-faint">{p.house || "—"}</td>
                  <td className="px-4 py-2.5 text-ink-faint">{p.isRetrograde ? "℞ Retrograde" : "Direct"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Houses */}
      {snapshot.houses?.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl">House cusps</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {snapshot.houses.map((h) => (
              <div key={h.house} className="card p-3 text-center">
                <p className="text-xs text-ink-faint">House {h.house}</p>
                <p className="mt-1 text-lg font-medium">{h.sign}</p>
                <p className="font-mono text-xs text-ink-faint">{h.signDegree.toFixed(1)}°</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Aspects */}
      {topAspects.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl">Key aspects</h2>
          <div className="grid gap-2">
            {topAspects.map((a, i) => (
              <div key={i} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg px-4 py-2.5 odd:bg-[color:var(--bg-subtle)]">
                <span className="font-medium">
                  <span className="text-base">{PLANET_SYMBOLS[a.planet1] || ""}</span> {a.planet1}
                  <span className="mx-2 text-ink-faint">{a.type}</span>
                  <span className="text-base">{PLANET_SYMBOLS[a.planet2] || ""}</span> {a.planet2}
                </span>
                <span className="font-mono text-xs text-ink-faint">orb {a.orb.toFixed(2)}°</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Patterns */}
      {snapshot.patterns?.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl">Chart patterns</h2>
          <div className="flex flex-col gap-3">
            {snapshot.patterns.slice(0, 6).map((p, i) => (
              <div key={i} className="card border-l-4 border-l-primary p-5">
                <div className="flex items-center justify-between">
                  <p className="font-serif text-lg text-primary">
                    {p.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </p>
                  <span className="font-mono text-xs text-ink-faint">{(p.strength || 0).toFixed(0)}/100</span>
                </div>
                {p.planets && p.planets.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-ink-faint">{p.planets.join(" · ")}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Numerology */}
      {snapshot.numerology?.systems && (
        <section>
          <h2 className="mb-4 text-2xl">Name numerology — five traditions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(snapshot.numerology.systems).map(([id, s]: [string, any]) => (
              <div key={id} className="card p-4">
                <p className="text-xs uppercase tracking-wide text-ink-faint">{id}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-medium">{s.total}</span>
                  {s.reduced !== undefined && s.reduced !== s.total && (
                    <span className="text-ink-faint">→ {s.reduced}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {snapshot.numerology.coreNumbers && (
            <div className="mt-3 card p-5">
              <p className="mb-3 text-xs uppercase tracking-wide text-ink-faint">Core numbers</p>
              <div className="flex flex-wrap gap-6">
                {Object.entries(snapshot.numerology.coreNumbers).map(([k, v]: [string, any]) => (
                  <div key={k} className="flex items-baseline gap-2">
                    <span className="text-sm text-ink-faint">{k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}:</span>
                    <span className="font-mono text-lg font-medium">{v ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function BigThreeCard({ icon, label, sign, degree, house, element, muted }: {
  icon: string;
  label: string;
  sign?: string;
  degree?: number;
  house?: number;
  element?: string;
  muted?: boolean;
}) {
  return (
    <div className={`card p-5 ${muted ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        {element && <span className={`text-xs font-medium ${ELEMENT_COLORS[element] || ""}`}>{element}</span>}
      </div>
      <p className="mt-3 text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="font-serif text-2xl">{sign ?? "—"}</p>
      {degree !== undefined && (
        <p className="font-mono text-sm text-ink-soft">{degree.toFixed(2)}°</p>
      )}
      {house !== undefined && (
        <p className="mt-1 text-xs text-ink-faint">House {house}</p>
      )}
    </div>
  );
}
