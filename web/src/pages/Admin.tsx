import { useEffect, useState } from "react";
import { api, type Post, type AuthUser } from "../lib/api";

type Tab = "posts" | "editor" | "users";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);

  function loadPosts() {
    api.adminListPosts().then((r) => setPosts(r.posts)).catch(() => {});
  }
  useEffect(loadPosts, []);

  return (
    <div className="container-prose py-10">
      <h1 className="text-3xl sm:text-4xl">Admin</h1>
      <div className="mt-6 flex gap-2 border-b border-line">
        {(["posts", "editor", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              if (t === "editor") setEditing(null);
            }}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition ${
              tab === t ? "border-primary text-primary-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t === "editor" ? "New post" : t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "posts" && (
          <PostList
            posts={posts}
            onEdit={(p) => { setEditing(p); setTab("editor"); }}
            onChanged={loadPosts}
          />
        )}
        {tab === "editor" && (
          <Editor post={editing} onDone={() => { loadPosts(); setTab("posts"); setEditing(null); }} />
        )}
        {tab === "users" && <Users />}
      </div>
    </div>
  );
}

function PostList({ posts, onEdit, onChanged }: { posts: Post[]; onEdit: (p: Post) => void; onChanged: () => void }) {
  async function del(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await api.adminDeletePost(id);
    onChanged();
  }
  async function toggle(p: Post) {
    await api.adminUpdatePost(p.id, { published: !p.published });
    onChanged();
  }
  return (
    <div className="flex flex-col gap-3">
      {posts.map((p) => (
        <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-medium">
              {p.title}
              {!p.published && <span className="chip">Draft</span>}
            </p>
            <p className="truncate text-sm text-ink-faint">/{p.slug}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => toggle(p)} className="btn-ghost text-sm">
              {p.published ? "Unpublish" : "Publish"}
            </button>
            <button onClick={() => onEdit(p)} className="btn-ghost text-sm">Edit</button>
            <button onClick={() => del(p.id, p.title)} className="btn-ghost text-sm text-warn">Delete</button>
          </div>
        </div>
      ))}
      {posts.length === 0 && <p className="text-ink-faint">No posts yet. Create one in “New post”.</p>}
    </div>
  );
}

function Editor({ post, onDone }: { post: Post | null; onDone: () => void }) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body_md ?? "");
  const [cover, setCover] = useState(post?.cover ?? "✦");
  const [published, setPublished] = useState(post?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!title.trim() || !excerpt.trim() || !body.trim()) {
      setError("Title, excerpt, and body are required.");
      return;
    }
    setSaving(true);
    try {
      if (post) {
        await api.adminUpdatePost(post.id, { title, slug, excerpt, body_md: body, cover, published });
      } else {
        await api.adminCreatePost({ title, slug, excerpt, body_md: body, cover, published });
      }
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="label">Title</label>
          <input className="input text-lg" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A clear, honest title" />
        </div>
        <div>
          <label className="label">Excerpt <span className="text-ink-faint">(one-line summary)</span></label>
          <textarea className="input" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>
        <div>
          <label className="label">Body <span className="text-ink-faint">(Markdown — # heading, **bold**, - list)</span></label>
          <textarea className="input font-mono text-sm" rows={16} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="card p-5">
          <div>
            <label className="label">Slug</label>
            <input className="input font-mono text-sm" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-from-title" />
          </div>
          <div className="mt-4">
            <label className="label">Cover symbol</label>
            <input className="input text-center text-xl" maxLength={4} value={cover} onChange={(e) => setCover(e.target.value)} />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Published
          </label>
        </div>
        {error && <p className="rounded-xl bg-[color:var(--bg-subtle)] px-4 py-3 text-sm text-warn">{error}</p>}
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : post ? "Save changes" : "Create post"}
        </button>
        <button onClick={onDone} className="btn-ghost text-sm">Cancel</button>
      </aside>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState<(AuthUser & { created_at: string })[] | null>(null);
  useEffect(() => {
    api.adminListUsers().then((r) => setUsers(r.users as any)).catch(() => {});
  }, []);
  if (!users) return <p className="text-ink-faint">Loading…</p>;
  return (
    <div className="flex flex-col gap-2">
      {users.map((u) => (
        <div key={u.id} className="card flex items-center justify-between p-4">
          <div>
            <p className="font-medium">{u.name} {u.role === "admin" && <span className="chip ml-1">admin</span>}</p>
            <p className="text-sm text-ink-faint">{u.email}</p>
          </div>
          <span className="text-xs text-ink-faint">{new Date(u.created_at).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
