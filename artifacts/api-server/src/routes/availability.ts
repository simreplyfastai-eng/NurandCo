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

export default router;
