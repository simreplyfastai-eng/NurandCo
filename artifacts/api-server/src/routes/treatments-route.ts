import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuth } from "../lib/auth";

const router = Router();

function getLocationId(req: import("express").Request): string | null {
  return (
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined) ??
    null
  );
}

// GET /api/treatments — returns active treatments for a location
router.get("/treatments", async (req, res) => {
  const locationId = getLocationId(req);
  if (!locationId) {
    return res.status(400).json({ error: "locationId or X-Location-Id required" });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("treatments")
      .select("id, name, duration_minutes, price, deposit_amount, active")
      .eq("location_id", locationId)
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err) {
    console.error("GET /api/treatments", err);
    return res.status(500).json({ error: "Failed to load treatments" });
  }
});

// GET /api/treatments/all — returns all treatments (including inactive) — admin only
router.get("/treatments/all", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  try {
    const { data, error } = await supabaseAdmin
      .from("treatments")
      .select("id, name, duration_minutes, price, deposit_amount, active")
      .eq("location_id", locationId)
      .order("name");
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err) {
    console.error("GET /api/treatments/all", err);
    return res.status(500).json({ error: "Failed to load treatments" });
  }
});

// POST /api/treatments — create a treatment — admin only
router.post("/treatments", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  const { name, duration_minutes, price, deposit_amount } = req.body as Record<string, unknown>;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const { data, error } = await supabaseAdmin
      .from("treatments")
      .insert({ location_id: locationId, name, duration_minutes, price, deposit_amount, active: true })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error("POST /api/treatments", err);
    return res.status(500).json({ error: "Failed to create treatment" });
  }
});

// PUT /api/treatments/:id — update a treatment — admin only
router.put("/treatments/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  const { name, duration_minutes, price, deposit_amount, active } = req.body as Record<string, unknown>;
  try {
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
    if (price !== undefined) updates.price = price;
    if (deposit_amount !== undefined) updates.deposit_amount = deposit_amount;
    if (active !== undefined) updates.active = active;
    const { data, error } = await supabaseAdmin
      .from("treatments")
      .update(updates)
      .eq("id", req.params.id)
      .eq("location_id", locationId)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error("PUT /api/treatments/:id", err);
    return res.status(500).json({ error: "Failed to update treatment" });
  }
});

export default router;
