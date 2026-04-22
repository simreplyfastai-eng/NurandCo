import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();

function getLocationId(req: import("express").Request): string | null {
  return (
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined) ??
    null
  );
}

// GET /api/admin/availability — availability_settings rows for session locationId
router.get("/admin/availability", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  res.set("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    const { data, error } = await supabaseAdmin
      .from("availability_settings")
      .select("day_of_week, is_open, open_time, close_time")
      .eq("location_id", locationId)
      .order("day_of_week");
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err) {
    console.error("GET /api/admin/availability", err);
    return res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// PUT /api/admin/availability — upsert all rows for locationId
// Body: array of { day_of_week, is_open, open_time?, close_time? }
router.put("/admin/availability", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  const rows = req.body as {
    day_of_week: number;
    is_open: boolean;
    open_time?: string;
    close_time?: string;
  }[];
  if (!Array.isArray(rows) || !rows.length)
    return res.status(400).json({ error: "rows array required" });

  try {
    const inserts = rows.map((r) => ({
      location_id: locationId,
      day_of_week: r.day_of_week,
      is_open: r.is_open,
      open_time: r.open_time ?? "09:00",
      close_time: r.close_time ?? "17:00",
    }));
    // Delete-then-insert avoids needing a unique constraint on (location_id, day_of_week)
    const { error: delErr } = await supabaseAdmin
      .from("availability_settings")
      .delete()
      .eq("location_id", locationId);
    if (delErr) throw delErr;
    const { error: insErr } = await supabaseAdmin
      .from("availability_settings")
      .insert(inserts);
    if (insErr) throw insErr;
    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/admin/availability", err);
    return res.status(500).json({ error: "Failed to save availability" });
  }
});

// GET /api/admin/blocked-slots — stub (blocked_slots table not in schema)
router.get("/admin/blocked-slots", (req, res) => {
  if (!requireAuth(req, res)) return;
  return res.json([]);
});

// POST /api/admin/blocked-slots — stub (blocked_slots table not in schema)
router.post("/admin/blocked-slots", (req, res) => {
  if (!requireAuth(req, res)) return;
  return res.status(501).json({ error: "Blocked slots not supported" });
});

// GET /api/admin/blocked-dates — all blocked dates for session locationId
router.get("/admin/blocked-dates", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  res.set("Cache-Control", "no-store, no-cache, must-revalidate");

  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  try {
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
    console.error("GET /api/admin/blocked-dates", err);
    return res.status(500).json({ error: "Failed to fetch blocked dates" });
  }
});

// POST /api/admin/blocked-dates — toggle a blocked date (block if not blocked, unblock if blocked)
router.post("/admin/blocked-dates", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  const { date, action } = req.body as { date: string; action?: "block" | "unblock" };
  if (!date) return res.status(400).json({ error: "date required" });

  try {
    if (action === "unblock") {
      await supabaseAdmin.from("blocked_dates").delete().eq("location_id", locationId).eq("date", date);
      return res.json({ ok: true, blocked: false });
    }
    if (action === "block") {
      await supabaseAdmin.from("blocked_dates").upsert({ location_id: locationId, date, reason: "Manual block" }, { onConflict: "location_id,date" });
      return res.json({ ok: true, blocked: true });
    }
    // Toggle: check if exists
    const { data: existing } = await supabaseAdmin.from("blocked_dates").select("id").eq("location_id", locationId).eq("date", date).maybeSingle();
    if (existing) {
      await supabaseAdmin.from("blocked_dates").delete().eq("location_id", locationId).eq("date", date);
      return res.json({ ok: true, blocked: false });
    } else {
      await supabaseAdmin.from("blocked_dates").upsert({ location_id: locationId, date, reason: "Manual block" }, { onConflict: "location_id,date" });
      return res.json({ ok: true, blocked: true });
    }
  } catch (err) {
    console.error("POST /api/admin/blocked-dates", err);
    return res.status(500).json({ error: "Failed to toggle blocked date" });
  }
});

// DELETE /api/admin/blocked-slots/:id — stub (blocked_slots table not in schema)
router.delete("/admin/blocked-slots/:id", (req, res) => {
  if (!requireAuth(req, res)) return;
  return res.status(501).json({ error: "Blocked slots not supported" });
});

// GET /api/admin/deposit-settings — deposit config for the current location
router.get("/admin/deposit-settings", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  try {
    const { data, error } = await supabaseAdmin
      .from("deposit_settings")
      .select("deposit_type, deposit_value")
      .eq("location_id", locationId)
      .maybeSingle();
    if (error) throw error;
    return res.json(data ?? { deposit_type: "fixed", deposit_value: 50 });
  } catch (err) {
    console.error("GET /api/admin/deposit-settings", err);
    return res.status(500).json({ error: "Failed to fetch deposit settings" });
  }
});

// PUT /api/admin/deposit-settings — upsert deposit config for location
// Body: { deposit_type: 'percent'|'fixed', deposit_value: number }
router.put("/admin/deposit-settings", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  const { deposit_type, deposit_value } = req.body as { deposit_type?: string; deposit_value?: number };
  if (!deposit_type || deposit_value === undefined)
    return res.status(400).json({ error: "deposit_type and deposit_value required" });
  if (!["percent", "fixed"].includes(deposit_type))
    return res.status(400).json({ error: "deposit_type must be 'percent' or 'fixed'" });

  try {
    const { error } = await supabaseAdmin
      .from("deposit_settings")
      .upsert({ location_id: locationId, deposit_type, deposit_value, updated_at: new Date().toISOString() }, { onConflict: "location_id" });
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/admin/deposit-settings", err);
    return res.status(500).json({ error: "Failed to save deposit settings" });
  }
});

// GET /api/admin/clients-supabase — clients from Supabase with enriched stats + bookings
router.get("/admin/clients-supabase", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  try {
    const { data: clients, error: cErr } = await supabaseAdmin
      .from("clients")
      .select("id, name, email, phone, notes, source, visit_count, total_spent, last_visit, created_at, location_id")
      .eq("location_id", locationId)
      .order("last_visit", { ascending: false });
    if (cErr) throw cErr;

    const rows = clients ?? [];
    if (!rows.length) return res.json([]);

    const clientIds = rows.map((c) => c.id as string);
    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("id, client_id, treatments(name), treatment_name, booking_date, time_slot, status, total_amount, deposit_amount")
      .in("client_id", clientIds)
      .order("booking_date", { ascending: false });

    const bkMap: Record<string, unknown[]> = {};
    for (const bk of bookings ?? []) {
      const cid = String(bk.client_id ?? "");
      if (!bkMap[cid]) bkMap[cid] = [];
      // Resolve treatment: JOIN → treatment_name column → ""
      const treatmentName = (bk.treatments as Record<string, unknown> | null)?.name
        ?? (bk.treatment_name as string | null)
        ?? "";
      const rawStatus = String(bk.status ?? "pending");
      const displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
      bkMap[cid].push({
        id: bk.id,
        treatment: treatmentName,
        date: bk.booking_date,
        time: bk.time_slot,
        status: displayStatus,
        price: bk.total_amount,
        depositAmount: bk.deposit_amount,
      });
    }

    const result = rows.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      notes: c.notes ?? "",
      source: c.source ?? "Website",
      visitCount: Number(c.visit_count ?? 0),
      totalSpent: Number(c.total_spent ?? 0),
      lastVisit: c.last_visit ?? null,
      joinDate: c.created_at ? new Date(String(c.created_at)).toISOString().slice(0, 10) : null,
      createdAt: c.created_at,
      locationId: c.location_id,
      bookings: bkMap[String(c.id)] ?? [],
    }));
    return res.json(result);
  } catch (err) {
    console.error("GET /api/admin/clients-supabase", err);
    return res.status(500).json({ error: "Failed to fetch clients" });
  }
});

export default router;
