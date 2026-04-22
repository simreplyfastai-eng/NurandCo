import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();
const SESSION_HOURS = 8;

/** Read a global (location-agnostic) portal_kv entry */
async function getGlobalKv(key: string): Promise<unknown> {
  try {
    const { data } = await supabaseAdmin
      .from("portal_kv")
      .select("value")
      .is("location_id", null)
      .eq("key", key)
      .maybeSingle();
    return data?.value ?? null;
  } catch {
    return null;
  }
}

/** Write a global (location-agnostic) portal_kv entry */
async function setGlobalKv(key: string, value: unknown): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from("portal_kv")
    .select("id")
    .is("location_id", null)
    .eq("key", key)
    .maybeSingle();
  if (existing?.id) {
    await supabaseAdmin
      .from("portal_kv")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", String(existing.id));
  } else {
    await supabaseAdmin
      .from("portal_kv")
      .insert({ location_id: null, key, value, updated_at: new Date().toISOString() });
  }
}

/** Returns the active primary admin password — Supabase override wins over env var */
async function getActivePassword(): Promise<string | null> {
  try {
    const val = await getGlobalKv("admin_password_override");
    if (val) return String(val);
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

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim();
  if (inputEmail === adminEmail.toLowerCase()) {
    // Check DB override first, then always fall back to the ADMIN_PASSWORD env var
    // so a stale or corrupted DB override can never permanently lock out the account owner
    const activePassword = await getActivePassword();
    let matched = activePassword ? await checkPassword(inputPassword, activePassword) : false;

    if (!matched) {
      const envPassword = process.env.ADMIN_PASSWORD ?? "";
      if (envPassword) matched = await checkPassword(inputPassword, envPassword);
    }

    if (matched) {
      const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
      const token = jwt.sign({ role: "admin", expiresAt }, secret, { expiresIn: `${SESSION_HOURS}h` });
      return res.json({ token, expiresAt });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }

  try {
    const extras = (await getGlobalKv("portal_extra_admins")) as { email: string; passwordHash: string }[] | null;
    if (Array.isArray(extras)) {
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
  let currentMatch = false;
  if (activePassword && activePassword.startsWith("$2") && activePassword.length >= 60) {
    currentMatch = await bcrypt.compare(currentPassword, activePassword);
  } else if (activePassword) {
    currentMatch = currentPassword === activePassword;
  }

  // Always allow the original ADMIN_PASSWORD env var as a fallback reset mechanism
  // so the account owner is never permanently locked out by a stale DB override
  if (!currentMatch) {
    const envPassword = process.env.ADMIN_PASSWORD ?? "";
    if (envPassword) {
      if (envPassword.startsWith("$2") && envPassword.length >= 60) {
        currentMatch = await bcrypt.compare(currentPassword, envPassword);
      } else {
        currentMatch = currentPassword === envPassword;
      }
    }
  }

  if (!currentMatch) return res.status(401).json({ error: "Current password is incorrect" });

  const hashed = await bcrypt.hash(newPassword, 12);
  try {
    await setGlobalKv("admin_password_override", hashed);
    return res.json({ ok: true });
  } catch (err) {
    console.error("change-password db error", err);
    return res.status(500).json({ error: "Failed to save new password" });
  }
});

// GET /api/auth/verify  — validates stored token, returns refreshed token
router.get("/auth/verify", (req, res) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(500).json({ valid: false });
  try {
    jwt.verify(token, secret);
    const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
    const refreshed = jwt.sign({ role: "admin", expiresAt }, secret, { expiresIn: `${SESSION_HOURS}h` });
    return res.json({ valid: true, token: refreshed, expiresAt });
  } catch {
    return res.json({ valid: false });
  }
});

export default router;
