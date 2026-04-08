import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

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

  const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "30d" });
  return res.json({ token });
});

// GET /api/auth/verify  — used by portal on page load to validate stored token
router.get("/auth/verify", (req, res) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(500).json({ valid: false });
  try {
    jwt.verify(token, secret);
    return res.json({ valid: true });
  } catch {
    return res.json({ valid: false });
  }
});

export default router;
