import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuth } from "../lib/auth";

const router = Router();

// Default content per slug — used when no portal_kv override exists
const DEFAULTS: Record<string, any> = {
  "signature-lip-filler": {
    eyebrow: "01 / The Lips",
    heroTitle: "Signature\nLip Filler",
    heroSubtitle: "Considered volume and definition that honours the natural architecture of your lips.",
    heroMediaType: "image",
    heroMediaUrl: "",
    philosophy: "Filler should never announce itself. It should look as though it has always been there — quiet, balanced, and unmistakably yours.",
    process: [
      { title: "Consultation", description: "We discuss your wishes, your face shape and the result you want — honestly. Not every lip needs filler, and we'll tell you if yours doesn't." },
      { title: "Treatment", description: "Numbing cream first, then precise placement using fine cannula or needle. Most appointments take 30–45 minutes. We work to your goal, never to a trend." },
      { title: "Aftercare", description: "Swelling settles within 24–48 hours. We send aftercare via email and check in at 2 weeks. Reviews and adjustments are included where needed." }
    ],
    included: [
      "Pre-treatment consultation",
      "Premium-grade hyaluronic acid filler (Juvéderm / Restylane)",
      "Comprehensive aftercare guidance",
      "2-week review appointment included"
    ],
    beforeAfterImages: [],
    faq: [
      { q: "How long does it last?", a: "Typically 9–12 months depending on the product, the area treated and your metabolism. Top-ups are scheduled around 9 months for most clients." },
      { q: "Will it look obvious?", a: "Not when done well. We work in small increments and prioritise shape over volume. Most clients have 0.5–1ml in their first appointment, never more." },
      { q: "Is there downtime?", a: "Plan for some swelling and possible bruising for 24–72 hours. Most return to work the same day. Avoid alcohol, exercise and heat for 24 hours after." },
      { q: "Can it be reversed?", a: "Yes. Hyaluronic acid filler can be dissolved with hyaluronidase if you ever want it removed. We perform reversals if needed." },
      { q: "How is Nur & Co different?", a: "We're prescriber-led, not nurse-led. Every treatment is reviewed by our prescribing pharmacist and we follow CQC-aligned standards. Honest advice — even when that means saying no." }
    ]
  }
};

// Empty defaults shape for any slug not yet defined
const EMPTY_DEFAULT = {
  eyebrow: "",
  heroTitle: "",
  heroSubtitle: "",
  heroMediaType: "image",
  heroMediaUrl: "",
  philosophy: "",
  process: [],
  included: [],
  beforeAfterImages: [],
  faq: []
};

async function resolveLocationId(raw: string | undefined): Promise<string | null> {
  if (!raw) return null;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID_RE.test(raw)) return raw;
  const { data } = await supabaseAdmin.from("locations").select("id").eq("slug", raw).maybeSingle();
  return data?.id ? String(data.id) : null;
}

// GET /api/treatment-page/:slug — public
router.get("/treatment-page/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const defaults = DEFAULTS[slug] ?? EMPTY_DEFAULT;
    const rawLoc = (req.query.locationId as string | undefined) ?? (req.headers["x-location-id"] as string | undefined);
    let locationId = await resolveLocationId(rawLoc);
    if (!locationId) {
      const { data: first } = await supabaseAdmin.from("locations").select("id").order("name").limit(1).maybeSingle();
      locationId = first?.id ? String(first.id) : null;
    }
    if (!locationId) return res.json(defaults);
    const { data: kvRow } = await supabaseAdmin
      .from("portal_kv")
      .select("value")
      .eq("location_id", locationId)
      .eq("key", `treatment_page:${slug}`)
      .maybeSingle();
    const stored = (kvRow?.value as Record<string, unknown>) ?? {};
    return res.json({ ...defaults, ...stored });
  } catch (err) {
    console.error("GET /api/treatment-page", err);
    return res.json(EMPTY_DEFAULT);
  }
});

// POST /api/treatment-page/:slug — admin
router.post("/treatment-page/:slug", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const slug = req.params.slug;
    const locationId = (req.headers["x-location-id"] as string | undefined) ?? null;
    if (!locationId) return res.status(400).json({ error: "X-Location-Id header required" });
    const newValue = req.body as Record<string, unknown>;
    const key = `treatment_page:${slug}`;
    const { data: kvRow } = await supabaseAdmin
      .from("portal_kv")
      .select("id, value")
      .eq("location_id", locationId)
      .eq("key", key)
      .maybeSingle();
    const currentValue = (kvRow?.value as Record<string, unknown>) ?? {};
    const updated = { ...currentValue, ...newValue };
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
        .insert({ location_id: locationId, key, value: updated, updated_at: now });
      writeError = error;
    }
    if (writeError) return res.status(500).json({ error: "Failed to save treatment page" });
    return res.json({ success: true, value: updated });
  } catch (err) {
    console.error("POST /api/treatment-page", err);
    return res.status(500).json({ error: "Failed to save treatment page" });
  }
});

export default router;
