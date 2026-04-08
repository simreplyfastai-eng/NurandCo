import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

export function requireAuth(req: Request, res: Response): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) { res.status(500).json({ error: "Server auth not configured" }); return false; }
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  try {
    const payload = jwt.verify(token, secret) as { role?: string };
    if (payload?.role === "admin") return true;
  } catch { /* invalid/expired */ }
  res.status(401).json({ error: "Unauthorised" });
  return false;
}
