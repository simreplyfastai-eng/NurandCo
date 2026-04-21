import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();

function getIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim();
  return req.ip ?? "unknown";
}

// GET /api/forms/status?booking=[id]
// Public — returns booking summary + whether forms have been submitted
router.get("/forms/status", async (req, res) => {
  const bookingId = req.query.booking as string | undefined;
  if (!bookingId) return res.status(400).json({ error: "booking id required" });
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(bookingId)) return res.status(404).json({ error: "Booking not found" });

  try {
    const [bkRow, medRow, conRow] = await Promise.all([
      supabaseAdmin.from("bookings").select("id,client_name,client_email,client_phone,treatment_id,treatments(name),booking_date,time_slot,status,location_id").eq("id", bookingId).maybeSingle(),
      supabaseAdmin.from("medical_forms").select("id,submitted_at").eq("booking_id", bookingId).maybeSingle(),
      supabaseAdmin.from("consent_forms").select("id,signed_at").eq("booking_id", bookingId).maybeSingle(),
    ]);

    if (bkRow.error) throw bkRow.error;
    if (!bkRow.data) return res.status(404).json({ error: "Booking not found" });

    // Check if this client's email already has a medical form on file (from ANY booking)
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
// Public — saves medical form linked to a booking
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
    const { data, error } = await supabaseAdmin.from("medical_forms").insert({
      booking_id: bookingId,
      client_email: clientEmail,
      client_name: clientName,
      dob: dob ?? null,
      address: address ?? null,
      gp_name: gpName ?? null,
      gp_practice: gpPractice ?? null,
      gp_phone: gpPhone ?? null,
      conditions: conditions ?? [],
      medications: medications ?? null,
      allergies: allergies ?? null,
      previous_treatments: previousTreatments ?? null,
      skin_concerns: skinConcerns ?? null,
      ip_address: getIp(req),
    }).select("id").single();

    if (error) throw error;
    return res.json({ id: data.id });
  } catch (err) {
    console.error("POST /api/forms/medical", err);
    return res.status(500).json({ error: "Failed to save medical form" });
  }
});

// POST /api/forms/consent
// Public — saves consent form + signature
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
    const { data, error } = await supabaseAdmin.from("consent_forms").insert({
      booking_id: bookingId,
      client_email: clientEmail,
      client_name: clientName,
      treatment: treatment ?? null,
      consents: consents ?? {},
      additional_notes: additionalNotes ?? null,
      signature_data: signatureData,
      ip_address: getIp(req),
    }).select("id").single();

    if (error) throw error;
    return res.json({ id: data.id });
  } catch (err) {
    console.error("POST /api/forms/consent", err);
    return res.status(500).json({ error: "Failed to save consent form" });
  }
});

// GET /api/admin/forms/:bookingId — auth required, full form data for admin drawer
router.get("/admin/forms/:bookingId", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { bookingId } = req.params;

  try {
    const [medRow, conRow] = await Promise.all([
      supabaseAdmin.from("medical_forms").select("*").eq("booking_id", bookingId).maybeSingle(),
      supabaseAdmin.from("consent_forms").select("*").eq("booking_id", bookingId).maybeSingle(),
    ]);

    return res.json({
      medical: medRow.data ?? null,
      consent: conRow.data ?? null,
    });
  } catch (err) {
    console.error("GET /api/admin/forms", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
