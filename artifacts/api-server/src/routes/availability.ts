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

/** Safely parse a YYYY-MM-DD string to UTC day-of-week (0=Sun…6=Sat) */
function parseDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Get current London time as { hours, minutes } — handles BST/GMT automatically */
function londonNow(): { hours: number; minutes: number } {
  const londonStr = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });
  // Format: "22/04/2026, 14:30:00"
  const timePart = londonStr.split(", ")[1] ?? "00:00:00";
  const [h, m] = timePart.split(":").map(Number);
  return { hours: h, minutes: m };
}

/** Get today's date in London timezone as YYYY-MM-DD */
function londonToday(): string {
  const now = new Date();
  const londonStr = now.toLocaleDateString("en-GB", { timeZone: "Europe/London" });
  // Format: "22/04/2026"
  const [d, m, y] = londonStr.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** Resolve location slug or UUID → UUID */
async function resolveLocationId(param: string): Promise<string | null> {
  if (!param) return null;
  // Already looks like a UUID (contains dashes and is long enough)
  if (param.includes("-") && param.length >= 32) return param;
  // Resolve slug → UUID
  const { data: loc } = await supabaseAdmin
    .from("locations")
    .select("id")
    .eq("slug", param)
    .maybeSingle();
  return loc ? (loc.id as string) : null;
}

/** Get availability for a day_of_week from the DB row or hardcoded defaults */
function resolveAvail(
  dbRow: { is_open: boolean; start_time: string | null; end_time: string | null } | null,
  dayOfWeek: number,
): { isOpen: boolean; startTime: string; endTime: string } {
  if (dbRow) {
    return {
      isOpen: !!dbRow.is_open,
      startTime: (dbRow.start_time as string | null)?.substring(0, 5) ?? "09:00",
      endTime: (dbRow.end_time as string | null)?.substring(0, 5) ?? "17:00",
    };
  }
  const dayName = DAY_NAMES[dayOfWeek];
  const def = dayName ? AVAIL_DEFAULT.defaults[dayName as keyof typeof AVAIL_DEFAULT.defaults] : undefined;
  return {
    isOpen: def?.on ?? false,
    startTime: (def && "start" in def ? def.start : null) ?? "09:00",
    endTime: (def && "end" in def ? def.end : null) ?? "17:00",
  };
}

/** Generate time slots using string arithmetic — no Date objects, no timezone issues */
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

function getLocationId(req: import("express").Request): string | null {
  return (
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined) ??
    null
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability/check?location=<slug>&date=YYYY-MM-DD&time=HH:MM
// ─────────────────────────────────────────────────────────────────────────────
router.get("/availability/check", async (req, res) => {
  const locationParam = (req.query.location as string | undefined) ?? getLocationId(req);
  const date = req.query.date as string | undefined;
  const time = req.query.time as string | undefined;

  if (!locationParam || !date || !time) {
    return res.status(400).json({ error: "location, date and time required" });
  }

  try {
    const locationId = await resolveLocationId(locationParam);
    if (!locationId) return res.status(404).json({ error: "Location not found" });

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

    // 2. Clinic open on this day?
    const dayOfWeek = parseDayOfWeek(date);
    const { data: availRow } = await supabaseAdmin
      .from("availability_settings")
      .select("is_open, start_time, end_time")
      .eq("location_id", locationId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    const { isOpen, startTime, endTime } = resolveAvail(
      availRow as { is_open: boolean; start_time: string | null; end_time: string | null } | null,
      dayOfWeek,
    );

    if (!isOpen) return res.json({ available: false, reason: "CLINIC_CLOSED" });

    // 3. Time within open hours?
    const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const slotMins = toMins(time);
    if (slotMins < toMins(startTime) || slotMins >= toMins(endTime)) {
      return res.json({ available: false, reason: "OUTSIDE_HOURS" });
    }

    // 4. Slot taken?
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
    return res.json({ available: true }); // fail open
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability — legacy {defaults, overrides} for booking widget
// ─────────────────────────────────────────────────────────────────────────────
router.get("/availability", async (req, res) => {
  const locationId = getLocationId(req);
  if (!locationId) return res.json(AVAIL_DEFAULT);

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
            ? { on: true, start: (row.start_time ?? "09:00").substring(0, 5), end: (row.end_time ?? "17:00").substring(0, 5) }
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability/settings?location=[slug]
// Comprehensive: returns 7-day schedule + blocked dates (next 90 days) + blocked slots
// ─────────────────────────────────────────────────────────────────────────────
router.get("/availability/settings", async (req, res) => {
  const locationParam = (req.query.location as string | undefined) ?? getLocationId(req);
  if (!locationParam) return res.status(400).json({ error: "location required" });

  try {
    const locationId = await resolveLocationId(locationParam);
    if (!locationId) return res.status(404).json({ error: "Location not found" });

    const today = londonToday();
    const ninetyDays = new Date();
    ninetyDays.setUTCDate(ninetyDays.getUTCDate() + 90);
    const future = ninetyDays.toISOString().slice(0, 10);

    const [settingsRes, blockedDatesRes, blockedSlotsRes] = await Promise.all([
      supabaseAdmin
        .from("availability_settings")
        .select("day_of_week, is_open, start_time, end_time")
        .eq("location_id", locationId)
        .order("day_of_week"),
      supabaseAdmin
        .from("blocked_dates")
        .select("date, reason")
        .eq("location_id", locationId)
        .gte("date", today)
        .lte("date", future),
      supabaseAdmin
        .from("blocked_slots")
        .select("id, day_of_week, all_days, start_time, end_time, label")
        .eq("location_id", locationId),
    ]);

    const days: Record<number, { is_open: boolean; open_time: string; close_time: string }> = {};
    for (let i = 0; i < 7; i++) {
      const dayName = DAY_NAMES[i];
      const def = dayName ? AVAIL_DEFAULT.defaults[dayName as keyof typeof AVAIL_DEFAULT.defaults] : undefined;
      days[i] = { is_open: def?.on ?? false, open_time: (def && "start" in def ? def.start : null) ?? "09:00", close_time: (def && "end" in def ? def.end : null) ?? "17:00" };
    }
    for (const row of settingsRes.data ?? []) {
      days[row.day_of_week as number] = {
        is_open: !!row.is_open,
        open_time: (row.start_time ?? "09:00").substring(0, 5),
        close_time: (row.end_time ?? "17:00").substring(0, 5),
      };
    }

    return res.json({
      days: Object.entries(days).map(([dow, v]) => ({ day_of_week: Number(dow), ...v })),
      blocked_dates: (blockedDatesRes.data ?? []).map((r: { date: string; reason?: string | null }) => ({ date: r.date, reason: r.reason ?? null })),
      blocked_slots: blockedSlotsRes.data ?? [],
    });
  } catch (err) {
    console.error("GET /api/availability/settings", err);
    return res.status(500).json({ error: "Failed to get settings" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/availability/settings — save weekly schedule (JWT required)
// Body: { days: [{day_of_week, is_open, open_time, close_time}] }
// ─────────────────────────────────────────────────────────────────────────────
router.put("/availability/settings", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  const { days } = req.body as {
    days?: { day_of_week: number; is_open: boolean; open_time?: string; close_time?: string }[];
  };
  if (!days || !days.length) return res.status(400).json({ error: "days array required" });

  try {
    const upserts = days.map((d) => ({
      location_id: locationId,
      day_of_week: d.day_of_week,
      is_open: d.is_open,
      start_time: d.open_time ?? null,
      end_time: d.close_time ?? null,
    }));
    const { error } = await supabaseAdmin
      .from("availability_settings")
      .upsert(upserts, { onConflict: "location_id,day_of_week" });
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/availability/settings", err);
    return res.status(500).json({ error: "Failed to save settings" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/availability/settings — legacy alias (admin portal uses this)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability/blocked-dates?location=[slug]&from=YYYY-MM-DD&to=YYYY-MM-DD
// PUBLIC — returns array of blocked date strings
// ─────────────────────────────────────────────────────────────────────────────
router.get("/availability/blocked-dates", async (req, res) => {
  const locationParam = (req.query.location as string | undefined) ?? getLocationId(req);
  if (!locationParam) return res.status(400).json({ error: "location required" });

  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  try {
    const locationId = await resolveLocationId(locationParam);
    if (!locationId) return res.status(404).json({ error: "Location not found" });

    let query = supabaseAdmin
      .from("blocked_dates")
      .select("date, reason")
      .eq("location_id", locationId)
      .order("date");

    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);

    const { data, error } = await query;
    if (error) throw error;

    return res.json((data ?? []).map((r: { date: string }) => r.date));
  } catch (err) {
    console.error("GET /api/availability/blocked-dates", err);
    return res.status(500).json({ error: "Failed to get blocked dates" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/availability/block — block a date (JWT required)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/availability/block-date — alias for /block
// ─────────────────────────────────────────────────────────────────────────────
router.post("/availability/block-date", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  const { date, reason } = req.body as { date: string; reason?: string };
  if (!date) return res.status(400).json({ error: "date required" });

  try {
    await supabaseAdmin
      .from("blocked_dates")
      .upsert({ location_id: locationId, date, reason: reason ?? "Manual block" }, { onConflict: "location_id,date" });
    return res.json({ ok: true, date });
  } catch (err) {
    console.error("POST /api/availability/block-date", err);
    return res.status(500).json({ error: "Failed to block date" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/availability/block/:date — unblock a date (JWT required)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/availability/block-date/:date — alias
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/availability/block-date/:date", async (req, res) => {
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
    console.error("DELETE /api/availability/block-date", err);
    return res.status(500).json({ error: "Failed to unblock date" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/availability/blocked-slots — add recurring block (JWT required)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/availability/blocked-slots", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  const { day_of_week, all_days, start_time, end_time, label } = req.body as {
    day_of_week?: number;
    all_days?: boolean;
    start_time: string;
    end_time: string;
    label?: string;
  };

  if (!start_time || !end_time)
    return res.status(400).json({ error: "start_time and end_time required" });
  if (start_time >= end_time)
    return res.status(400).json({ error: "start_time must be before end_time" });
  if (!all_days && (day_of_week === undefined || day_of_week === null))
    return res.status(400).json({ error: "day_of_week or all_days required" });

  try {
    const { data, error } = await supabaseAdmin
      .from("blocked_slots")
      .insert({
        location_id: locationId,
        day_of_week: all_days ? null : day_of_week,
        all_days: all_days ?? false,
        start_time,
        end_time,
        label: label ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error("POST /api/availability/blocked-slots", err);
    return res.status(500).json({ error: "Failed to create blocked slot" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/availability/blocked-slots/:id (JWT required)
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/availability/blocked-slots/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  try {
    const { error } = await supabaseAdmin
      .from("blocked_slots")
      .delete()
      .eq("id", req.params.id)
      .eq("location_id", locationId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/availability/blocked-slots", err);
    return res.status(500).json({ error: "Failed to delete blocked slot" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/availability/slots?location=[slug]&date=YYYY-MM-DD
// PUBLIC — returns rich slot list with availability status
// Response: { available, date, dayName, openTime, closeTime, slots: [{time, available, reason}] }
// ─────────────────────────────────────────────────────────────────────────────
router.get("/availability/slots", async (req, res) => {
  const locationParam =
    (req.query.location as string | undefined) ??
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined);
  const date = req.query.date as string | undefined;

  if (!date) return res.status(400).json({ error: "date required" });
  if (!locationParam) return res.status(400).json({ error: "location required" });

  try {
    const locationId = await resolveLocationId(locationParam);
    if (!locationId) return res.status(404).json({ error: "Location not found" });

    // RULE 2: safe UTC day-of-week
    const dayOfWeek = parseDayOfWeek(date);

    // 1. Full-day blocked?
    const { data: blockedDate } = await supabaseAdmin
      .from("blocked_dates")
      .select("date")
      .eq("location_id", locationId)
      .eq("date", date)
      .maybeSingle();

    if (blockedDate) {
      return res.json({ available: false, reason: "DATE_BLOCKED", date, slots: [] });
    }

    // 2. Clinic open this day?
    const { data: availRow } = await supabaseAdmin
      .from("availability_settings")
      .select("is_open, start_time, end_time")
      .eq("location_id", locationId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    const { isOpen, startTime, endTime } = resolveAvail(
      availRow as { is_open: boolean; start_time: string | null; end_time: string | null } | null,
      dayOfWeek,
    );

    if (!isOpen) {
      return res.json({ available: false, reason: "CLINIC_CLOSED", date, slots: [] });
    }

    // 3. Generate all 30-min slots (RULE 4: string arithmetic, no Date objects)
    const allSlots = generateTimeSlots(startTime, endTime, 30);

    // 4. Get intra-day recurring blocks
    const { data: blockedSlots } = await supabaseAdmin
      .from("blocked_slots")
      .select("start_time, end_time")
      .eq("location_id", locationId)
      .or(`day_of_week.eq.${dayOfWeek},all_days.eq.true`);

    // 5. Get existing bookings
    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("time_slot")
      .eq("location_id", locationId)
      .eq("booking_date", date)
      .not("status", "eq", "cancelled");

    const bookedSet = new Set((bookings ?? []).map((b: { time_slot: string }) => b.time_slot?.substring(0, 5)));

    // 6. RULE 7: remove past slots using London time with 30-min buffer
    const todayStr = londonToday();
    const isToday = date === todayStr;
    let nowMinutes = 0;
    if (isToday) {
      const { hours, minutes } = londonNow();
      nowMinutes = hours * 60 + minutes + 30; // 30-min buffer
    }

    const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

    // Build rich slot list
    const slots = allSlots.map((slotTime) => {
      const slotMins = toMins(slotTime);

      // Past slot?
      if (isToday && slotMins < nowMinutes) {
        return { time: slotTime, available: false, reason: "past" };
      }

      // Booked?
      if (bookedSet.has(slotTime)) {
        return { time: slotTime, available: false, reason: "booked" };
      }

      // Recurring block?
      const isBlocked = (blockedSlots ?? []).some(
        (b: { start_time: string; end_time: string }) =>
          slotMins >= toMins(b.start_time.substring(0, 5)) &&
          slotMins < toMins(b.end_time.substring(0, 5)),
      );
      if (isBlocked) {
        return { time: slotTime, available: false, reason: "blocked" };
      }

      return { time: slotTime, available: true };
    });

    return res.json({
      available: true,
      date,
      dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek],
      openTime: startTime,
      closeTime: endTime,
      slots,
    });
  } catch (err) {
    console.error("GET /api/availability/slots", err);
    return res.status(500).json({ error: "Failed to get available slots" });
  }
});

export default router;
