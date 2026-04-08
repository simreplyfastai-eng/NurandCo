import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();
const SESSION_HOURS = 8;

/** Returns the active admin password — DB override wins over env var */
async function getActivePassword(): Promise<string | null> {
  try {
    const r = await pool.query("SELECT value FROM portal_kv WHERE key='dd_admin_password' LIMIT 1");
    if (r.rows.length > 0 && r.rows[0].value) return r.rows[0].value as string;
  } catch { /* fall through */ }
  return process.env.ADMIN_PASSWORD ?? null;
}

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  const adminEmail = process.env.ADMIN_EMAIL;
  const secret = process.env.SESSION_SECRET;

  if (!adminEmail || !secret) {
    console.error("Auth env vars not configured");
    return res.status(500).json({ error: "Server auth not configured" });
  }

  const activePassword = await getActivePassword();
  if (!activePassword) {
    console.error("No admin password configured");
    return res.status(500).json({ error: "Server auth not configured" });
  }

  const emailMatch = (email ?? "").trim().toLowerCase() === adminEmail.toLowerCase();
  const passMatch = password === activePassword;

  if (!emailMatch || !passMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const token = jwt.sign({ role: "admin", expiresAt }, secret, { expiresIn: `${SESSION_HOURS}h` });
  return res.json({ token, expiresAt });
});

// POST /api/auth/change-password — requires valid admin JWT
router.post("/auth/change-password", async (req, res) => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(500).json({ error: "Server auth not configured" });

  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  try {
    const payload = jwt.verify(token, secret) as { role?: string };
    if (payload?.role !== "admin") throw new Error("not admin");
  } catch {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "currentPassword and newPassword required" });
  if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });

  const activePassword = await getActivePassword();
  if (currentPassword !== activePassword) return res.status(401).json({ error: "Current password is incorrect" });

  try {
    await pool.query(
      "INSERT INTO portal_kv (key, value) VALUES ('dd_admin_password', $1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [newPassword]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("change-password db error", err);
    return res.status(500).json({ error: "Failed to save new password" });
  }
});

// GET /api/auth/verify  — used by portal on page load to validate stored token
// Also returns a refreshed token to reset the 8h inactivity window
router.get("/auth/verify", (req, res) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(500).json({ valid: false });
  try {
    jwt.verify(token, secret);
    // Issue a fresh token to refresh the inactivity window
    const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
    const refreshed = jwt.sign({ role: "admin", expiresAt }, secret, { expiresIn: `${SESSION_HOURS}h` });
    return res.json({ valid: true, token: refreshed, expiresAt });
  } catch {
    return res.json({ valid: false });
  }
});

export default router;
