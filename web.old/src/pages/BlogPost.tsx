import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Post } from "../lib/api";
import { renderMarkdown } from "../lib/markdown";
import { usePrefs } from "../context/PrefsContext";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { readingMode, toggleReadingMode } = usePrefs();

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getPost(slug!)
      .then((r) => setPost(r.post))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied.");
    }
  }

  if (loading) return <div className="container-prose py-20 text-ink-faint">Loading…</div>;
  if (error || !post) {
    return (
      <div className="container-prose py-20 text-center">
        <h1 className="text-2xl">We couldn&apos;t find that post.</h1>
        <Link to="/blog" className="btn-primary mt-6">Back to the blog</Link>
      </div>
    );
  }

  return (
    <article className="container-prose py-10 sm:py-14">
      <Link to="/blog" className="text-sm text-ink-faint hover:text-ink">← All posts</Link>

      <header className="mt-6 max-w-3xl">
        <div className="text-4xl">{post.cover}</div>
        <h1 className="mt-4 text-3xl sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-ink-soft">{post.excerpt}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-ink-faint">
          {post.published_at && (
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </time>
          )}
          <button onClick={toggleReadingMode} className="rounded-full bg-bg-subtle px-3 py-1 hover:text-ink">
            {readingMode ? "Reading mode ✓" : "Reading mode"}
          </button>
          <button onClick={share} className="rounded-full bg-bg-subtle px-3 py-1 hover:text-ink">Share</button>
        </div>
      </header>

      <div
        className="prose mt-10"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body_md) }}
      />

      <div className="mt-14 rounded-2xl bg-primary-soft p-6">
        <h2 className="text-xl text-primary-ink">See it on your own chart</h2>
        <p className="mt-2 text-primary-ink/80">
          Enter your birth details and get the real thing — free, in plain language.
        </p>
        <Link to="/reading" className="btn-primary mt-4">Reveal my chart</Link>
      </div>
    </article>
  );
}
