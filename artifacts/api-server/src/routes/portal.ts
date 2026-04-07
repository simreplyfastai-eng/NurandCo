import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// GET /api/portal/store  — fetch multiple keys at once (?keys=k1,k2,k3)
router.get("/portal/store", async (req, res) => {
  const keys = (req.query["keys"] as string || "").split(",").filter(Boolean);
  if (!keys.length) return res.json({});
  try {
    const result = await pool.query(
      "SELECT key, value FROM portal_kv WHERE key = ANY($1)",
      [keys],
    );
    const out: Record<string, unknown> = {};
    for (const row of result.rows) {
      out[row.key] = row.value;
    }
    return res.json(out);
  } catch (err) {
    console.error("portal bulk GET error", err);
    return res.status(500).json({ error: "db error" });
  }
});

// GET /api/portal/store/:key
router.get("/portal/store/:key", async (req, res) => {
  const { key } = req.params;
  try {
    const result = await pool.query(
      "SELECT value FROM portal_kv WHERE key = $1",
      [key],
    );
    if (result.rows.length === 0) {
      return res.json({ value: null });
    }
    return res.json({ value: result.rows[0].value });
  } catch (err) {
    console.error("portal GET error", err);
    return res.status(500).json({ error: "db error" });
  }
});

// PUT /api/portal/store/:key
router.put("/portal/store/:key", async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (value === undefined) {
    return res.status(400).json({ error: "value required" });
  }
  try {
    await pool.query(
      `INSERT INTO portal_kv (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
      [key, JSON.stringify(value)],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("portal PUT error", err);
    return res.status(500).json({ error: "db error" });
  }
});

export default router;
