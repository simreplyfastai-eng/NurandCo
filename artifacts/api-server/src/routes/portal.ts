import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

const BUILT_IN_TREATMENTS = [
  {cat:'BOTOX',name:'Botox 1 Area',duration:15,price:100},
  {cat:'BOTOX',name:'Botox 2 Areas',duration:15,price:140},
  {cat:'BOTOX',name:'Botox 3 Areas',duration:15,price:180},
  {cat:'BOTOX',name:'Botox 4 Areas',duration:15,price:210},
  {cat:'BOTOX',name:'Masseter Botox',duration:15,price:200},
  {cat:'BOTOX',name:'Nefertiti Lift Botox (Neck)',duration:30,price:220},
  {cat:'BOTOX',name:'Chin Botox (Mentalis Muscle)',duration:30,price:80},
  {cat:'BOTOX',name:'Nose Slimming Botox',duration:30,price:80},
  {cat:'BOTOX',name:'Gummy Smile / Lip Flip Botox',duration:30,price:80},
  {cat:'BOTOX',name:'Hyperhidrosis (Underarm) Botox',duration:30,price:220},
  {cat:'BOTOX',name:'Botox Topup',duration:15,price:20},
  {cat:'FILLER',name:'0.5ml Lip Filler',duration:30,price:100},
  {cat:'FILLER',name:'0.7ml Lip Filler',duration:45,price:120},
  {cat:'FILLER',name:'1.1ml Lip Filler',duration:45,price:150},
  {cat:'FILLER',name:'1.1ml Nasal Labials',duration:30,price:150},
  {cat:'FILLER',name:'1.1ml Cheek Filler',duration:30,price:150},
  {cat:'FILLER',name:'1.5ml Cheek Filler',duration:45,price:200},
  {cat:'FILLER',name:'2.2ml Cheek Filler',duration:45,price:250},
  {cat:'FILLER',name:'1.1ml Chin Filler',duration:45,price:150},
  {cat:'FILLER',name:'2.2ml Jawline Filler',duration:60,price:250},
  {cat:'FILLER',name:'Liquid Rhinoplasty',duration:45,price:180},
  {cat:'FILLER',name:'Teartrough Filler',duration:45,price:180},
  {cat:'FILLER',name:'2.2ml Facial Contouring',duration:45,price:230},
  {cat:'FILLER',name:'3.3ml Facial Contouring',duration:60,price:330},
  {cat:'FILLER',name:'4.4ml Facial Contouring',duration:60,price:440},
  {cat:'FACIALS',name:'Glass Skin Facial',duration:60,price:80},
  {cat:'FACIALS',name:'Glass Skin Facial + Microneedling',duration:60,price:120},
  {cat:'SKINBOOST',name:'1x Skin Booster',duration:30,price:150},
  {cat:'SKINBOOST',name:'3x Lumi Pro Skin Booster',duration:30,price:350},
  {cat:'SKINBOOST',name:'Plenhyage XL Strong',duration:30,price:200},
  {cat:'SKINBOOST',name:'Plenhyage XL Strong 2 Treatments',duration:30,price:350},
  {cat:'SKINBOOST',name:'Vitarin I - Eye Polynucleotide',duration:30,price:170},
  {cat:'SKINBOOST',name:'Vitarin I - Eye Polynucleotide x2',duration:30,price:300},
  {cat:'SKINBOOST',name:'B12 Injection',duration:15,price:30},
  {cat:'FATDISSOLVE',name:'Lemon Bottle Small Area',duration:30,price:70},
  {cat:'FATDISSOLVE',name:'Lemon Bottle Large Area',duration:30,price:100},
  {cat:'BUNDLES',name:'Botox 3 Areas + 1.1ml Dermal Filler',duration:45,price:320},
  {cat:'BUNDLES',name:'Botox 3 Areas + 1.1ml Lips + Lumi Pro',duration:60,price:450},
  {cat:'BUNDLES',name:'Botox 3 Areas + 1x Lumi Pro Skin Booster',duration:45,price:300},
  {cat:'BUNDLES',name:'Botox 3 Areas + 1x Plenhyage XL',duration:45,price:350},
  {cat:'BUNDLES',name:'Botox 3 Areas + Vitarin I Eye',duration:45,price:300},
  {cat:'CONSULT',name:'Consultation',duration:15,price:25},
];

const CAT_LABELS: Record<string, string> = {
  BOTOX:'Botox',FILLER:'Dermal Filler',FACIALS:'Facials',
  SKINBOOST:'Skin Boosters',FATDISSOLVE:'Fat Dissolving',
  BUNDLES:'Treatment Bundles',CONSULT:'Consultation',
};

const CAT_ORDER = ['BOTOX','FILLER','FACIALS','SKINBOOST','FATDISSOLVE','BUNDLES','CONSULT'];

const ALLOWED_KV_KEYS = new Set([
  'dd_settings','dd_custom_treats','dd_custom_cats','dd_cat_states',
  'dd_treatment_overrides','dd_video_labels','dd_availability',
  'dd_initialized','dd_media',
]);

function formatDuration(mins: number): string {
  if (typeof mins !== 'number' || mins <= 0) return '30 mins';
  if (mins >= 60) return mins === 60 ? '1 hr' : `${Math.floor(mins/60)} hr ${mins%60 ? mins%60 + ' mins' : ''}`.trim();
  return `${mins} mins`;
}

function buildTreatmentCategories(kvData: Record<string, any>) {
  const customTreats: any[] = Array.isArray(kvData['dd_custom_treats']) ? kvData['dd_custom_treats'] : [];
  const customCats: any[] = Array.isArray(kvData['dd_custom_cats']) ? kvData['dd_custom_cats'] : [];
  const overrides: Record<string, any> = (kvData['dd_treatment_overrides'] && typeof kvData['dd_treatment_overrides'] === 'object' && !Array.isArray(kvData['dd_treatment_overrides'])) ? kvData['dd_treatment_overrides'] : {};

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
      [['dd_custom_treats', 'dd_custom_cats', 'dd_treatment_overrides']],
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
    if (key === 'dd_custom_treats' || key === 'dd_custom_cats' || key === 'dd_treatment_overrides') {
      treatmentsCache = null;
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("portal PUT error", err);
    return res.status(500).json({ error: "db error" });
  }
});

export default router;
