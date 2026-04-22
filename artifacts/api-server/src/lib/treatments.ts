import { supabaseAdmin } from "./supabase";

/** Fallback prices (£) for all built-in treatments — used when no DB override exists */
const TREATMENT_PRICES: Record<string, number> = {
  "Botox 1 Area": 100,
  "Botox 2 Areas": 140,
  "Botox 3 Areas": 180,
  "Botox 4 Areas": 210,
  "Masseter Botox": 200,
  "Nefertiti Lift Botox (Neck)": 220,
  "Chin Botox (Mentalis Muscle)": 80,
  "Nose Slimming Botox": 80,
  "Gummy Smile / Lip Flip Botox": 80,
  "Hyperhidrosis (Underarm) Botox": 220,
  "Botox Topup": 20,
  "0.5ml Lip Filler": 100,
  "0.7ml Lip Filler": 120,
  "1.1ml Lip Filler": 150,
  "1.1ml Nasal Labials": 150,
  "1.1ml Cheek Filler": 150,
  "1.5ml Cheek Filler": 200,
  "2.2ml Cheek Filler": 250,
  "1.1ml Chin Filler": 150,
  "2.2ml Jawline Filler": 250,
  "Liquid Rhinoplasty": 180,
  "Teartrough Filler": 180,
  "2.2ml Facial Contouring": 230,
  "3.3ml Facial Contouring": 330,
  "4.4ml Facial Contouring": 440,
  "Glass Skin Facial": 80,
  "Glass Skin Facial + Microneedling": 120,
  "1x Skin Booster": 150,
  "3x Lumi Pro Skin Booster": 350,
  "Plenhyage XL Strong": 200,
  "Plenhyage XL Strong 2 Treatments": 350,
  "Vitarin I - Eye Polynucleotide": 170,
  "Vitarin I - Eye Polynucleotide x2": 300,
  "B12 Injection": 30,
  "Lemon Bottle Small Area": 70,
  "Lemon Bottle Large Area": 100,
  "Hyaluronidase - Dissolving": 100,
  "Hayfever Relief": 80,
  "Botox 3 Areas + 1.1ml Dermal Filler": 320,
  "Botox 3 Areas + 1.1ml Lips + Lumi Pro": 450,
  "Botox 3 Areas + 1x Lumi Pro Skin Booster": 300,
  "Botox 3 Areas + 1x Plenhyage XL": 350,
  "Botox 3 Areas + Vitarin I Eye": 300,
  "Consultation": 0,
};

/**
 * Returns the price (£, whole number) for a treatment.
 * Checks Supabase portal_kv overrides (dd_treatment_overrides, dd_custom_treats) first,
 * then falls back to TREATMENT_PRICES.
 * Returns null if the treatment is completely unknown.
 */
export async function getTreatmentPrice(treatmentName: string, locationId?: string): Promise<number | null> {
  try {
    let query = supabaseAdmin
      .from("portal_kv")
      .select("key, value")
      .in("key", ["dd_treatment_overrides", "dd_custom_treats"]);
    if (locationId) {
      query = query.eq("location_id", locationId);
    }
    const { data } = await query;
    const kv: Record<string, unknown> = {};
    for (const row of (data ?? [])) kv[row.key as string] = row.value;

    const overrides = (kv["dd_treatment_overrides"] && typeof kv["dd_treatment_overrides"] === "object" && !Array.isArray(kv["dd_treatment_overrides"]))
      ? kv["dd_treatment_overrides"] as Record<string, { price?: number }>
      : {};
    if (overrides[treatmentName]?.price != null) {
      return Number(overrides[treatmentName].price);
    }

    const customs = Array.isArray(kv["dd_custom_treats"])
      ? kv["dd_custom_treats"] as Array<{ name?: string; price?: number }>
      : [];
    const custom = customs.find((t) => t.name === treatmentName);
    if (custom?.price != null) return Number(custom.price);
  } catch { /* fall through to hardcoded */ }

  return TREATMENT_PRICES[treatmentName] ?? null;
}

export const TREATMENT_DURATIONS: Record<string, number> = {
  "Botox 1 Area": 15,
  "Botox 2 Areas": 15,
  "Botox 3 Areas": 15,
  "Botox 4 Areas": 15,
  "Masseter Botox": 15,
  "Nefertiti Lift Botox (Neck)": 30,
  "Chin Botox (Mentalis Muscle)": 30,
  "Nose Slimming Botox": 30,
  "Gummy Smile / Lip Flip Botox": 30,
  "Hyperhidrosis (Underarm) Botox": 30,
  "Botox Topup": 15,
  "0.5ml Lip Filler": 30,
  "0.7ml Lip Filler": 45,
  "1.1ml Lip Filler": 45,
  "1.1ml Nasal Labials": 30,
  "1.1ml Cheek Filler": 30,
  "1.5ml Cheek Filler": 45,
  "2.2ml Cheek Filler": 45,
  "1.1ml Chin Filler": 45,
  "2.2ml Jawline Filler": 60,
  "Liquid Rhinoplasty": 45,
  "Teartrough Filler": 45,
  "2.2ml Facial Contouring": 45,
  "3.3ml Facial Contouring": 60,
  "4.4ml Facial Contouring": 60,
  "Glass Skin Facial": 60,
  "Glass Skin Facial + Microneedling": 60,
  "1x Skin Booster": 30,
  "3x Lumi Pro Skin Booster": 30,
  "Plenhyage XL Strong": 30,
  "Plenhyage XL Strong 2 Treatments": 30,
  "Vitarin I - Eye Polynucleotide": 30,
  "Vitarin I - Eye Polynucleotide x2": 30,
  "B12 Injection": 15,
  "Lemon Bottle Small Area": 30,
  "Lemon Bottle Large Area": 30,
  "Hyaluronidase - Dissolving": 30,
  "Hayfever Relief": 15,
  "Botox 3 Areas + 1.1ml Dermal Filler": 45,
  "Botox 3 Areas + 1.1ml Lips + Lumi Pro": 60,
  "Botox 3 Areas + 1x Lumi Pro Skin Booster": 45,
  "Botox 3 Areas + 1x Plenhyage XL": 45,
  "Botox 3 Areas + Vitarin I Eye": 45,
};

const TREATMENT_CATEGORIES: Record<string, string> = {
  "Botox 1 Area": "Botox",
  "Botox 2 Areas": "Botox",
  "Botox 3 Areas": "Botox",
  "Botox 4 Areas": "Botox",
  "Masseter Botox": "Botox",
  "Nefertiti Lift Botox (Neck)": "Botox",
  "Chin Botox (Mentalis Muscle)": "Botox",
  "Nose Slimming Botox": "Botox",
  "Gummy Smile / Lip Flip Botox": "Botox",
  "Hyperhidrosis (Underarm) Botox": "Botox",
  "Botox Topup": "Botox",
  "0.5ml Lip Filler": "Dermal Filler",
  "0.7ml Lip Filler": "Dermal Filler",
  "1.1ml Lip Filler": "Dermal Filler",
  "1.1ml Nasal Labials": "Dermal Filler",
  "1.1ml Cheek Filler": "Dermal Filler",
  "1.5ml Cheek Filler": "Dermal Filler",
  "2.2ml Cheek Filler": "Dermal Filler",
  "1.1ml Chin Filler": "Dermal Filler",
  "2.2ml Jawline Filler": "Dermal Filler",
  "Liquid Rhinoplasty": "Dermal Filler",
  "Teartrough Filler": "Dermal Filler",
  "2.2ml Facial Contouring": "Dermal Filler",
  "3.3ml Facial Contouring": "Dermal Filler",
  "4.4ml Facial Contouring": "Dermal Filler",
  "Glass Skin Facial": "Facials",
  "Glass Skin Facial + Microneedling": "Facials",
  "1x Skin Booster": "Skin Boosters",
  "3x Lumi Pro Skin Booster": "Skin Boosters",
  "Plenhyage XL Strong": "Skin Boosters",
  "Plenhyage XL Strong 2 Treatments": "Skin Boosters",
  "Vitarin I - Eye Polynucleotide": "Skin Boosters",
  "Vitarin I - Eye Polynucleotide x2": "Skin Boosters",
  "B12 Injection": "Skin Boosters",
  "Lemon Bottle Small Area": "Fat Dissolving",
  "Lemon Bottle Large Area": "Fat Dissolving",
  "Hyaluronidase - Dissolving": "Injectables",
  "Hayfever Relief": "Injectables",
  "Botox 3 Areas + 1.1ml Dermal Filler": "Treatment Bundles",
  "Botox 3 Areas + 1.1ml Lips + Lumi Pro": "Treatment Bundles",
  "Botox 3 Areas + 1x Lumi Pro Skin Booster": "Treatment Bundles",
  "Botox 3 Areas + 1x Plenhyage XL": "Treatment Bundles",
  "Botox 3 Areas + Vitarin I Eye": "Treatment Bundles",
};

export function getTreatmentDuration(treatmentName: string): number {
  return TREATMENT_DURATIONS[treatmentName] ?? 30;
}

export function getTreatmentCategory(treatmentName: string): string {
  return TREATMENT_CATEGORIES[treatmentName] ?? "";
}

// ── Deposit helpers ──────────────────────────────────────────────────────────

const INJECTABLE_KEYWORDS = [
  'filler', 'lips', 'rhinoplasty', 'jaw', 'cheek', 'smile line',
  'tear trough', 'polynucleotides', 'dissolve', 'hydration',
  'naturale', 'hd sculpt', 'contouring', 'consultation', 'refill',
];

export function isInjectableTreatment(treatmentName: string): boolean {
  const lower = treatmentName.toLowerCase();
  return INJECTABLE_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Returns the fixed deposit amount (£) for a treatment.
 * Injectables = depositInjectables (default £20), everything else = depositOther (default £10).
 */
export function getDepositAmount(
  treatmentName: string,
  settings: { depositInjectables?: number; depositOther?: number },
): number {
  // TEMP TEST OVERRIDE — revert after testing
  if (treatmentName === "Luxe Microneedling Facial") return 1;
  return isInjectableTreatment(treatmentName)
    ? (settings.depositInjectables ?? 20)
    : (settings.depositOther ?? 10);
}

/** Returns minutes since midnight for a "HH:MM" string */
export function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Returns "HH:MM" for a given number of minutes since midnight */
export function minsToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Given a list of booked slots (time + durationMinutes), compute all 15-minute
 * slot strings that are blocked (back-to-back allowed — no buffer).
 */
export function computeBlockedSlots(
  bookings: { time: string; durationMinutes: number }[],
): Set<string> {
  const blocked = new Set<string>();
  for (const { time, durationMinutes } of bookings) {
    if (!time) continue;
    const startMins = timeToMins(time);
    const blockedUntil = startMins + durationMinutes;
    for (let m = startMins; m < blockedUntil; m += 15) {
      blocked.add(minsToTime(m));
    }
  }
  return blocked;
}

/**
 * Check whether a proposed booking (time + duration) overlaps with any existing booking.
 * Back-to-back is allowed — no buffer between appointments.
 */
export function hasConflict(
  proposedTime: string,
  proposedDuration: number,
  existingBookings: { time: string; durationMinutes: number; status?: string }[],
): boolean {
  if (!proposedTime) return false;
  const proposedStart = timeToMins(proposedTime);
  const proposedEnd = proposedStart + proposedDuration;

  for (const b of existingBookings) {
    if (!b.time) continue;
    if (b.status === "Cancelled") continue;
    const existStart = timeToMins(b.time);
    const existEnd = existStart + (b.durationMinutes ?? 30);
    if (proposedStart < existEnd && proposedEnd > existStart) return true;
  }
  return false;
}
