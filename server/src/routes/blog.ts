import { Router } from "express";
import { z } from "zod";
import { db, newId, nowIso } from "../db.js";
import { requireAdmin, type AuthUser } from "../auth.js";
import type { Request, Response } from "express";

export const blogRouter = Router();
export const adminRouter = Router();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function rowToPost(r: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  cover: string;
  published: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    body_md: r.body_md,
    cover: r.cover,
    published: r.published === 1,
    published_at: r.published_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// ── Public blog: only published, newest first ──────────────────────
blogRouter.get("/posts", (_req, res) => {
  const rows = db
    .prepare(
      "SELECT id, slug, title, excerpt, body_md, cover, published, published_at, created_at, updated_at FROM posts WHERE published = 1 ORDER BY COALESCE(published_at, created_at) DESC"
    )
    .all() as any[];
  res.json({ ok: true, posts: rows.map(rowToPost) });
});

blogRouter.get("/posts/:slug", (req, res) => {
  const row = db
    .prepare(
      "SELECT id, slug, title, excerpt, body_md, cover, published, published_at, created_at, updated_at FROM posts WHERE slug = ? AND published = 1"
    )
    .get(req.params.slug) as any;
  if (!row) {
    res.status(404).json({ ok: false, error: "Post not found." });
    return;
  }
  res.json({ ok: true, post: rowToPost(row) });
});

// ── Admin CMS ──────────────────────────────────────────────────────
adminRouter.use(requireAdmin);

adminRouter.get("/posts", (_req, res) => {
  const rows = db
    .prepare(
      "SELECT id, slug, title, excerpt, body_md, cover, published, published_at, created_at, updated_at FROM posts ORDER BY updated_at DESC"
    )
    .all() as any[];
  res.json({ ok: true, posts: rows.map(rowToPost) });
});

const PostInput = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(400),
  body_md: z.string().min(1),
  cover: z.string().max(20).optional(),
  slug: z.string().max(80).optional(),
  published: z.boolean().optional(),
});

adminRouter.post("/posts", (req: Request, res: Response) => {
  const parsed = PostInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid post." });
    return;
  }
  const user = (req as Request & { user: AuthUser }).user;
  const d = parsed.data;
  const id = newId("post");
  const slug = slugify(d.slug || d.title);
  const ts = nowIso();
  db.prepare(
    `INSERT INTO posts(id, slug, title, excerpt, body_md, cover, published, published_at, created_at, updated_at, author_id)
     VALUES(?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    slug,
    d.title,
    d.excerpt,
    d.body_md,
    d.cover || "✦",
    d.published ? 1 : 0,
    d.published ? ts : null,
    ts,
    ts,
    user.id
  );
  res.json({ ok: true, id, slug });
});

adminRouter.put("/posts/:id", (req: Request, res: Response) => {
  const parsed = PostInput.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid post." });
    return;
  }
  const existing = db.prepare("SELECT id FROM posts WHERE id = ?").get(req.params.id) as
    | { id: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ ok: false, error: "Post not found." });
    return;
  }
  const d = parsed.data;
  const ts = nowIso();
  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (d.title !== undefined) {
    fields.push("title = ?");
    values.push(d.title);
  }
  if (d.slug !== undefined) {
    fields.push("slug = ?");
    values.push(slugify(d.slug));
  }
  if (d.excerpt !== undefined) {
    fields.push("excerpt = ?");
    values.push(d.excerpt);
  }
  if (d.body_md !== undefined) {
    fields.push("body_md = ?");
    values.push(d.body_md);
  }
  if (d.cover !== undefined) {
    fields.push("cover = ?");
    values.push(d.cover);
  }
  if (d.published !== undefined) {
    fields.push("published = ?");
    values.push(d.published ? 1 : 0);
    if (d.published) {
      const hasPub = db
        .prepare("SELECT published_at FROM posts WHERE id = ?")
        .get(req.params.id) as { published_at: string | null } | undefined;
      if (!hasPub?.published_at) {
        fields.push("published_at = ?");
        values.push(ts);
      }
    }
  }
  fields.push("updated_at = ?");
  values.push(ts);
  values.push(req.params.id);
  db.prepare(`UPDATE posts SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  res.json({ ok: true });
});

adminRouter.delete("/posts/:id", (req, res) => {
  db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

adminRouter.get("/users", (_req, res) => {
  const rows = db
    .prepare("SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC")
    .all() as any[];
  res.json({ ok: true, users: rows });
});

adminRouter.put("/users/:id/role", (req, res) => {
  const role = req.body?.role;
  if (role !== "user" && role !== "admin") {
    res.status(400).json({ ok: false, error: "Role must be 'user' or 'admin'." });
    return;
  }
  const me = (req as unknown as Request & { user: AuthUser }).user;
  if (req.params.id === me.id && role !== "admin") {
    res.status(400).json({ ok: false, error: "You cannot remove your own admin role." });
    return;
  }
  const info = db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
  if (info.changes === 0) {
    res.status(404).json({ ok: false, error: "User not found." });
    return;
  }
  res.json({ ok: true });
});
