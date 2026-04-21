import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();

function getIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim();
  return req.ip ?? "unknown";
}

// ── Helpers to unpack packed data ──────────────────────────────────────────

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

function expandConsent(row: Record<string, unknown>): Record<string, unknown> {
  // New format: individual consent_* columns
  if (row.consent_procedure !== undefined || row.consent_risks !== undefined) {
    const consents: Record<string, boolean> = {
      procedure: !!row.consent_procedure,
      risks: !!row.consent_risks,
      aftercare: !!row.consent_aftercare,
      no_guarantee: !!row.consent_no_guarantee,
      over_18: !!row.consent_over_18,
      medical_accurate: !!row.consent_medical_accurate,
    };
    return {
      ...row,
      treatment: row.treatment_name ?? null,
      consents,
      signed_at: row.created_at ?? null,
    };
  }
  // Legacy packed format: JSON|||base64img in signature_data
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

// ── GET /api/forms/check?booking=[id] — public ─────────────────────────────
router.get("/forms/check", async (req, res) => {
  const bookingId = req.query.booking as string | undefined;
  if (!bookingId) return res.status(400).json({ error: "booking id required" });
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(bookingId)) return res.status(404).json({ error: "Booking not found" });

  try {
    const { data: booking, error: bkErr } = await supabaseAdmin
      .from("bookings")
      .select("id, client_name, client_email, treatment_name, treatments(name), booking_date, time_slot, location_id, forms_completed")
      .eq("id", bookingId)
      .single();

    if (bkErr || !booking) return res.status(404).json({ error: "Booking not found" });

    // Resolve treatment name from the row or via the JOIN
    const treatJoin = booking.treatments as { name?: string } | null;
    const treatmentName: string =
      (booking.treatment_name as string | null) ?? treatJoin?.name ?? "your treatment";

    const [medRow, conRow] = await Promise.all([
      supabaseAdmin
        .from("medical_forms")
        .select("id")
        .eq("client_email", booking.client_email)
        .eq("location_id", booking.location_id)
        .maybeSingle(),
      supabaseAdmin
        .from("consent_forms")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle(),
    ]);

    // Normalise booking shape so the client can rely on `treatment` and `time`
    const normBooking = {
      ...booking,
      treatment: treatmentName,
      time: (booking.time_slot as string | null) ?? null,
    };

    return res.json({
      booking: normBooking,
      medical_on_file: !!medRow.data,
      consent_done: !!conRow.data,
    });
  } catch (err) {
    console.error("GET /api/forms/check", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/forms/status?booking=[id] — public (legacy) ───────────────────
router.get("/forms/status", async (req, res) => {
  const bookingId = req.query.booking as string | undefined;
  if (!bookingId) return res.status(400).json({ error: "booking id required" });
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(bookingId)) return res.status(404).json({ error: "Booking not found" });

  try {
    const [bkRow, medRow, conRow] = await Promise.all([
      supabaseAdmin.from("bookings").select("id,client_name,client_email,client_phone,treatment_name,treatment_id,treatments(name),booking_date,time_slot,status,location_id,forms_completed").eq("id", bookingId).maybeSingle(),
      supabaseAdmin.from("medical_forms").select("id,submitted_at").eq("booking_id", bookingId).maybeSingle(),
      supabaseAdmin.from("consent_forms").select("id").eq("booking_id", bookingId).maybeSingle(),
    ]);

    if (bkRow.error) throw bkRow.error;
    if (!bkRow.data) return res.status(404).json({ error: "Booking not found" });

    const emailMedRow = bkRow.data.client_email
      ? await supabaseAdmin.from("medical_forms").select("id,submitted_at").eq("client_email", bkRow.data.client_email).order("submitted_at", { ascending: false }).limit(1).maybeSingle()
      : { data: null };

    // Normalise booking shape: resolve treatment name and add convenience aliases
    const bkData = bkRow.data as Record<string, unknown>;
    const treatJoin = bkData.treatments as { name?: string } | null;
    const resolvedTreatment: string =
      (bkData.treatment_name as string | null) ?? treatJoin?.name ?? "";
    const normBooking = {
      ...bkData,
      treatment: resolvedTreatment,            // for confirmed.html
      time: (bkData.time_slot as string) ?? null, // alias
      date: (bkData.booking_date as string) ?? null, // alias
    };

    return res.json({
      booking: normBooking,
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

// ── POST /api/forms/medical ────────────────────────────────────────────────
router.post("/forms/medical", async (req, res) => {
  const {
    bookingId, dob, address,
    gpName, gpPractice, gpPhone, conditions,
    medications, allergies, previousTreatments, skinConcerns,
  } = req.body as Record<string, unknown>;

  if (!bookingId) {
    return res.status(400).json({ error: "bookingId is required" });
  }

  try {
    // Look up the full booking to get NOT NULL fields
    const { data: booking, error: bkErr } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bkErr || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const clientEmail = booking.client_email;
    const clientName = booking.client_name;
    const locationId = booking.location_id;

    // Check if a medical form already exists for this client + location
    const { data: existing } = await supabaseAdmin
      .from("medical_forms")
      .select("id")
      .eq("client_email", clientEmail)
      .eq("location_id", locationId)
      .maybeSingle();

    const formData: Record<string, unknown> = {
      client_email: clientEmail,
      client_name: clientName,
      location_id: locationId,
      booking_id: bookingId,
      address: address ?? null,
      gp_name: gpName ?? null,
      gp_practice: gpPractice ?? null,
      gp_phone: gpPhone ?? null,
      medications: medications ?? null,
      allergies: allergies ?? null,
      dob: dob ?? null,
      conditions: conditions ?? [],
      previous_treatments: previousTreatments ?? null,
      skin_concerns: skinConcerns ?? null,
      ip_address: getIp(req),
    };

    let resultId: string | null = null;

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("medical_forms")
        .update(formData)
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error) {
        console.error("Medical form update error:", error);
        return res.status(500).json({ error: "Failed to update medical form", details: error.message });
      }
      resultId = data.id;
    } else {
      const { data, error } = await supabaseAdmin
        .from("medical_forms")
        .insert(formData)
        .select("id")
        .single();
      if (error) {
        console.error("Medical form insert error:", error);
        return res.status(500).json({ error: "Failed to save medical form", details: error.message });
      }
      resultId = data.id;
    }

    // Update clients table with dob/address if provided
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

    return res.json({ id: resultId });
  } catch (err) {
    console.error("POST /api/forms/medical", err);
    return res.status(500).json({ error: "Failed to save medical form" });
  }
});

// ── POST /api/forms/consent ────────────────────────────────────────────────
router.post("/forms/consent", async (req, res) => {
  const {
    bookingId,
    consent_procedure,
    consent_risks,
    consent_aftercare,
    consent_no_guarantee,
    consent_over_18,
    consent_medical_accurate,
    signature_data,
    signature_name,
  } = req.body as Record<string, unknown>;

  if (!bookingId) {
    return res.status(400).json({ error: "bookingId is required" });
  }
  if (!signature_data) {
    return res.status(400).json({ error: "Signature is required" });
  }

  try {
    // Look up the full booking — join treatments so treatment_name is always populated
    const { data: booking, error: bkErr } = await supabaseAdmin
      .from("bookings")
      .select("*, treatments(name)")
      .eq("id", bookingId)
      .single();

    if (bkErr || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Resolve treatment name from the booking row or via the treatments join
    const treatRow = booking.treatments as { name?: string } | null;
    const resolvedTreatmentName: string =
      (booking.treatment_name as string | null) ??
      treatRow?.name ??
      "your treatment";

    const insertData: Record<string, unknown> = {
      location_id: booking.location_id,
      booking_id: bookingId,
      client_email: booking.client_email,
      client_name: booking.client_name,
      treatment_name: resolvedTreatmentName,
      treatment_date: booking.booking_date,
      consent_procedure: consent_procedure ?? false,
      consent_risks: consent_risks ?? false,
      consent_aftercare: consent_aftercare ?? false,
      consent_no_guarantee: consent_no_guarantee ?? false,
      consent_over_18: consent_over_18 ?? false,
      consent_medical_accurate: consent_medical_accurate ?? false,
      signature_data: signature_data ?? null,
      signature_name: signature_name ?? null,
      ip_address: getIp(req),
    };

    const { error } = await supabaseAdmin
      .from("consent_forms")
      .insert(insertData);

    if (error) {
      console.error("Consent form insert error:", error);
      return res.status(500).json({ error: "Failed to save consent form", details: error.message });
    }

    // Mark booking as forms completed and confirmed
    await supabaseAdmin
      .from("bookings")
      .update({ forms_completed: true, status: "confirmed" })
      .eq("id", bookingId);

    return res.json({ success: true });
  } catch (err) {
    console.error("POST /api/forms/consent", err);
    return res.status(500).json({ error: "Failed to save consent form" });
  }
});

// ── GET /api/admin/forms/:bookingId — auth required ────────────────────────
router.get("/admin/forms/:bookingId", async (req, res) => {
  if (!requireAuth(req, res)) return;
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
