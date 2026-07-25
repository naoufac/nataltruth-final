import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TrustStrip from "../components/TrustStrip";
import { api, type Post } from "../lib/api";

const PRINCIPLES = [
  { title: "Real math, not vibes", body: "Swiss Ephemeris — the engine professionals trust. Positions to the arc-minute." },
  { title: "Plain language", body: "We explain what each placement means in words you can actually use." },
  { title: "Honest about the gaps", body: "No birth time? We say so and drop the houses. We never invent a Rising sign." },
  { title: "Free, by design", body: "A genuinely useful reading, free — because it's the best reason to tell a friend." },
];

export default function Landing() {
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    api.listPosts().then((r) => setPosts(r.posts.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">
      <section className="container-prose py-14 sm:py-20">
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
            <Link to="/reading" className="btn-primary text-base">Reveal my chart — free</Link>
            <Link to="/compatibility" className="btn-ghost text-base">Compatibility →</Link>
            <Link to="/blog" className="btn-ghost text-base">Read the blog →</Link>
          </div>
          <div className="mt-8 max-w-xl">
            <TrustStrip showLink={false} />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-[color:var(--bg-subtle)]">
        <div className="container-prose py-14">
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

      <section className="container-prose py-14">
        <h2 className="text-2xl sm:text-3xl">From the blog</h2>
        <p className="mt-1 text-ink-faint">Plain-language guides, no mystic jargon.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug}`} className="card flex flex-col p-5 transition hover:border-primary">
              <span className="text-2xl">{p.cover}</span>
              <h3 className="mt-3 text-lg leading-snug">{p.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{p.excerpt}</p>
            </Link>
          ))}
          {posts.length === 0 && <p className="text-ink-faint">Loading posts…</p>}
        </div>
      </section>

      {/* Compatibility teaser */}
      <section className="border-t border-line bg-[color:var(--bg-subtle)]">
        <div className="container-prose py-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl">How do your signs match up?</h2>
              <p className="mt-3 text-ink-soft">
                A full 12×12 zodiac compatibility grid — honest, element-based, and clickable.
                Tap any pairing to see the real dynamic, then get your full chart.
              </p>
              <Link to="/compatibility" className="btn-primary mt-6">Explore compatibility →</Link>
            </div>
            <div className="grid grid-cols-12 gap-1 text-center text-xs">
              {["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map((s) => (
                <div key={s} className="text-lg">{s}</div>
              ))}
              {Array.from({ length: 144 }, (_, i) => {
                const score = ((Math.floor(i / 12) + i % 12) % 4) + 2;
                const bg = score >= 5 ? "#7BAE43" : score === 4 ? "#A8C97A" : score === 3 ? "#E8A93C" : "#D8794F";
                return <div key={i} className="flex h-7 items-center justify-center rounded" style={{ background: bg, color: score >= 4 ? "#1F1B16" : "#fff" }}>{score}</div>;
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
