import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import jwt from "jsonwebtoken";
import { runAutoComplete } from "./bookings";
import { sendReminderEmail, sendFormsReminderEmail } from "../lib/email";

const router = Router();

/** Send 24h reminders for Confirmed bookings arriving in 23–25h window */
async function sendReminders(): Promise<number> {
  // Load dd_settings per location to get WhatsApp numbers
  const { data: kvRows } = await supabaseAdmin
    .from("portal_kv")
    .select("location_id, value")
    .eq("key", "dd_settings");

  const settingsByLocation: Record<string, Record<string, string>> = {};
  for (const row of (kvRows ?? [])) {
    if (row.location_id) {
      settingsByLocation[String(row.location_id)] = (row.value as Record<string, string>) ?? {};
    }
  }

  // Time window: bookings due in 23–25 hours from now
  const now = new Date();
  const winStart = new Date(now.getTime() + 23 * 3600_000);
  const winEnd = new Date(now.getTime() + 25 * 3600_000);

  // Fetch candidate bookings (by date range; we'll filter by exact time in JS)
  const startDate = winStart.toISOString().slice(0, 10);
  const endDate = winEnd.toISOString().slice(0, 10);

  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select("id, client_name, client_email, treatment, time_slot, booking_date, location_id")
    .eq("status", "confirmed")
    .eq("reminder_sent", false)
    .not("client_email", "is", null)
    .neq("client_email", "")
    .gte("booking_date", startDate)
    .lte("booking_date", endDate);

  if (error) {
    console.error("sendReminders fetch error", error);
    return 0;
  }

  let sent = 0;
  for (const row of (bookings ?? [])) {
    const dateStr = String(row.booking_date ?? "");
    const timeStr = String(row.time_slot ?? "09:00").slice(0, 5);

    // Parse booking datetime as UTC (bookings stored as YYYY-MM-DD dates)
    const bookingMs = new Date(`${dateStr}T${timeStr}:00Z`).getTime();
    const diffHours = (bookingMs - now.getTime()) / 3600_000;

    if (diffHours >= 23 && diffHours <= 25) {
      const locId = String(row.location_id ?? "");
      const whatsapp = settingsByLocation[locId]?.whatsapp ?? "";
      try {
        await sendReminderEmail({
          clientEmail: String(row.client_email ?? ""),
          clientName: String(row.client_name ?? ""),
          treatment: String(row.treatment ?? ""),
          date: dateStr,
          time: timeStr,
          whatsapp,
        });
        await supabaseAdmin
          .from("bookings")
          .update({ reminder_sent: true })
          .eq("id", String(row.id));
        sent++;
      } catch (e) {
        console.error("sendReminders email error", e);
      }
    }
  }
  return sent;
}

/** Send forms reminders for bookings with forms_completed=false within 48 hours */
async function sendFormsReminders(): Promise<number> {
  const now = new Date();
  const winStart = now.toISOString().slice(0, 10); // from today
  const winEnd = new Date(now.getTime() + 48 * 3600_000).toISOString().slice(0, 10);

  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select("id, client_name, client_email, treatment_name, booking_date, time_slot, location_id, forms_reminder_sent")
    .eq("forms_completed", false)
    .in("status", ["awaiting_forms", "confirmed"])
    .not("client_email", "is", null)
    .neq("client_email", "")
    .gte("booking_date", winStart)
    .lte("booking_date", winEnd);

  if (error) {
    console.error("sendFormsReminders fetch error", error);
    return 0;
  }

  let sent = 0;
  for (const row of (bookings ?? [])) {
    if (row.forms_reminder_sent) continue;
    try {
      // Fetch location info
      const locRes = await supabaseAdmin
        .from("locations")
        .select("name, address")
        .eq("id", row.location_id)
        .maybeSingle();
      const locName = String(locRes.data?.name ?? "[CLIENT_NAME]");
      const locAddr = String(locRes.data?.address ?? locName);

      await sendFormsReminderEmail({
        clientEmail: String(row.client_email ?? ""),
        clientName: String(row.client_name ?? ""),
        treatment: String(row.treatment_name ?? ""),
        date: String(row.booking_date ?? ""),
        time: String(row.time_slot ?? "").slice(0, 5),
        bookingId: String(row.id),
        locationName: locName,
        locationAddress: locAddr,
      });
      await supabaseAdmin
        .from("bookings")
        .update({ forms_reminder_sent: true })
        .eq("id", String(row.id));
      sent++;
    } catch (e) {
      console.error("sendFormsReminders email error", e);
    }
  }
  return sent;
}

function requireCronSecret(req: import("express").Request, res: import("express").Response): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Cron secret not configured. Add CRON_SECRET to Replit Secrets." });
    return false;
  }

  const jwtSecret = process.env.SESSION_SECRET;
  const auth = req.headers.authorization;
  if (jwtSecret && auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, jwtSecret) as { role?: string };
      if (payload?.role === "admin") return true;
    } catch { /* invalid/expired token — fall through */ }
  }

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

// GET /api/cron/forms-reminders
router.get("/cron/forms-reminders", async (req, res) => {
  if (!requireCronSecret(req, res)) return;
  const sent = await sendFormsReminders();
  return res.json({ ok: true, sent });
});

export default router;
