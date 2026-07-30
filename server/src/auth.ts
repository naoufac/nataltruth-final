// Auth: bcryptjs hashing + JWT in an HttpOnly cookie + Express middleware.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db, getJwtSecret, newId, nowIso } from "./db.js";

const JWT_EXPIRES_IN = "7d";
const COOKIE_NAME = "nt_session";
const BCRYPT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function readToken(req: Request): string | null {
  // Read from cookie first
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  // Fallback: read from Authorization Bearer header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

function publicUser(row: {
  id: string;
  email: string;
  name: string;
  role: string;
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === "admin" ? "admin" : "user",
  };
}

// Reads the current user from the cookie (if any). Never throws — attaches
// req.user or leaves it undefined.
export async function attachUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = readToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, getJwtSecret()) as { sub: string };
      const row = db
        .prepare("SELECT id, email, name, role FROM users WHERE id = ?")
        .get(payload.sub) as
        | { id: string; email: string; name: string; role: string }
        | undefined;
      if (row) (req as Request & { user?: AuthUser }).user = publicUser(row);
    } catch {
      /* invalid/expired token → treat as anonymous */
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!user) {
    res.status(401).json({ ok: false, error: "Sign in required." });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!user || user.role !== "admin") {
    res.status(403).json({ ok: false, error: "Admin access required." });
    return;
  }
  next();
}

export function findUserByEmail(email: string) {
  return db
    .prepare("SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = ?")
    .get(email.toLowerCase()) as
    | {
        id: string;
        email: string;
        name: string;
        role: string;
        password_hash: string;
        created_at: string;
      }
    | undefined;
}

export function createUser(email: string, plainPassword: string, name: string): AuthUser {
  const id = newId("usr");
  db.prepare(
    "INSERT INTO users(id, email, password_hash, name, role, created_at) VALUES(?,?,?,?,?,?)"
  ).run(id, email.toLowerCase(), hashPassword(plainPassword), name, "user", nowIso());
  return { id, email: email.toLowerCase(), name, role: "user" };
}

export function toPublicUser(row: {
  id: string;
  email: string;
  name: string;
  role: string;
}): AuthUser {
  return publicUser(row);
}
