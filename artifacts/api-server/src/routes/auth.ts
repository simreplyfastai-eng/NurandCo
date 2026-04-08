import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();
const SESSION_HOURS = 8;

// POST /api/auth/login
router.post("/auth/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!adminEmail || !adminPassword || !secret) {
    console.error("Auth env vars not configured");
    return res.status(500).json({ error: "Server auth not configured" });
  }

  const emailMatch = (email ?? "").trim().toLowerCase() === adminEmail.toLowerCase();
  const passMatch = password === adminPassword;

  if (!emailMatch || !passMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const token = jwt.sign({ role: "admin", expiresAt }, secret, { expiresIn: `${SESSION_HOURS}h` });
  return res.json({ token, expiresAt });
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
