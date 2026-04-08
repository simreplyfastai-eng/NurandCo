import { Router } from "express";
import { pool } from "@workspace/db";
import jwt from "jsonwebtoken";
import { runAutoComplete } from "./bookings";
import { sendReminderEmail } from "../lib/email";

const router = Router();

/** Send 24h reminders for Confirmed bookings arriving in 23–25h window */
async function sendReminders(): Promise<number> {
  const whatsappRes = await pool.query("SELECT value FROM portal_kv WHERE key='dd_settings'").catch(() => null);
  const settings = (whatsappRes?.rows[0]?.value as Record<string, string>) ?? {};
  const whatsapp = settings.whatsapp ?? "";

  try {
    const result = await pool.query(`
      SELECT b.id, b.client_name, b.client_email, b.treatment, b.time, b.date
      FROM bookings b
      WHERE b.status = 'Confirmed'
        AND b.reminder_sent = false
        AND b.client_email != ''
        AND (
          (b.date || ' ' || COALESCE(NULLIF(b.time,''), '00:00'))::timestamptz AT TIME ZONE 'Europe/London'
          BETWEEN NOW() + INTERVAL '23 hours'
          AND     NOW() + INTERVAL '25 hours'
        )
    `);

    let sent = 0;
    for (const row of result.rows) {
      await sendReminderEmail({
        clientEmail: row.client_email,
        clientName: row.client_name,
        treatment: row.treatment,
        date: row.date,
        time: row.time,
        whatsapp,
      });
      await pool.query("UPDATE bookings SET reminder_sent=true WHERE id=$1", [row.id]);
      sent++;
    }
    return sent;
  } catch (err) {
    console.error("sendReminders error", err);
    return 0;
  }
}

function requireCronSecret(req: import("express").Request, res: import("express").Response): boolean {
  // Block everything if CRON_SECRET is not configured
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Cron secret not configured. Add CRON_SECRET to Replit Secrets." });
    return false;
  }

  // Accept a valid admin JWT — only when SESSION_SECRET is explicitly configured
  const jwtSecret = process.env.SESSION_SECRET;
  const auth = req.headers.authorization;
  if (jwtSecret && auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, jwtSecret) as { role?: string };
      if (payload?.role === "admin") return true;
    } catch { /* invalid/expired token — fall through */ }
  }

  // Accept x-cron-secret header
  if (req.headers["x-cron-secret"] !== secret) {
    res.status(401).json({ error: "Unauthorised" });
    return false;
  }
  return true;
}

// GET /api/cron/autocomplete
router.get("/cron/autocomplete", async (req, res) => {
  if (!requireCronSecret(req, res)) return;
  const updated = await runAutoComplete();
  return res.json({ ok: true, updated });
});

// GET /api/cron/reminders
router.get("/cron/reminders", async (req, res) => {
  if (!requireCronSecret(req, res)) return;
  const sent = await sendReminders();
  return res.json({ ok: true, sent });
});

export default router;
