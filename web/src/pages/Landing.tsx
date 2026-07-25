import { Link } from "react-router-dom";
import TrustStrip from "../components/TrustStrip";

const PRINCIPLES = [
  {
    title: "Real math, not vibes",
    body: "Swiss Ephemeris — the same engine professional astrologers and astronomers trust. Positions to the arc-minute.",
  },
  {
    title: "Plain language",
    body: "We explain what each placement means in words you can actually use. No mystifying jargon, no fake certainty.",
  },
  {
    title: "Honest about the gaps",
    body: "No birth time? We say so and drop the houses — we never invent a Rising sign to look complete.",
  },
  {
    title: "Free, by design",
    body: "A genuinely useful reading, free. Because a chart that actually helps is the best reason to tell a friend.",
  },
];

export default function Landing() {
  return (
    <div className="flex flex-col">
      {/* Hero — asymmetric, content-led, not a centered stack */}
      <section className="container-prose py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="chip mb-6">Calculated with Swiss Ephemeris</p>
          <h1 className="text-4xl sm:text-5xl">
            Your chart,<br />
            <span className="text-primary">told straight.</span>
          </h1>
          <p className="mt-6 max-w-prose text-lg text-ink-soft">
            A real natal chart and a full name-number reading — across five traditions — in plain
            language. Precise astronomy, honest about what it can and can&apos;t say, and made to be
            read and shared.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/reading" className="btn-primary">
              Reveal my chart — free
            </Link>
            <span className="text-sm text-ink-faint">No sign-up. Nothing stored.</span>
          </div>
          <div className="mt-8 max-w-xl">
            <TrustStrip showLink={false} />
          </div>
        </div>
      </section>

      {/* Principles — the "why trust us" in four cards */}
      <section className="border-y border-line bg-[color:var(--bg-subtle)]">
        <div className="container-prose py-16">
          <h2 className="text-2xl sm:text-3xl">Built to be trusted, not admired.</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="card p-6">
                <h3 className="text-lg">{p.title}</h3>
                <p className="mt-2 text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get — the substance */}
      <section className="container-prose py-16">
        <h2 className="text-2xl sm:text-3xl">What&apos;s in a reading</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            "Planetary positions — Sun through Pluto, plus the Moon's nodes",
            "12 houses (Placidus), when your birth time is known",
            "Major aspects with exact orbs",
            "Pattern detection: grand trines, t-squares, yods, stelliums, grand crosses",
            "Name-number profiles across Pythagorean, Chaldean, Abjad, Hebrew, and Vedic traditions",
            "A clean, branded card you can screenshot and share",
          ].map((item) => (
            <li key={item} className="flex gap-3 rounded-xl bg-[color:var(--bg-subtle)] p-4">
              <span className="mt-0.5 text-trust" aria-hidden>✦</span>
              <span className="text-ink-soft">{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Link to="/reading" className="btn-primary">Start your reading</Link>
        </div>
      </section>
    </div>
  );
}
