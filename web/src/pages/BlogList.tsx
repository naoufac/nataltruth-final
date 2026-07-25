import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Post } from "../lib/api";

export default function BlogList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listPosts().then((r) => setPosts(r.posts)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-prose py-12">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl">The blog</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Plain-language guides to astrology and the math behind it. No mystic jargon, no fake certainty.
        </p>
      </header>

      {loading && <p className="text-ink-faint">Loading…</p>}
      {error && <p className="text-warn">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2">
        {posts.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="card flex flex-col p-6 transition hover:border-primary">
            <span className="text-3xl">{p.cover}</span>
            <h2 className="mt-3 text-xl leading-snug">{p.title}</h2>
            <p className="mt-2 flex-1 text-ink-soft">{p.excerpt}</p>
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
