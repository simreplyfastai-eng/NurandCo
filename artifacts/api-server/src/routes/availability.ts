import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuth } from "../lib/auth";

const router = Router();

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const AVAIL_DEFAULT = {
  defaults: {
    Mon: { on: false },
    Tue: { on: true, start: "10:00", end: "19:00" },
    Wed: { on: true, start: "10:00", end: "19:00" },
    Thu: { on: true, start: "10:00", end: "19:00" },
    Fri: { on: true, start: "09:00", end: "16:00" },
    Sat: { on: true, start: "09:00", end: "14:00" },
    Sun: { on: false },
  },
  overrides: {} as Record<string, { on: boolean; start?: string; end?: string }>,
};

function getLocationId(req: import("express").Request): string | null {
  return (
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined) ??
    null
  );
}

// GET /api/availability/check?location=<id>&date=YYYY-MM-DD&time=HH:MM
// Real-time slot check for the booking widget
router.get("/availability/check", async (req, res) => {
  const locationId = (req.query.location as string | undefined) ?? getLocationId(req);
  const date = req.query.date as string | undefined;
  const time = req.query.time as string | undefined;

  if (!locationId || !date || !time) {
    return res.status(400).json({ error: "location, date and time required" });
  }

  try {
    // 1. Date blocked?
    const { data: blocked } = await supabaseAdmin
      .from("blocked_dates")
      .select("id")
      .eq("location_id", locationId)
      .eq("date", date)
      .limit(1);
    if (blocked && blocked.length > 0) {
      return res.json({ available: false, reason: "DATE_BLOCKED" });
    }

    // 2. Clinic open?
    const [y, mo, d] = date.split("-").map(Number);
    const jsDay = new Date(y, mo - 1, d).getDay();
    const { data: avail } = await supabaseAdmin
      .from("availability_settings")
      .select("is_open")
      .eq("location_id", locationId)
      .eq("day_of_week", jsDay)
      .maybeSingle();
    if (!avail?.is_open) {
      return res.json({ available: false, reason: "CLINIC_CLOSED" });
    }

    // 3. Slot taken?
    const { data: existing } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("location_id", locationId)
      .eq("booking_date", date)
      .eq("time_slot", time)
      .not("status", "eq", "cancelled")
      .limit(1);
    if (existing && existing.length > 0) {
      return res.json({ available: false, reason: "SLOT_TAKEN" });
    }

    return res.json({ available: true });
  } catch (err) {
    console.error("GET /api/availability/check", err);
    // Fail open — don't block the user if the check errors
    return res.json({ available: true });
  }
});

// GET /api/availability — returns {defaults, overrides} for a location
// Reads from Supabase availability_settings + blocked_dates when locationId provided
router.get("/availability", async (req, res) => {
  const locationId = getLocationId(req);

  if (!locationId) {
    return res.json(AVAIL_DEFAULT);
  }

  try {
    const [settingsRes, blockedRes] = await Promise.all([
      supabaseAdmin
        .from("availability_settings")
        .select("day_of_week, is_open, start_time, end_time")
        .eq("location_id", locationId)
        .order("day_of_week"),
      supabaseAdmin
        .from("blocked_dates")
        .select("date, reason")
        .eq("location_id", locationId),
    ]);

    const defaults: Record<string, { on: boolean; start?: string; end?: string }> = {
      ...AVAIL_DEFAULT.defaults,
    };

    if (settingsRes.data?.length) {
      for (const row of settingsRes.data) {
        const dayName = DAY_NAMES[row.day_of_week as number];
        if (dayName) {
          defaults[dayName] = row.is_open
            ? { on: true, start: row.start_time ?? "09:00", end: row.end_time ?? "17:00" }
            : { on: false };
        }
      }
    }

    const overrides: Record<string, { on: boolean; start?: string; end?: string }> = {};
    if (blockedRes.data?.length) {
      for (const row of blockedRes.data) {
        overrides[row.date] = { on: false };
      }
    }

    return res.json({ defaults, overrides });
  } catch (err) {
    console.error("GET /api/availability", err);
    return res.json(AVAIL_DEFAULT);
  }
});

// POST /api/availability/settings — save weekly schedule — requires admin + locationId
router.post("/availability/settings", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  const { defaults } = req.body as {
    defaults?: Record<string, { on: boolean; start?: string; end?: string }>;
  };
  if (!defaults) return res.status(400).json({ error: "defaults required" });

  try {
    for (const [dayName, cfg] of Object.entries(defaults)) {
      const dayIndex = DAY_NAMES.indexOf(dayName as typeof DAY_NAMES[number]);
      if (dayIndex === -1) continue;
      await supabaseAdmin
        .from("availability_settings")
        .upsert({
          location_id: locationId,
          day_of_week: dayIndex,
          is_open: cfg.on,
          start_time: cfg.start ?? null,
          end_time: cfg.end ?? null,
        }, { onConflict: "location_id,day_of_week" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/availability/settings", err);
    return res.status(500).json({ error: "Failed to save availability" });
  }
});

// POST /api/availability/block — block a specific date — requires admin + locationId
router.post("/availability/block", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  const { date, reason } = req.body as { date: string; reason?: string };
  if (!date) return res.status(400).json({ error: "date required" });

  try {
    await supabaseAdmin
      .from("blocked_dates")
      .upsert({ location_id: locationId, date, reason: reason ?? null }, { onConflict: "location_id,date" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/availability/block", err);
    return res.status(500).json({ error: "Failed to block date" });
  }
});

// DELETE /api/availability/block/:date — unblock a date — requires admin + locationId
router.delete("/availability/block/:date", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  try {
    await supabaseAdmin
      .from("blocked_dates")
      .delete()
      .eq("location_id", locationId)
      .eq("date", req.params.date);
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/availability/block", err);
    return res.status(500).json({ error: "Failed to unblock date" });
  }
});

// GET /api/availability/slots?date=YYYY-MM-DD — returns available time slots for a date+location
// Filters by: working hours, blocked_dates overrides, blocked_slots (intra-day), existing bookings
router.get("/availability/slots", async (req, res) => {
  const locationId = getLocationId(req);
  const date = req.query.date as string | undefined;
  if (!date) return res.status(400).json({ error: "date required" });
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  try {
    // day_of_week: 0=Sun, 1=Mon, ..., 6=Sat (matches availability_settings seed)
    const [y, mo, d] = date.split("-").map(Number);
    const jsDay = new Date(y, mo - 1, d).getDay();

    // 1. Check for full-day override (blocked date)
    const { data: blocked } = await supabaseAdmin
      .from("blocked_dates")
      .select("date")
      .eq("location_id", locationId)
      .eq("date", date)
      .maybeSingle();

    if (blocked) return res.json([]);

    // 2. Get working hours for this day
    const { data: avail } = await supabaseAdmin
      .from("availability_settings")
      .select("is_open, start_time, end_time")
      .eq("location_id", locationId)
      .eq("day_of_week", jsDay)
      .maybeSingle();

    if (!avail || !avail.is_open) return res.json([]);

    // 3. Generate 30-min slots
    const allSlots = generateTimeSlots(
      avail.start_time ?? "09:00",
      avail.end_time ?? "17:00",
      30,
    );

    // 4. Get intra-day blocked slots for this day (or all_days)
    const { data: blockedSlots } = await supabaseAdmin
      .from("blocked_slots")
      .select("start_time, end_time")
      .eq("location_id", locationId)
      .or(`day_of_week.eq.${jsDay},all_days.eq.true`);

    const afterBlockedSlots = allSlots.filter((slot) => {
      return !(blockedSlots ?? []).some(
        (b: { start_time: string; end_time: string }) =>
          slot >= b.start_time.substring(0, 5) && slot < b.end_time.substring(0, 5),
      );
    });

    // 5. Get existing bookings for this date (treat Pending + Confirmed as taken)
    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("time_slot")
      .eq("location_id", locationId)
      .eq("booking_date", date)
      .in("status", ["pending", "confirmed"]);

    const bookedTimes = new Set((bookings ?? []).map((b: { time_slot: string }) => b.time_slot));
    const available = afterBlockedSlots.filter((s) => !bookedTimes.has(s));

    return res.json(available);
  } catch (err) {
    console.error("GET /api/availability/slots", err);
    return res.status(500).json({ error: "Failed to get available slots" });
  }
});

function generateTimeSlots(openTime: string, closeTime: string, intervalMins: number): string[] {
  const slots: string[] = [];
  let [h, m] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  const closeTotal = ch * 60 + cm;
  while (h * 60 + m < closeTotal) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += intervalMins;
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
  }
  return slots;
}

export default router;
