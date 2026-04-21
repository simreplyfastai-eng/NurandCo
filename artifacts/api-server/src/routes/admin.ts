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

  try {
    const { data, error } = await supabaseAdmin
      .from("availability_settings")
      .select("day_of_week, is_open, start_time, end_time")
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
    const upserts = rows.map((r) => ({
      location_id: locationId,
      day_of_week: r.day_of_week,
      is_open: r.is_open,
      start_time: r.open_time ?? null,
      end_time: r.close_time ?? null,
    }));
    const { error } = await supabaseAdmin
      .from("availability_settings")
      .upsert(upserts, { onConflict: "location_id,day_of_week" });
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/admin/availability", err);
    return res.status(500).json({ error: "Failed to save availability" });
  }
});

// GET /api/admin/blocked-slots — all blocked_slots for session locationId
router.get("/admin/blocked-slots", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });

  try {
    const { data, error } = await supabaseAdmin
      .from("blocked_slots")
      .select("id, day_of_week, all_days, start_time, end_time, label")
      .eq("location_id", locationId)
      .order("created_at");
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err) {
    console.error("GET /api/admin/blocked-slots", err);
    return res.status(500).json({ error: "Failed to fetch blocked slots" });
  }
});

// POST /api/admin/blocked-slots — insert new blocked slot
// Body: { day_of_week?, all_days?, start_time, end_time, label? }
router.post("/admin/blocked-slots", async (req, res) => {
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
    console.error("POST /api/admin/blocked-slots", err);
    return res.status(500).json({ error: "Failed to create blocked slot" });
  }
});

// DELETE /api/admin/blocked-slots/:id — delete slot (verifies location match)
router.delete("/admin/blocked-slots/:id", async (req, res) => {
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
    console.error("DELETE /api/admin/blocked-slots", err);
    return res.status(500).json({ error: "Failed to delete blocked slot" });
  }
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
