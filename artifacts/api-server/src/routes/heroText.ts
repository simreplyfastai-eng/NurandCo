import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuth } from "../lib/auth";

const router = Router();

const DEFAULTS = {
  headline: "Considered aesthetics.",
  subtitle: "Precision aesthetics. Confident results.",
  locationLabel: "NOTTINGHAM",
};

async function resolveLocationId(raw: string | undefined): Promise<string | null> {
  if (!raw) return null;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID_RE.test(raw)) return raw;
  const { data } = await supabaseAdmin.from("locations").select("id").eq("slug", raw).maybeSingle();
  return data?.id ? String(data.id) : null;
}

// GET /api/hero/config — public, served to live website
router.get("/hero/config", async (req, res) => {
  try {
    const rawLoc = (req.query.locationId as string | undefined) ??
                   (req.headers["x-location-id"] as string | undefined);
    let locationId = await resolveLocationId(rawLoc);
    if (!locationId) {
      const { data: first } = await supabaseAdmin
        .from("locations")
        .select("id")
        .order("name")
        .limit(1)
        .maybeSingle();
      locationId = first?.id ? String(first.id) : null;
    }
    if (!locationId) return res.json(DEFAULTS);
    const { data: kvRow } = await supabaseAdmin
      .from("portal_kv")
      .select("value")
      .eq("location_id", locationId)
      .eq("key", "dd_hero_text")
      .maybeSingle();
    const stored = (kvRow?.value as Record<string, unknown>) ?? {};
    return res.json({ ...DEFAULTS, ...stored });
  } catch (err) {
    console.error("GET /api/hero/config", err);
    return res.json(DEFAULTS);
  }
});

// POST /api/hero/config — admin only, save one field or all
router.post("/hero/config", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const locationId = (req.headers["x-location-id"] as string | undefined) ?? null;
    if (!locationId) return res.status(400).json({ error: "X-Location-Id header required" });
    const { field, value } = req.body as { field?: string; value?: unknown };
    if (!field) return res.status(400).json({ error: "field required" });
    if (!(field in DEFAULTS) && field !== "all") {
      return res.status(400).json({ error: "unknown field" });
    }
    const { data: kvRow } = await supabaseAdmin
      .from("portal_kv")
      .select("id, value")
      .eq("location_id", locationId)
      .eq("key", "dd_hero_text")
      .maybeSingle();
    const currentValue = (kvRow?.value as Record<string, unknown>) ?? {};
    const updated =
      field === "all" && value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : { ...currentValue, [field]: value };
    const now = new Date().toISOString();
    let writeError;
    if (kvRow?.id) {
      const { error } = await supabaseAdmin
        .from("portal_kv")
        .update({ value: updated, updated_at: now })
        .eq("id", String(kvRow.id));
      writeError = error;
    } else {
      const { error } = await supabaseAdmin
        .from("portal_kv")
        .insert({ location_id: locationId, key: "dd_hero_text", value: updated, updated_at: now });
      writeError = error;
    }
    if (writeError) {
      return res.status(500).json({ error: "Failed to save hero text" });
    }
    return res.json({ success: true, field, value: updated });
  } catch (err: any) {
    console.error("POST /api/hero/config FAILED:", err);
    return res.status(500).json({ error: "Failed to save hero text" });
  }
});

export default router;
