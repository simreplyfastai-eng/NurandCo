import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();

function getIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim();
  return req.ip ?? "unknown";
}

// ── Column availability cache ──────────────────────────────────────────────
// On startup we probe which columns exist and cache the result.
// When columns are missing we fall back to packing extra data into existing
// text columns (medications for medical forms, signature_data for consent).
// Once the Supabase schema is patched the cache refreshes on next restart.
let medicalCols: Set<string> | null = null;
let consentCols: Set<string> | null = null;

async function getMedicalCols(): Promise<Set<string>> {
  if (medicalCols) return medicalCols;
  const candidates = [
    "id","booking_id","client_email","client_name","submitted_at",
    "address","gp_name","medications","allergies","ip_address","location_id",
    "dob","gp_practice","gp_phone","conditions","previous_treatments","skin_concerns",
  ];
  const present = new Set<string>();
  for (const col of candidates) {
    const { error } = await supabaseAdmin.from("medical_forms").select(col).limit(0);
    if (!error) present.add(col);
  }
  medicalCols = present;
  console.log("medical_forms columns present:", [...present].join(", "));
  return present;
}

async function getConsentCols(): Promise<Set<string>> {
  if (consentCols) return consentCols;
  const candidates = [
    "id","booking_id","client_email","client_name","signature_data","ip_address",
    "treatment","consents","additional_notes","signed_at",
  ];
  const present = new Set<string>();
  for (const col of candidates) {
    const { error } = await supabaseAdmin.from("consent_forms").select(col).limit(0);
    if (!error) present.add(col);
  }
  consentCols = present;
  console.log("consent_forms columns present:", [...present].join(", "));
  return present;
}

// Warm the column caches at startup
getMedicalCols().catch(() => {});
getConsentCols().catch(() => {});

// ── Helpers to unpack packed data ──────────────────────────────────────────

/** Expand a medical_forms row — unpack any extra data from the medications field */
function expandMedical(row: Record<string, unknown>): Record<string, unknown> {
  const meds = String(row.medications ?? "");
  if (meds.startsWith("{")) {
    try {
      const packed = JSON.parse(meds) as Record<string, unknown>;
      return {
        ...row,
        dob: row.dob ?? packed.dob ?? null,
        gp_practice: row.gp_practice ?? packed.gp_practice ?? null,
        gp_phone: row.gp_phone ?? packed.gp_phone ?? null,
        conditions: row.conditions ?? packed.conditions ?? [],
        previous_treatments: row.previous_treatments ?? packed.previous_treatments ?? null,
        skin_concerns: row.skin_concerns ?? packed.skin_concerns ?? null,
        medications: packed.medications ?? null,
      };
    } catch { /* fall through */ }
  }
  return row;
}

/** Expand a consent_forms row — unpack any extra data from the signature_data prefix */
function expandConsent(row: Record<string, unknown>): Record<string, unknown> {
  const sig = String(row.signature_data ?? "");
  if (sig.includes("|||")) {
    const idx = sig.indexOf("|||");
    const jsonPart = sig.slice(0, idx);
    const imgPart = sig.slice(idx + 3);
    try {
      const packed = JSON.parse(jsonPart) as Record<string, unknown>;
      return {
        ...row,
        treatment: row.treatment ?? packed.treatment ?? null,
        consents: row.consents ?? packed.consents ?? {},
        additional_notes: row.additional_notes ?? packed.additionalNotes ?? null,
        signed_at: row.signed_at ?? packed.signed_at ?? null,
        signature_data: imgPart,
      };
    } catch { /* fall through */ }
  }
  return row;
}

// GET /api/forms/status?booking=[id]
router.get("/forms/status", async (req, res) => {
  const bookingId = req.query.booking as string | undefined;
  if (!bookingId) return res.status(400).json({ error: "booking id required" });
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(bookingId)) return res.status(404).json({ error: "Booking not found" });

  try {
    const cols = await getConsentCols();
    const consentSelect = cols.has("signed_at") ? "id,signed_at" : "id";

    const [bkRow, medRow, conRow] = await Promise.all([
      supabaseAdmin.from("bookings").select("id,client_name,client_email,client_phone,treatment_id,treatments(name),booking_date,time_slot,status,location_id").eq("id", bookingId).maybeSingle(),
      supabaseAdmin.from("medical_forms").select("id,submitted_at").eq("booking_id", bookingId).maybeSingle(),
      supabaseAdmin.from("consent_forms").select(consentSelect).eq("booking_id", bookingId).maybeSingle(),
    ]);

    if (bkRow.error) throw bkRow.error;
    if (!bkRow.data) return res.status(404).json({ error: "Booking not found" });

    const emailMedRow = bkRow.data.client_email
      ? await supabaseAdmin.from("medical_forms").select("id,submitted_at").eq("client_email", bkRow.data.client_email).order("submitted_at", { ascending: false }).limit(1).maybeSingle()
      : { data: null };

    return res.json({
      booking: bkRow.data,
      hasMedical: !!medRow.data,
      hasConsent: !!conRow.data,
      medicalOnFileForEmail: !!emailMedRow.data,
      medicalFormId: medRow.data?.id ?? null,
      consentFormId: conRow.data?.id ?? null,
    });
  } catch (err) {
    console.error("GET /api/forms/status", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/forms/medical
router.post("/forms/medical", async (req, res) => {
  const {
    bookingId, clientEmail, clientName, dob, address,
    gpName, gpPractice, gpPhone, conditions,
    medications, allergies, previousTreatments, skinConcerns,
  } = req.body as Record<string, unknown>;

  if (!bookingId || !clientEmail || !clientName) {
    return res.status(400).json({ error: "bookingId, clientEmail and clientName are required" });
  }

  try {
    const cols = await getMedicalCols();

    // Resolve location_id from the booking (required NOT NULL column)
    let locationId: string | null = null;
    if (cols.has("location_id")) {
      const bk = await supabaseAdmin.from("bookings").select("location_id").eq("id", bookingId).maybeSingle();
      locationId = (bk.data as Record<string, unknown> | null)?.location_id as string ?? null;
    }

    // Base insert — always-present columns
    const insertData: Record<string, unknown> = {
      booking_id: bookingId,
      client_email: clientEmail,
      client_name: clientName,
      ip_address: getIp(req),
    };

    if (locationId !== null)        insertData.location_id = locationId;
    if (cols.has("address"))        insertData.address = address ?? null;
    if (cols.has("gp_name"))        insertData.gp_name = gpName ?? null;
    if (cols.has("medications"))    insertData.medications = medications ?? null;
    if (cols.has("allergies"))      insertData.allergies = allergies ?? null;

    // Extra columns — use proper columns if available, otherwise pack into medications
    const hasFull = cols.has("dob") && cols.has("conditions") && cols.has("gp_practice");

    if (hasFull) {
      insertData.dob = dob ?? null;
      insertData.gp_practice = gpPractice ?? null;
      insertData.gp_phone = gpPhone ?? null;
      insertData.conditions = conditions ?? [];
      insertData.previous_treatments = previousTreatments ?? null;
      insertData.skin_concerns = skinConcerns ?? null;
    } else {
      // Pack all extra data as JSON into the medications field
      const packed = JSON.stringify({
        medications: medications ?? null,
        dob: dob ?? null,
        gp_practice: gpPractice ?? null,
        gp_phone: gpPhone ?? null,
        conditions: conditions ?? [],
        previous_treatments: previousTreatments ?? null,
        skin_concerns: skinConcerns ?? null,
      });
      if (cols.has("medications")) insertData.medications = packed;
    }

    const { data, error } = await supabaseAdmin.from("medical_forms").insert(insertData).select("id").single();
    if (error) throw error;

    // Update the client record with date_of_birth and address if provided
    if (clientEmail && (dob || address)) {
      const clientUpdate: Record<string, unknown> = {};
      if (dob)     clientUpdate.date_of_birth = dob;
      if (address) clientUpdate.address = address;
      supabaseAdmin
        .from("clients")
        .update(clientUpdate)
        .eq("email", clientEmail)
        .then(() => {})
        .catch((e: unknown) => console.error("client dob/address update", e));
    }

    return res.json({ id: data.id });
  } catch (err) {
    console.error("POST /api/forms/medical", err);
    return res.status(500).json({ error: "Failed to save medical form" });
  }
});

// POST /api/forms/consent
router.post("/forms/consent", async (req, res) => {
  const {
    bookingId, clientEmail, clientName, treatment,
    consents, additionalNotes, signatureData,
  } = req.body as Record<string, unknown>;

  if (!bookingId || !clientEmail || !clientName) {
    return res.status(400).json({ error: "bookingId, clientEmail and clientName are required" });
  }
  if (!signatureData) {
    return res.status(400).json({ error: "Signature is required" });
  }

  try {
    const cols = await getConsentCols();

    const insertData: Record<string, unknown> = {
      booking_id: bookingId,
      client_email: clientEmail,
      client_name: clientName,
      ip_address: getIp(req),
    };

    const hasFull = cols.has("treatment") && cols.has("consents") && cols.has("signed_at");

    if (hasFull) {
      insertData.treatment = treatment ?? null;
      insertData.consents = consents ?? {};
      insertData.additional_notes = additionalNotes ?? null;
      insertData.signed_at = new Date().toISOString();
      insertData.signature_data = signatureData;
    } else {
      // Pack metadata into signature_data prefix: {JSON}|||{actual data URL}
      const metadata = JSON.stringify({
        treatment: treatment ?? null,
        consents: consents ?? {},
        additionalNotes: additionalNotes ?? null,
        signed_at: new Date().toISOString(),
      });
      insertData.signature_data = `${metadata}|||${signatureData}`;
    }

    const { data, error } = await supabaseAdmin.from("consent_forms").insert(insertData).select("id").single();
    if (error) throw error;

    // Mark booking as having all forms completed
    supabaseAdmin
      .from("bookings")
      .update({ forms_completed: true })
      .eq("id", bookingId)
      .then(() => {})
      .catch((e: unknown) => console.error("bookings forms_completed update", e));

    return res.json({ id: data.id });
  } catch (err) {
    console.error("POST /api/forms/consent", err);
    return res.status(500).json({ error: "Failed to save consent form" });
  }
});

// GET /api/admin/forms/:bookingId — auth required, full form data for admin drawer
router.get("/admin/forms/:bookingId", requireAuth, async (req, res) => {
  const { bookingId } = req.params;
  try {
    const [medRow, conRow] = await Promise.all([
      supabaseAdmin.from("medical_forms").select("*").eq("booking_id", bookingId).maybeSingle(),
      supabaseAdmin.from("consent_forms").select("*").eq("booking_id", bookingId).maybeSingle(),
    ]);
    return res.json({
      medical: medRow.data ? expandMedical(medRow.data as Record<string, unknown>) : null,
      consent: conRow.data ? expandConsent(conRow.data as Record<string, unknown>) : null,
    });
  } catch (err) {
    console.error("GET /api/admin/forms", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
