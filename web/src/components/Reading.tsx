import type { CalculateResponse, PlanetPosition } from "../lib/api";
import TrustStrip from "./TrustStrip";

function findPlanet(planets: PlanetPosition[], name: string) {
  return planets.find((p) => p.name?.toLowerCase() === name);
}

const ASPECT_PLAIN: Record<string, string> = {
  conjunction: "merged energy — concentrated",
  sextile: "an easy opportunity, if you act on it",
  square: "productive friction that asks for adjustment",
  trine: "natural flow that rewards conscious use",
  opposition: "a balance to strike between two pulls",
};

const PATTERN_PLAIN: Record<string, string> = {
  grand_trine: "A Grand Trine — three points of ease that flow together.",
  t_square: "A T-Square — tension that drives achievement.",
  yod: "A Yod — a 'finger of fate' pointing at an adjustment.",
  stellium: "A Stellium — concentrated energy in one area of life.",
  grand_cross: "A Grand Cross — four-way tension demanding balance.",
};

export default function Reading({ data }: { data: CalculateResponse }) {
  const { snapshot } = data;
  const sun = findPlanet(snapshot.planets, "sun");
  const moon = findPlanet(snapshot.planets, "moon");
  const rising = snapshot.houses?.[0]; // cusp 1 = Ascendant, shown if available

  return (
    <div className="flex flex-col gap-8">
      <TrustStrip engine={snapshot.ephemeris?.backend === "moshier" ? "Moshier" : "Swiss Ephemeris"} />

      {/* Big three — the heart of the reading */}
      <section className="card p-6 sm:p-8">
        <p className="text-sm uppercase tracking-wide text-ink-faint">The big three</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <BigThree label="Sun" sign={sun?.sign} degree={sun?.degree} note="your core self" />
          <BigThree label="Moon" sign={moon?.sign} degree={moon?.degree} note="your inner world" />
          <BigThree
            label="Rising"
            sign={rising ? undefined : "—"}
            note="needs birth time"
            muted
          />
        </div>
        <p className="mt-5 text-ink-soft">
          Your Sun in <strong className="text-ink">{sun?.sign}</strong> is the shape of your core
          identity — what you&apos;re growing toward. Your Moon in{" "}
          <strong className="text-ink">{moon?.sign}</strong> describes your emotional climate: how
          you process feelings and find safety.
        </p>
      </section>

      {/* All positions — data, in mono, honest */}
      <section>
        <h2 className="text-xl">Where everything is</h2>
        <p className="mt-1 text-sm text-ink-faint">Exact positions, to the arc-minute.</p>
        <div className="card mt-4 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--bg-subtle)] text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Body</th>
                <th className="px-4 py-2.5 font-medium">Sign</th>
                <th className="px-4 py-2.5 font-medium">Degree</th>
                <th className="px-4 py-2.5 font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.planets.map((p) => (
                <tr key={p.name} className="border-t border-line">
                  <td className="px-4 py-2.5 capitalize">{p.name}</td>
                  <td className="px-4 py-2.5">{p.sign}</td>
                  <td className="px-4 py-2.5 font-mono">
                    {p.degree.toFixed(2)}°
                  </td>
                  <td className="px-4 py-2.5 text-ink-faint">
                    {p.retrograde ? "Retrograde" : "Direct"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Aspects — in plain language */}
      {snapshot.aspects.length > 0 && (
        <section>
          <h2 className="text-xl">How the pieces talk to each other</h2>
          <p className="mt-1 text-sm text-ink-faint">The conversations between your planets.</p>
          <ul className="mt-4 flex flex-col divide-y divide-line">
            {snapshot.aspects.slice(0, 8).map((a, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <span className="font-medium">
                  {a.planet1} <span className="text-ink-faint">{a.aspect}</span> {a.planet2}
                </span>
                <span className="text-sm text-ink-soft">
                  {ASPECT_PLAIN[a.aspect] ?? a.aspect}{" "}
                  <span className="font-mono text-ink-faint">· orb {a.orb.toFixed(2)}°</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Patterns */}
      {snapshot.patterns.length > 0 && (
        <section>
          <h2 className="text-xl">Larger patterns in your chart</h2>
          <div className="mt-4 flex flex-col gap-3">
            {snapshot.patterns.map((p, i) => (
              <div key={i} className="card p-5">
                <p className="font-medium text-primary">
                  {p.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="mt-1 text-ink-soft">
                  {PATTERN_PLAIN[p.type] ?? p.description ?? "A notable configuration."}
                </p>
                {p.planets && (
                  <p className="mt-1 font-mono text-xs text-ink-faint">
                    {p.planets.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Name-number profile */}
      {snapshot.numerology?.systems && (
        <section>
          <h2 className="text-xl">Your name, in numbers</h2>
          <p className="mt-1 text-sm text-ink-faint">
            Five traditions. Each maps your letters to numbers a different way.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(snapshot.numerology.systems).map(([id, s]) => (
              <div key={id} className="card flex items-baseline justify-between p-5">
                <span className="capitalize">{id}</span>
                <span className="font-mono text-lg">
                  {s.total}
                  {s.reduced !== undefined && (
                    <span className="ml-2 text-sm text-ink-faint">→ {s.reduced}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BigThree({
  label,
  sign,
  degree,
  note,
  muted,
}: {
  label: string;
  sign?: string;
  degree?: number;
  note: string;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "opacity-60" : ""}>
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 font-serif text-2xl">{sign ?? "—"}</p>
      {degree !== undefined && (
        <p className="font-mono text-sm text-ink-soft">{degree.toFixed(2)}°</p>
      )}
      <p className="mt-1 text-xs text-ink-faint">{note}</p>
    </div>
  );
}
