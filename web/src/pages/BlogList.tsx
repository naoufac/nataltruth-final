import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Post } from "../lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  "sun-signs": "Sun Signs",
  "moon-signs": "Moon Signs",
  "rising-signs": "Rising Signs",
  "love-compatibility": "Love & Compatibility",
  "career-money": "Career & Money",
  "name-numerology": "Name Numerology",
  "understanding-houses": "Understanding Houses",
  "aspects-explained": "Aspects Explained",
  "transits-timing": "Transits & Timing",
  "patterns-configuration": "Chart Patterns",
  "understanding": "Foundations",
};

export default function BlogList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<{ id: string; count: number }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listCategories().then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.listPosts(active || undefined)
      .then((r) => setPosts(r.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <div className="container-prose py-12">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl">The blog</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Plain-language guides to astrology and numerology. No mystic jargon, no fake certainty.
        </p>
      </header>

      {/* Category pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActive(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            !active ? "bg-primary text-white" : "bg-bg-subtle text-ink-soft hover:text-ink"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === c.id ? "bg-primary text-white" : "bg-bg-subtle text-ink-soft hover:text-ink"
            }`}
          >
            {CATEGORY_LABELS[c.id] || c.id} <span className="opacity-60">({c.count})</span>
          </button>
        ))}
      </div>

      {loading && <p className="text-ink-faint">Loading…</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="card flex flex-col p-5 transition hover:border-primary">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{p.cover}</span>
              <span className="text-xs text-ink-faint">{CATEGORY_LABELS[p.category] || p.category}</span>
            </div>
            <h2 className="mt-3 text-lg leading-snug">{p.title}</h2>
            <p className="mt-2 flex-1 text-sm text-ink-soft">{p.excerpt}</p>
            <span className="mt-4 text-sm font-medium text-primary-ink">Read →</span>
          </Link>
        ))}
      </div>

      {!loading && posts.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-ink-soft">No posts yet. Check back soon.</p>
          <Link to="/" className="btn-primary mt-4">Back home</Link>
        </div>
      )}
    </div>
  );
}
