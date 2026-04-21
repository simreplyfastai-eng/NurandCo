import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuth } from "../lib/auth";

const router = Router();

// ── fbn_* → dd_* key translation (portal.html uses fbn_*, Supabase stores dd_*) ──
const KV_KEY_MAP: Record<string, string> = {
  fbn_settings:            "dd_settings",
  fbn_custom_treats:       "dd_custom_treats",
  fbn_custom_cats:         "dd_custom_cats",
  fbn_cat_states:          "dd_cat_states",
  fbn_treatment_overrides: "dd_treatment_overrides",
  fbn_video_labels:        "dd_video_labels",
  fbn_availability:        "dd_availability",
  fbn_initialized:         "dd_initialized",
  fbn_media:               "dd_media",
};
const KV_KEY_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(KV_KEY_MAP).map(([k, v]) => [v, k]),
);
function toDbKey(k: string): string { return KV_KEY_MAP[k] ?? k; }
function fromDbKey(k: string): string { return KV_KEY_REVERSE[k] ?? k; }

const ALLOWED_KV_KEYS = new Set([
  ...Object.keys(KV_KEY_MAP),
  ...Object.values(KV_KEY_MAP),
  "admin_password_override",
]);

function getLocationId(req: import("express").Request): string | null {
  return (
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined) ??
    null
  );
}

// ── portal_kv helpers ─────────────────────────────────────────────────────────

async function kvGet(locationId: string, dbKey: string): Promise<unknown> {
  const { data } = await supabaseAdmin
    .from("portal_kv")
    .select("value")
    .eq("location_id", locationId)
    .eq("key", dbKey)
    .maybeSingle();
  return data?.value ?? null;
}

async function kvGetMany(locationId: string, dbKeys: string[]): Promise<Record<string, unknown>> {
  const { data } = await supabaseAdmin
    .from("portal_kv")
    .select("key, value")
    .eq("location_id", locationId)
    .in("key", dbKeys);
  const out: Record<string, unknown> = {};
  for (const row of (data ?? [])) out[row.key as string] = row.value;
  return out;
}

async function kvSet(locationId: string, dbKey: string, value: unknown): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from("portal_kv")
    .select("id")
    .eq("location_id", locationId)
    .eq("key", dbKey)
    .maybeSingle();
  const now = new Date().toISOString();
  if (existing?.id) {
    await supabaseAdmin
      .from("portal_kv")
      .update({ value, updated_at: now })
      .eq("id", String(existing.id));
  } else {
    await supabaseAdmin
      .from("portal_kv")
      .insert({ location_id: locationId, key: dbKey, value, updated_at: now });
  }
}

// ── Treatment catalog for the public website ──────────────────────────────────

const BUILT_IN_TREATMENTS = [
  {cat:'BOTOX',name:'1 Area of Anti-Wrinkle',duration:30,price:140},
  {cat:'BOTOX',name:'2 Areas of Anti-Wrinkle',duration:30,price:200},
  {cat:'BOTOX',name:'3 Areas of Anti-Wrinkle',duration:45,price:230},
  {cat:'BOTOX',name:'Brow Lift',duration:30,price:150},
  {cat:'BOTOX',name:'2 Week Review / Top-up',duration:15,price:10},
  {cat:'BOTOX',name:'Masseter Face Slimming Tox',duration:30,price:150},
  {cat:'BOTOX',name:'Nose Tip Lift Tox',duration:30,price:140},
  {cat:'BOTOX',name:'DAO Tox (Downturned Smile)',duration:30,price:140},
  {cat:'BOTOX',name:'Dimple Chin Tox',duration:30,price:150},
  {cat:'BOTOX',name:'Nose Slimming Tox',duration:30,price:140},
  {cat:'FILLER',name:'Consultation',duration:30,price:10},
  {cat:'FILLER',name:'Facial Slimming Package',duration:60,price:315},
  {cat:'FILLER',name:'Summer Glow Up',duration:60,price:320},
  {cat:'FILLER',name:'1ml Lip Filler',duration:45,price:130},
  {cat:'FILLER',name:'0.7ml Lip Filler',duration:30,price:110},
  {cat:'FILLER',name:'0.5ml Lip Filler',duration:30,price:100},
  {cat:'FILLER',name:'Lip Filler Dissolving',duration:30,price:95},
  {cat:'FILLER',name:'Lip Filler Dissolve & 1ml Lip Refill',duration:60,price:190},
  {cat:'FILLER',name:'1ml Cheek Contour',duration:45,price:130},
  {cat:'FILLER',name:'Jaw Filler',duration:60,price:130},
  {cat:'FILLER',name:'Chin Augmentation',duration:45,price:110},
  {cat:'FILLER',name:'Non-Surgical Rhinoplasty',duration:45,price:130},
  {cat:'FILLER',name:'Pixie Tip Lift',duration:30,price:80},
  {cat:'FILLER',name:'Tear Trough Filler',duration:45,price:130},
  {cat:'FILLER',name:'Nasolabial Folds',duration:45,price:110},
  {cat:'FILLER',name:'2ml Package',duration:60,price:220},
  {cat:'FILLER',name:'3ml Package',duration:75,price:295},
  {cat:'FILLER',name:'4ml Package',duration:90,price:395},
  {cat:'FILLER',name:'5ml Package',duration:105,price:495},
  {cat:'SKINBOOST',name:'Profhilo',duration:45,price:140},
  {cat:'SKINBOOST',name:'Profhilo X4 Sessions',duration:45,price:450},
  {cat:'SKINBOOST',name:'Jalupro HMW',duration:45,price:130},
  {cat:'SKINBOOST',name:'Jalupro HMW X4 Sessions',duration:45,price:420},
  {cat:'SKINBOOST',name:'Lumi Eyes',duration:30,price:100},
  {cat:'SKINBOOST',name:'Lumi Eyes X4 Sessions',duration:30,price:350},
  {cat:'SKINBOOST',name:'Seventy Hyal',duration:45,price:120},
  {cat:'SKINBOOST',name:'Seventy Hyal X4 Sessions',duration:45,price:300},
  {cat:'FACIALS',name:'Luxury Dermaplane',duration:45,price:30},
  {cat:'FACIALS',name:'Luxury Microneedling with Salmon DNA',duration:60,price:45},
  {cat:'FACIALS',name:'Luxury Dermaplane & Microneedling with Salmon DNA',duration:75,price:65},
  {cat:'VITAMIN',name:'Vitamin B12 Injection',duration:15,price:25},
  {cat:'VITAMIN',name:'Weekly Course of B12 Injections x4',duration:15,price:90},
];

const CAT_LABELS: Record<string, string> = {
  BOTOX:'Anti-Wrinkle',FILLER:'Dermal Fillers',FACIALS:'Facials',
  SKINBOOST:'Skin Boosters',VITAMIN:'Vitamin Injections',
  BUNDLES:'Treatment Bundles',CONSULT:'Consultation',
};
const CAT_ORDER = ['BOTOX','FILLER','SKINBOOST','FACIALS','VITAMIN','BUNDLES','CONSULT'];

function formatDuration(mins: number): string {
  if (typeof mins !== 'number' || mins <= 0) return '30 mins';
  if (mins >= 60) return mins === 60 ? '1 hr' : `${Math.floor(mins/60)} hr ${mins%60 ? mins%60 + ' mins' : ''}`.trim();
  return `${mins} mins`;
}

function buildTreatmentCategories(kvData: Record<string, unknown>) {
  const customTreats: unknown[] = Array.isArray(kvData['dd_custom_treats']) ? kvData['dd_custom_treats'] as unknown[] : [];
  const customCats: unknown[] = Array.isArray(kvData['dd_custom_cats']) ? kvData['dd_custom_cats'] as unknown[] : [];
  const overrides: Record<string, unknown> = (kvData['dd_treatment_overrides'] && typeof kvData['dd_treatment_overrides'] === 'object' && !Array.isArray(kvData['dd_treatment_overrides'])) ? kvData['dd_treatment_overrides'] as Record<string, unknown> : {};

  const validCustomTreats = (customTreats as Record<string, unknown>[]).filter(t =>
    t && typeof t === 'object' && typeof t.name === 'string' && (t.name as string).trim() &&
    typeof t.cat === 'string' && (t.cat as string).trim()
  );

  const allTreats = [...BUILT_IN_TREATMENTS, ...(validCustomTreats as {cat:string;name:string;duration:number;price:number}[])];

  const allCatLabels: Record<string, string> = { ...CAT_LABELS };
  for (const c of customCats as Record<string, unknown>[]) {
    if (c && typeof c.key === 'string' && typeof c.label === 'string') {
      allCatLabels[c.key] = c.label;
    }
  }
  const catOrder = [...CAT_ORDER];
  for (const c of customCats as Record<string, unknown>[]) {
    if (c && typeof c.key === 'string' && !catOrder.includes(c.key)) catOrder.push(c.key);
  }

  const grouped: Record<string, { name: string; price: string; duration: string; durationMins: number }[]> = {};
  for (const t of allTreats) {
    const ov = (overrides[t.name] as Record<string, unknown>) || {};
    const price = Number(ov.price ?? t.price) || 0;
    const dur = Number(ov.duration ?? t.duration) || 30;
    if (!grouped[t.cat]) grouped[t.cat] = [];
    grouped[t.cat].push({ name: String(t.name), price: `£${price}`, duration: formatDuration(dur), durationMins: dur });
  }

  return catOrder
    .filter(k => grouped[k] && grouped[k].length > 0)
    .map(k => ({ title: allCatLabels[k] || k, items: grouped[k] }));
}

// Treatments cache is per-location
const treatmentsCacheMap = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60_000;

// GET /api/portal/catalog — public treatment catalog with optional locationId
// (treatments-route.ts handles GET /api/treatments for structured Supabase data;
//  this endpoint builds the website's category view from portal_kv overrides)
router.get("/portal/catalog", async (req, res) => {
  try {
    const locationId = getLocationId(req);
    const cacheKey = locationId ?? "__global__";
    const cached = treatmentsCacheMap.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached.data);
    }

    let kvData: Record<string, unknown> = {};
    if (locationId) {
      kvData = await kvGetMany(locationId, ["dd_custom_treats", "dd_custom_cats", "dd_treatment_overrides"]);
    }

    const categories = buildTreatmentCategories(kvData);
    treatmentsCacheMap.set(cacheKey, { data: categories, timestamp: Date.now() });
    res.setHeader("X-Cache", "MISS");
    return res.json(categories);
  } catch (err) {
    console.error("GET /api/portal/catalog error", err);
    return res.json(buildTreatmentCategories({}));
  }
});

// ── Portal KV store ───────────────────────────────────────────────────────────

// GET /api/portal/store?keys=fbn_settings,fbn_custom_treats,...&locationId=<uuid>
router.get("/portal/store", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const raw = req.query["keys"];
  const keysStr = Array.isArray(raw) ? raw.join(",") : ((raw as string) || "");
  const keys = keysStr.split(",").map(k => k.trim()).filter(k => ALLOWED_KV_KEYS.has(k));
  if (!keys.length) return res.json({});

  const locationId = getLocationId(req);
  const out: Record<string, unknown> = {};

  const globalKeys = keys.filter(k => k === "admin_password_override");
  const locationKeys = keys.filter(k => k !== "admin_password_override");

  if (globalKeys.length) {
    const { data } = await supabaseAdmin
      .from("portal_kv")
      .select("key, value")
      .is("location_id", null)
      .in("key", globalKeys);
    for (const row of (data ?? [])) out[row.key as string] = row.value;
  }

  if (locationKeys.length && locationId) {
    const dbKeys = [...new Set(locationKeys.map(toDbKey))];
    const dbData = await kvGetMany(locationId, dbKeys);
    for (const [dbKey, value] of Object.entries(dbData)) {
      const clientKey = fromDbKey(dbKey);
      out[clientKey] = value;
    }
  }

  return res.json(out);
});

// GET /api/portal/store/:key
router.get("/portal/store/:key", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { key } = req.params;
  if (!ALLOWED_KV_KEYS.has(key)) return res.status(400).json({ error: "invalid key" });

  try {
    if (key === "admin_password_override") {
      const { data } = await supabaseAdmin
        .from("portal_kv")
        .select("value")
        .is("location_id", null)
        .eq("key", key)
        .maybeSingle();
      return res.json({ value: data?.value ?? null });
    }

    const locationId = getLocationId(req);
    if (!locationId) return res.json({ value: null });

    const value = await kvGet(locationId, toDbKey(key));
    return res.json({ value });
  } catch (err) {
    console.error("portal GET /:key error", err);
    return res.status(500).json({ error: "db error" });
  }
});

// PUT /api/portal/store/:key
router.put("/portal/store/:key", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { key } = req.params;
  if (!ALLOWED_KV_KEYS.has(key)) return res.status(400).json({ error: "invalid key" });

  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: "value required" });

  try {
    if (key === "admin_password_override") {
      const { data: existing } = await supabaseAdmin
        .from("portal_kv")
        .select("id")
        .is("location_id", null)
        .eq("key", key)
        .maybeSingle();
      const now = new Date().toISOString();
      if (existing?.id) {
        await supabaseAdmin.from("portal_kv").update({ value, updated_at: now }).eq("id", String(existing.id));
      } else {
        await supabaseAdmin.from("portal_kv").insert({ location_id: null, key, value, updated_at: now });
      }
      return res.json({ ok: true });
    }

    const locationId = getLocationId(req);
    if (!locationId) return res.status(400).json({ error: "locationId required for this key" });

    const dbKey = toDbKey(key);
    await kvSet(locationId, dbKey, value);

    // Bust treatment catalog cache when treatment-related keys change
    if (["fbn_custom_treats","fbn_custom_cats","fbn_treatment_overrides",
         "dd_custom_treats","dd_custom_cats","dd_treatment_overrides"].includes(key)) {
      treatmentsCacheMap.delete(locationId);
      treatmentsCacheMap.delete("__global__");
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("portal PUT /:key error", err);
    return res.status(500).json({ error: "db error" });
  }
});

export default router;
