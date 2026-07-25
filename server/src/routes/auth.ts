import { Router } from "express";
import { z } from "zod";
import {
  clearSessionCookie,
  createUser,
  findUserByEmail,
  requireAuth,
  setSessionCookie,
  signToken,
  toPublicUser,
  verifyPassword,
  type AuthUser,
} from "../auth.js";
import type { Request, Response } from "express";

export const authRouter = Router();

const Credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().min(1).max(80).optional(),
});

authRouter.post("/register", (req: Request, res: Response) => {
  const parsed = Credentials.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }
  const { email, password, name } = parsed.data;
  if (findUserByEmail(email)) {
    res.status(409).json({ ok: false, error: "An account with that email already exists." });
    return;
  }
  const user = createUser(email, password, name || email.split("@")[0]);
  setSessionCookie(res, signToken(user));
  res.json({ ok: true, user });
});

authRouter.post("/login", (req: Request, res: Response) => {
  const parsed = Credentials.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "Enter your email and password." });
    return;
  }
  const row = findUserByEmail(parsed.data.email);
  if (!row || !verifyPassword(parsed.data.password, row.password_hash)) {
    res.status(401).json({ ok: false, error: "Email or password is incorrect." });
    return;
  }
  const user = toPublicUser(row);
  setSessionCookie(res, signToken(user));
  res.json({ ok: true, user });
});

authRouter.post("/logout", (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthUser }).user;
  res.json({ ok: true, user });
});
