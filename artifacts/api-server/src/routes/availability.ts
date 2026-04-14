import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

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

// Day index (0=Sun..6=Sat) to day-name key mapping
const IDX_TO_DAY: Record<string, string> = {
  "0": "Sun", "1": "Mon", "2": "Tue", "3": "Wed", "4": "Thu", "5": "Fri", "6": "Sat",
};

// GET /api/availability  — returns the availability config from portal_kv
// Normalises numeric-key defaults (legacy) to named-key format expected by the website calendar
router.get("/availability", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM portal_kv WHERE key = $1",
      ['fbn_availability'],
    );
    if (result.rows.length === 0) {
      return res.json(AVAIL_DEFAULT);
    }
    const raw = result.rows[0].value as { defaults?: Record<string, unknown>; overrides?: Record<string, unknown> };
    if (!raw.overrides) raw.overrides = {};

    // Detect if defaults uses numeric keys and normalise to named keys
    if (raw.defaults) {
      const firstKey = Object.keys(raw.defaults)[0];
      if (firstKey !== undefined && /^\d$/.test(firstKey)) {
        const named: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(raw.defaults)) {
          const dayName = IDX_TO_DAY[k];
          if (dayName) named[dayName] = v;
        }
        raw.defaults = named;
      }
    } else {
      raw.defaults = AVAIL_DEFAULT.defaults;
    }

    return res.json(raw);
  } catch (err) {
    console.error("GET /api/availability", err);
    return res.json(AVAIL_DEFAULT);
  }
});

export default router;
