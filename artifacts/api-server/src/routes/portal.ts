import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

const BUILT_IN_TREATMENTS = [
  // Anti-Wrinkle
  {cat:'BOTOX',name:'Anti-Wrinkle — 1 Area',duration:30,price:140},
  {cat:'BOTOX',name:'Anti-Wrinkle — 2 Areas',duration:30,price:200},
  {cat:'BOTOX',name:'Anti-Wrinkle — 3 Areas',duration:45,price:230},
  {cat:'BOTOX',name:'Brow Lift',duration:30,price:150},
  {cat:'BOTOX',name:'Masseter Slimming Tox',duration:30,price:150},
  {cat:'BOTOX',name:'Nose Tip Lift Tox',duration:30,price:140},
  {cat:'BOTOX',name:'DAO Tox',duration:30,price:140},
  {cat:'BOTOX',name:'Dimple Chin Tox',duration:30,price:150},
  {cat:'BOTOX',name:'Nose Slimming Tox',duration:30,price:140},
  {cat:'BOTOX',name:'2 Week Review / Top-up',duration:15,price:10},
  // Dermal Filler
  {cat:'FILLER',name:'0.5ml Lip Filler',duration:30,price:100},
  {cat:'FILLER',name:'0.7ml Lip Filler',duration:30,price:110},
  {cat:'FILLER',name:'1ml Lip Filler',duration:45,price:130},
  {cat:'FILLER',name:'Lip Filler Dissolving',duration:30,price:95},
  {cat:'FILLER',name:'Lip Filler Dissolve & 1ml Refill',duration:60,price:190},
  {cat:'FILLER',name:'1ml Cheek Contour',duration:45,price:130},
  {cat:'FILLER',name:'Jaw Filler',duration:60,price:130},
  {cat:'FILLER',name:'Chin Augmentation',duration:45,price:110},
  {cat:'FILLER',name:'Non-Surgical Rhinoplasty',duration:45,price:130},
  {cat:'FILLER',name:'Pixie Tip Lift',duration:30,price:80},
  {cat:'FILLER',name:'Tear Trough Filler',duration:45,price:130},
  {cat:'FILLER',name:'Nasolabial Folds',duration:45,price:110},
  // Packages
  {cat:'BUNDLES',name:'Facial Slimming Package',duration:60,price:315},
  {cat:'BUNDLES',name:'Summer Glow Up',duration:60,price:320},
  {cat:'BUNDLES',name:'2ml Package',duration:60,price:220},
  {cat:'BUNDLES',name:'3ml Package',duration:75,price:295},
  {cat:'BUNDLES',name:'4ml Package',duration:90,price:395},
  {cat:'BUNDLES',name:'5ml Package',duration:105,price:495},
  // Skin Boosters
  {cat:'SKINBOOST',name:'Profhilo',duration:45,price:140},
  {cat:'SKINBOOST',name:'Profhilo x4',duration:45,price:450},
  {cat:'SKINBOOST',name:'Seventy Hyal Skin Booster',duration:45,price:120},
  {cat:'SKINBOOST',name:'Jalupro Skin Booster',duration:45,price:100},
  {cat:'SKINBOOST',name:'Lumi Eyes',duration:30,price:120},
  {cat:'SKINBOOST',name:'Polynucleotides (PDRN)',duration:45,price:120},
  // Medical Facials
  {cat:'FACIALS',name:'Dermaplaning',duration:45,price:30},
  {cat:'FACIALS',name:'Microneedling with Salmon DNA',duration:60,price:80},
  // Vitamin Injections
  {cat:'INJECTABLES',name:'B12 Injection',duration:15,price:25},
  // Consultation
  {cat:'CONSULT',name:'Consultation',duration:30,price:10},
];

const CAT_LABELS: Record<string, string> = {
  BOTOX:'Botox',FILLER:'Dermal Filler',FACIALS:'Facials',
  SKINBOOST:'Skin Boosters',FATDISSOLVE:'Fat Dissolving',
  INJECTABLES:'Injectables',
  BUNDLES:'Treatment Bundles',CONSULT:'Consultation',
};

const CAT_ORDER = ['BOTOX','FILLER','FACIALS','SKINBOOST','FATDISSOLVE','INJECTABLES','BUNDLES','CONSULT'];

const ALLOWED_KV_KEYS = new Set([
  'fbn_settings','fbn_custom_treats','fbn_custom_cats','fbn_cat_states',
  'fbn_treatment_overrides','fbn_video_labels','fbn_availability',
  'fbn_initialized','fbn_media','admin_password_override',
]);

function formatDuration(mins: number): string {
  if (typeof mins !== 'number' || mins <= 0) return '30 mins';
  if (mins >= 60) return mins === 60 ? '1 hr' : `${Math.floor(mins/60)} hr ${mins%60 ? mins%60 + ' mins' : ''}`.trim();
  return `${mins} mins`;
}

function buildTreatmentCategories(kvData: Record<string, any>) {
  const customTreats: any[] = Array.isArray(kvData['fbn_custom_treats']) ? kvData['fbn_custom_treats'] : [];
  const customCats: any[] = Array.isArray(kvData['fbn_custom_cats']) ? kvData['fbn_custom_cats'] : [];
  const overrides: Record<string, any> = (kvData['fbn_treatment_overrides'] && typeof kvData['fbn_treatment_overrides'] === 'object' && !Array.isArray(kvData['fbn_treatment_overrides'])) ? kvData['fbn_treatment_overrides'] : {};

  const validCustomTreats = customTreats.filter(t =>
    t && typeof t === 'object' && typeof t.name === 'string' && t.name.trim() &&
    typeof t.cat === 'string' && t.cat.trim()
  );

  const allTreats = [...BUILT_IN_TREATMENTS, ...validCustomTreats];

  const allCatLabels: Record<string, string> = { ...CAT_LABELS };
  for (const c of customCats) {
    if (c && typeof c.key === 'string' && typeof c.label === 'string') {
      allCatLabels[c.key] = c.label;
    }
  }

  const catOrder = [...CAT_ORDER];
  for (const c of customCats) {
    if (c && typeof c.key === 'string' && !catOrder.includes(c.key)) {
      catOrder.push(c.key);
    }
  }

  const grouped: Record<string, { name: string; price: string; duration: string }[]> = {};
  for (const t of allTreats) {
    const ov = overrides[t.name] || {};
    const price = Number(ov.price ?? t.price) || 0;
    const dur = Number(ov.duration ?? t.duration) || 30;
    if (!grouped[t.cat]) grouped[t.cat] = [];
    grouped[t.cat].push({
      name: String(t.name),
      price: `£${price}`,
      duration: formatDuration(dur),
      durationMins: dur,
    });
  }

  return catOrder
    .filter(k => grouped[k] && grouped[k].length > 0)
    .map(k => ({
      title: allCatLabels[k] || k,
      items: grouped[k],
    }));
}

let treatmentsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000;

router.get("/treatments", async (_req, res) => {
  try {
    if (treatmentsCache && Date.now() - treatmentsCache.timestamp < CACHE_TTL_MS) {
      res.setHeader("X-Cache", "HIT");
      return res.json(treatmentsCache.data);
    }

    const result = await pool.query(
      "SELECT key, value FROM portal_kv WHERE key = ANY($1)",
      [['fbn_custom_treats', 'fbn_custom_cats', 'fbn_treatment_overrides']],
    );
    const kvData: Record<string, any> = {};
    for (const row of result.rows) {
      kvData[row.key] = row.value;
    }

    const categories = buildTreatmentCategories(kvData);
    treatmentsCache = { data: categories, timestamp: Date.now() };
    res.setHeader("X-Cache", "MISS");
    return res.json(categories);
  } catch (err) {
    console.error("GET /api/treatments error", err);
    if (treatmentsCache) {
      res.setHeader("X-Cache", "STALE");
      return res.json(treatmentsCache.data);
    }
    const fallback = buildTreatmentCategories({});
    return res.json(fallback);
  }
});

router.get("/portal/store", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const raw = req.query["keys"];
  const keysStr = Array.isArray(raw) ? raw.join(",") : (raw as string || "");
  const keys = keysStr.split(",").filter(k => ALLOWED_KV_KEYS.has(k));
  if (!keys.length) return res.json({});
  try {
    const result = await pool.query(
      "SELECT key, value FROM portal_kv WHERE key = ANY($1)",
      [keys],
    );
    const out: Record<string, unknown> = {};
    for (const row of result.rows) {
      out[row.key] = row.value;
    }
    return res.json(out);
  } catch (err) {
    console.error("portal bulk GET error", err);
    return res.status(500).json({ error: "db error" });
  }
});

router.get("/portal/store/:key", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { key } = req.params;
  if (!ALLOWED_KV_KEYS.has(key)) {
    return res.status(400).json({ error: "invalid key" });
  }
  try {
    const result = await pool.query(
      "SELECT value FROM portal_kv WHERE key = $1",
      [key],
    );
    if (result.rows.length === 0) {
      return res.json({ value: null });
    }
    return res.json({ value: result.rows[0].value });
  } catch (err) {
    console.error("portal GET error", err);
    return res.status(500).json({ error: "db error" });
  }
});

router.put("/portal/store/:key", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { key } = req.params;
  if (!ALLOWED_KV_KEYS.has(key)) {
    return res.status(400).json({ error: "invalid key" });
  }
  const { value } = req.body;
  if (value === undefined) {
    return res.status(400).json({ error: "value required" });
  }
  try {
    await pool.query(
      `INSERT INTO portal_kv (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
      [key, JSON.stringify(value)],
    );
    if (key === 'fbn_custom_treats' || key === 'fbn_custom_cats' || key === 'fbn_treatment_overrides') {
      treatmentsCache = null;
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("portal PUT error", err);
    return res.status(500).json({ error: "db error" });
  }
});

export default router;
