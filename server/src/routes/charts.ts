import { Router } from "express";
import { z } from "zod";
import { db, newId, nowIso } from "../db.js";
import { requireAuth, type AuthUser } from "../auth.js";
import type { Request, Response } from "express";

export const chartsRouter = Router();

const SaveChart = z.object({
  name: z.string().min(1).max(120),
  label: z.string().max(160).optional(),
  input: z.record(z.string(), z.unknown()),
  snapshot: z.record(z.string(), z.unknown()),
});

chartsRouter.use(requireAuth);

chartsRouter.get("/", (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthUser }).user;
  const rows = db
    .prepare(
      "SELECT id, name, label, input_json, snapshot_json, created_at FROM charts WHERE user_id = ? ORDER BY created_at DESC"
    )
    .all(user.id) as {
    id: string;
    name: string;
    label?: string;
    input_json: string;
    snapshot_json: string;
    created_at: string;
  }[];
  res.json({
    ok: true,
    charts: rows.map((r) => ({
      id: r.id,
      name: r.name,
      label: r.label ?? null,
      input: JSON.parse(r.input_json),
      snapshot: JSON.parse(r.snapshot_json),
      created_at: r.created_at,
    })),
  });
});

chartsRouter.post("/", (req: Request, res: Response) => {
  const parsed = SaveChart.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid chart." });
    return;
  }
  const user = (req as Request & { user: AuthUser }).user;
  const id = newId("chart");
  db.prepare(
    "INSERT INTO charts(id, user_id, name, label, input_json, snapshot_json, created_at) VALUES(?,?,?,?,?,?,?)"
  ).run(
    id,
    user.id,
    parsed.data.name,
    parsed.data.label ?? null,
    JSON.stringify(parsed.data.input),
    JSON.stringify(parsed.data.snapshot),
    nowIso()
  );
  res.json({ ok: true, id });
});

chartsRouter.get("/:id", (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthUser }).user;
  const row = db
    .prepare(
      "SELECT id, name, label, input_json, snapshot_json, created_at FROM charts WHERE id = ? AND user_id = ?"
    )
    .get(req.params.id, user.id) as
    | {
        id: string;
        name: string;
        label?: string;
        input_json: string;
        snapshot_json: string;
        created_at: string;
      }
    | undefined;
  if (!row) {
    res.status(404).json({ ok: false, error: "Chart not found." });
    return;
  }
  res.json({
    ok: true,
    chart: {
      id: row.id,
      name: row.name,
      label: row.label ?? null,
      input: JSON.parse(row.input_json),
      snapshot: JSON.parse(row.snapshot_json),
      created_at: row.created_at,
    },
  });
});

chartsRouter.delete("/:id", (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthUser }).user;
  const info = db
    .prepare("DELETE FROM charts WHERE id = ? AND user_id = ?")
    .run(req.params.id, user.id);
  if (info.changes === 0) {
    res.status(404).json({ ok: false, error: "Chart not found." });
    return;
  }
  res.json({ ok: true });
});
