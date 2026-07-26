import type { CalculateResponse, PlanetPosition } from "../lib/api";
import TrustStrip from "./TrustStrip";

function findPlanet(planets: PlanetPosition[], name: string) {
  return planets.find((p) => p.planet?.toLowerCase() === name);
}

const SIGN_QUALITIES: Record<string, string> = {
  Aries: "bold, pioneering, and direct. You lead with courage.",
  Taurus: "grounded, patient, and sensual. You build with steady hands.",
  Gemini: "curious, witty, and communicative. You connect through ideas.",
  Cancer: "caring, intuitive, and protective. You nurture what matters.",
  Leo: "confident, warm, and creative. You shine when you express yourself.",
  Virgo: "precise, helpful, and analytical. You perfect the details.",
  Libra: "diplomatic, fair, and charming. You create harmony.",
  Scorpio: "passionate, deep, and transformative. you go where others won't.",
  Sagittarius: "adventurous, honest, and philosophical. You seek truth.",
  Capricorn: "disciplined, ambitious, and strategic. You build to last.",
  Aquarius: "original, independent, and visionary. You see the future.",
  Pisces: "compassionate, artistic, and intuitive. You feel what others miss.",
};

const ASPECT_PLAIN: Record<string, string> = {
  Conjunction: "merged energy — concentrated power",
  Sextile: "an easy opportunity, if you act on it",
  Square: "productive friction that forces growth",
  Trine: "natural flow and talent",
  Opposition: "a balance to strike between two pulls",
};

const PATTERN_PLAIN: Record<string, string> = {
  grand_trine: "A Grand Trine — three points of natural ease and talent.",
  t_square: "A T-Square — tension that drives achievement.",
  yod: "A Yod — a 'finger of fate' pointing at a special purpose.",
  stellium: "A Stellium — concentrated energy in one area of life.",
  grand_cross: "A Grand Cross — four-way tension demanding integration.",
};

export default function Reading({ data }: { data: CalculateResponse }) {
  const { snapshot } = data;
  const sun = findPlanet(snapshot.planets, "sun");
  const moon = findPlanet(snapshot.planets, "moon");
  const risingSign = snapshot.houses?.[0]?.sign;

  return (
    <div className="flex flex-col gap-10">
      <TrustStrip engine={snapshot.ephemeris?.backend === "moshier" ? "Moshier" : "Swiss Ephemeris"} />

      {/* Section 1: Your Big Three — the headline */}
      <section className="card overflow-hidden">
        <div className="border-b border-line bg-[color:var(--bg-subtle)] px-6 py-4 sm:px-8">
          <p className="text-sm uppercase tracking-wide text-ink-faint">Your chart at a glance</p>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-3 sm:gap-4 sm:p-8">
          <BigThreeCard
            label="Sun"
            sign={sun?.sign}
            degree={sun?.signDegree}
            meaning={sun?.sign ? SIGN_QUALITIES[sun.sign] : undefined}
            note="Your core identity"
          />
          <BigThreeCard
            label="Moon"
            sign={moon?.sign}
            degree={moon?.signDegree}
            meaning={moon?.sign ? SIGN_QUALITIES[moon.sign] : undefined}
            note="Your emotional world"
          />
          <BigThreeCard
            label="Rising"
            sign={risingSign}
            meaning={risingSign ? SIGN_QUALITIES[risingSign] : undefined}
            note={risingSign ? "How you meet the world" : "Needs birth time"}
            muted={!risingSign}
          />
        </div>
      </section>

      {/* Section 2: What this means — plain language interpretation */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl">What this means for you</h2>
        <div className="mt-4 space-y-4 text-ink-soft">
          <p>
            Your <strong className="text-ink">Sun in {sun?.sign}</strong> means your core self is{" "}
            {sun?.sign ? SIGN_QUALITIES[sun.sign]?.toLowerCase().replace(/\.$/, "") : "developing"}.
            This is the central project of who you are becoming.
          </p>
          <p>
            Your <strong className="text-ink">Moon in {moon?.sign}</strong> describes your inner
            emotional climate — how you process feelings and find comfort.
            {moon?.sign ? ` Think of it as your emotional foundation: ${SIGN_QUALITIES[moon.sign]?.toLowerCase()}` : ""}
          </p>
          {risingSign ? (
            <p>
              Your <strong className="text-ink">Rising sign in {risingSign}</strong> is the first
              impression you give — the lens through which others meet you before they know you well.
            </p>
          ) : (
            <p className="text-warn">
              We couldn't calculate your Rising sign because no birth time was provided. That's honest —
              we won't invent one.
            </p>
          )}
        </div>
      </section>

      {/* Section 3: All planets — clean table */}
      <section>
        <h2 className="text-2xl">All your planets</h2>
        <p className="mt-1 text-sm text-ink-faint">Exact positions, to the arc-minute.</p>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-[color:var(--bg-subtle)] text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Planet</th>
                <th className="px-4 py-3 font-medium">Sign</th>
                <th className="px-4 py-3 font-medium">Degree</th>
                <th className="px-4 py-3 font-medium">Direction</th>
                {snapshot.houses?.length > 0 && <th className="px-4 py-3 font-medium">House</th>}
              </tr>
            </thead>
            <tbody>
              {snapshot.planets.map((p) => (
                <tr key={p.planet} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-medium">{p.planet}</td>
                  <td className="px-4 py-2.5">{p.sign}</td>
                  <td className="px-4 py-2.5 font-mono">{p.signDegree.toFixed(2)}°</td>
                  <td className="px-4 py-2.5 text-ink-faint">{p.isRetrograde ? "℞ Retrograde" : "Direct"}</td>
                  {snapshot.houses?.length > 0 && <td className="px-4 py-2.5 text-ink-faint">{p.house || "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Key aspects — in plain language */}
      {snapshot.aspects.length > 0 && (
        <section>
          <h2 className="text-2xl">How your planets interact</h2>
          <p className="mt-1 text-sm text-ink-faint">
            The conversations between your planets — what's easy, what creates growth.
          </p>
          <div className="mt-4 grid gap-2">
            {snapshot.aspects.slice(0, 12).map((a, i) => (
              <div key={i} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg px-4 py-2.5 odd:bg-[color:var(--bg-subtle)]">
                <span className="font-medium">
                  {a.planet1} <span className="text-ink-faint">·</span> {a.type} <span className="text-ink-faint">·</span> {a.planet2}
                </span>
                <span className="text-sm text-ink-soft">
                  {ASPECT_PLAIN[a.type] ?? a.type}
                  <span className="ml-2 font-mono text-xs text-ink-faint">orb {a.orb.toFixed(1)}°</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 5: Patterns */}
      {snapshot.patterns.length > 0 && (
        <section>
          <h2 className="text-2xl">Notable patterns in your chart</h2>
          <div className="mt-4 flex flex-col gap-3">
            {snapshot.patterns.slice(0, 5).map((p, i) => (
              <div key={i} className="card border-l-4 border-l-primary p-5">
                <p className="font-serif text-lg text-primary">
                  {p.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {PATTERN_PLAIN[p.type] ?? p.description?.split(".")[0] ?? "A significant configuration."}
                </p>
                {p.planets && p.planets.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-ink-faint">{p.planets.join(" · ")}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 6: Name numerology */}
      {snapshot.numerology?.systems && (
        <section>
          <h2 className="text-2xl">Your name in numbers</h2>
          <p className="mt-1 text-sm text-ink-faint">
            Five traditions, each mapping your letters to numbers differently.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(snapshot.numerology.systems).map(([id, s]) => (
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
            <div className="mt-4 card p-5">
              <p className="text-xs uppercase tracking-wide text-ink-faint mb-3">Core numbers</p>
              <div className="flex flex-wrap gap-4">
                {Object.entries(snapshot.numerology.coreNumbers).map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-2">
                    <span className="text-sm text-ink-faint">{k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}:</span>
                    <span className="font-mono text-lg font-medium">{v}</span>
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

function BigThreeCard({
  label,
  sign,
  degree,
  meaning,
  note,
  muted,
}: {
  label: string;
  sign?: string;
  degree?: number;
  meaning?: string;
  note: string;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "opacity-60" : ""}>
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 font-serif text-3xl">{sign ?? "—"}</p>
      {degree !== undefined && (
        <p className="font-mono text-sm text-ink-soft">{degree.toFixed(2)}°</p>
      )}
      <p className="mt-2 text-xs text-ink-faint">{note}</p>
      {meaning && !muted && (
        <p className="mt-2 text-sm text-ink-soft">{meaning}</p>
      )}
    </div>
  );
}
