import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "@workspace/db";

const router = Router();
const SESSION_HOURS = 8;

/** Returns the active primary admin password — DB override wins over env var */
async function getActivePassword(): Promise<string | null> {
  try {
    const r = await pool.query("SELECT value FROM portal_kv WHERE key='admin_password_override' LIMIT 1");
    if (r.rows.length > 0 && r.rows[0].value) return r.rows[0].value as string;
  } catch { /* fall through */ }
  return process.env.ADMIN_PASSWORD ?? null;
}

async function checkPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$2") && stored.length >= 60) {
    return bcrypt.compare(password, stored);
  }
  return password === stored;
}

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(500).json({ error: "Server auth not configured" });

  const inputEmail = (email ?? "").trim().toLowerCase();
  const inputPassword = password ?? "";

  // ── Primary admin (env var email + DB/env password) ──
  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  if (inputEmail === adminEmail.toLowerCase()) {
    const activePassword = await getActivePassword();
    if (activePassword && await checkPassword(inputPassword, activePassword)) {
      const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
      const token = jwt.sign({ role: "admin", expiresAt }, secret, { expiresIn: `${SESSION_HOURS}h` });
      return res.json({ token, expiresAt });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // ── Extra admins (stored in portal_kv) ──
  try {
    const r = await pool.query("SELECT value FROM portal_kv WHERE key='portal_extra_admins' LIMIT 1");
    const extras = Array.isArray(r.rows[0]?.value) ? r.rows[0].value as { email: string; passwordHash: string }[] : [];
    for (const extra of extras) {
      if ((extra.email ?? "").toLowerCase() === inputEmail) {
        if (extra.passwordHash && await checkPassword(inputPassword, extra.passwordHash)) {
          const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
          const token = jwt.sign({ role: "admin", expiresAt }, secret, { expiresIn: `${SESSION_HOURS}h` });
          return res.json({ token, expiresAt });
        }
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }
  } catch { /* fall through */ }

  return res.status(401).json({ error: "Invalid credentials" });
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
  // Verify current password — support both bcrypt hashes and plain text (migration)
  let currentMatch = false;
  if (activePassword && activePassword.startsWith("$2") && activePassword.length >= 60) {
    currentMatch = await bcrypt.compare(currentPassword, activePassword);
  } else {
    currentMatch = currentPassword === activePassword;
  }
  if (!currentMatch) return res.status(401).json({ error: "Current password is incorrect" });

  // Always store new password as a bcrypt hash
  const hashed = await bcrypt.hash(newPassword, 12);
  try {
    await pool.query(
      "INSERT INTO portal_kv (key, value) VALUES ('admin_password_override', $1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [hashed]
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
