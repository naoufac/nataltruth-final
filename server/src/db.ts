// SQLite persistence for NatalTruth — users, saved charts, blog/CMS posts.
// Uses Node's built-in `node:sqlite` (Node 22+, experimental but stable enough).
// The DB file lives on the container mount so it survives restarts.
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import path from "node:path";
import os from "node:os";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "nataltruth.db");

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS charts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  label      TEXT,
  input_json TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_charts_user ON charts(user_id);

CREATE TABLE IF NOT EXISTS posts (
  id           TEXT PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  excerpt      TEXT NOT NULL,
  body_md      TEXT NOT NULL,
  cover        TEXT NOT NULL DEFAULT '✦',
  category     TEXT NOT NULL DEFAULT 'general',
  published    INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  author_id    TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, published_at);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  timestamp  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_user_session ON chat_messages(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);
`);

// Migration: add category column to posts if missing (for existing DBs)
try {
  db.prepare("SELECT category FROM posts LIMIT 0").get();
} catch {
  db.exec("ALTER TABLE posts ADD COLUMN category TEXT NOT NULL DEFAULT 'general';");
  console.log("[db] Migration: added category column to posts.");
}

// Stable JWT secret: env wins; else generate once and persist in settings.
export function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("jwt_secret") as
    | { value: string }
    | undefined;
  if (row?.value) return row.value;
  const generated = randomBytes(48).toString("hex");
  db.prepare("INSERT OR REPLACE INTO settings(key, value) VALUES(?, ?)").run(
    "jwt_secret",
    generated
  );
  console.warn(
    "[auth] No JWT_SECRET env; generated and persisted a secret. Set JWT_SECRET in production."
  );
  return generated;
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
