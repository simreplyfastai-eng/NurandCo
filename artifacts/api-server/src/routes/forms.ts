import { Router } from "express";
import { randomBytes } from "crypto";
import { requireAuth } from "../lib/auth";
import { supabaseAdmin } from "../lib/supabase";
import { sendFormsLinkEmail, sendFormsCompletedOwnerEmail } from "../lib/email";

const router = Router();

function getIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim();
  return req.ip ?? "unknown";
}

// ── Token validation ────────────────────────────────────────────────────────

interface TokenCheckResult {
  bookingId: string;
}

// Shared validation logic — checks token exists, not expired, not fully consumed.
async function checkToken(
  token: string | undefined,
  res: import("express").Response,
  allowResubmit = false
): Promise<TokenCheckResult | null> {
  if (!token || typeof token !== "string" || token.length < 32) {
    res.status(403).json({ error: "A valid form link is required. Please use the link emailed to you." });
    return null;
  }

  const { data: tokenRow, error: tokenErr } = await supabaseAdmin
    .from("form_tokens")
    .select("booking_id, expires_at, submitted_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenErr) {
    console.error("form_tokens lookup error:", tokenErr);
    if (String(tokenErr.message ?? "").includes("does not exist") || String(tokenErr.code ?? "") === "42P01") {
      res.status(503).json({ error: "Form submission is not fully configured yet. Please contact us directly." });
      return null;
    }
    res.status(500).json({ error: "Server error validating your form link." });
    return null;
  }

  if (!tokenRow) {
    res.status(403).json({ error: "Invalid or expired form link. Please contact us for a new link." });
    return null;
  }

  if (new Date(String(tokenRow.expires_at)) < new Date()) {
    res.status(403).json({ error: "Your form link has expired. Please contact us for a new one." });
    return null;
  }

  if (!allowResubmit && tokenRow.submitted_at) {
    res.status(403).json({ error: "This form link has already been used. Please contact us if you need to update your forms." });
    return null;
  }

  return { bookingId: String(tokenRow.booking_id) };
}

// Validate + mark token as fully consumed (called on final consent submit only)
async function validateAndConsumeToken(
  token: string | undefined,
  res: import("express").Response
): Promise<string | null> {
  const result = await checkToken(token, res, false);
  if (!result) return null;
  // Mark consumed immediately to prevent replay
  await supabaseAdmin
    .from("form_tokens")
    .update({ submitted_at: new Date().toISOString() })
    .eq("token", token);
  return result.bookingId;
}

// Validate without consuming (called on medical submit — client may save and continue to consent)
async function validateTokenOnly(
  token: string | undefined,
  res: import("express").Response
): Promise<string | null> {
  const result = await checkToken(token, res, true);
  return result ? result.bookingId : null;
}

// ── Helpers to unpack packed data ──────────────────────────────────────────

function expandMedical(row: Record<string, unknown>): Record<string, unknown> {
  // Normalise to consistent field names for the admin portal
  return {
    ...row,
    dob: row.date_of_birth ?? row.dob ?? null,
    gp_practice: row.gp_address ?? row.gp_practice ?? null,
    conditions: row.medical_conditions ?? row.conditions ?? [],
    previous_treatments: row.previous_aesthetics ?? row.previous_treatments ?? null,
    skin_concerns: row.skin_conditions ?? row.skin_concerns ?? null,
  };
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

// ── GET /api/forms/status?booking=[id]|token=[tok] ─────────────────────────
router.get("/forms/status", async (req, res) => {
  let bookingId = req.query.booking as string | undefined;
  const rawToken = req.query.token as string | undefined;

  // Resolve booking_id from token if provided (token takes priority)
  if (rawToken) {
    if (rawToken.length < 32) return res.status(403).json({ error: "Invalid token" });
    const { data: tokenRow, error: tokenErr } = await supabaseAdmin
      .from("form_tokens")
      .select("booking_id, expires_at, submitted_at")
      .eq("token", rawToken)
      .maybeSingle();
    if (!tokenErr && tokenRow && new Date(String(tokenRow.expires_at)) >= new Date()) {
      bookingId = String(tokenRow.booking_id);
    } else if (!bookingId) {
      return res.status(403).json({ error: "Invalid or expired form link." });
    }
  }

  if (!bookingId) return res.status(400).json({ error: "booking id required" });
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(bookingId)) return res.status(404).json({ error: "Booking not found" });

  try {
    // BULLETPROOF 1 — Server-side retry: Stripe webhook may fire after the client
    // redirects to this endpoint. Retry up to 5 times with a 1s gap before giving up.
    let bkRow: Awaited<ReturnType<typeof supabaseAdmin.from>> extends never ? never : { data: Record<string, unknown> | null; error: unknown } = { data: null, error: null };
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = await supabaseAdmin
        .from("bookings")
        .select("id,client_name,client_email,client_phone,treatment_name,treatment_id,treatments(name),booking_date,time_slot,status,location_id,forms_completed,deposit_amount,total_amount,deposit_paid")
        .eq("id", bookingId)
        .maybeSingle() as { data: Record<string, unknown> | null; error: unknown };
      if (result.error) throw result.error;
      if (result.data) { bkRow = result; break; }
      if (attempt < 4) await new Promise(r => setTimeout(r, 1000));
      else bkRow = result;
    }

    const [medRow, conRow] = await Promise.all([
      supabaseAdmin.from("medical_forms").select("id,submitted_at").eq("booking_id", bookingId).maybeSingle(),
      supabaseAdmin.from("consent_forms").select("id").eq("booking_id", bookingId).maybeSingle(),
    ]);

    if (!bkRow.data) {
      return res.status(404).json({
        error: "Booking is being processed, please refresh in a few seconds",
        retrying: true,
      });
    }

    const emailMedRow = bkRow.data.client_email
      ? await supabaseAdmin.from("medical_forms").select("id,submitted_at,created_at").eq("client_email", String(bkRow.data.client_email)).order("submitted_at", { ascending: false }).limit(1).maybeSingle()
      : { data: null };

    // 90-day rule: only skip medical form if last submission was within 90 days
    const rawMedDate = emailMedRow.data?.submitted_at ?? emailMedRow.data?.created_at ?? null;
    const medLastDate = rawMedDate ? new Date(String(rawMedDate)) : null;
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const medWithin90Days = medLastDate ? medLastDate > ninetyDaysAgo : false;

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
      medicalOnFileForEmail: !!emailMedRow.data && medWithin90Days,
      medicalLastSubmitted: medLastDate ? medLastDate.toISOString() : null,
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
    token, bookingId: legacyBookingId, dob, address,
    gpName, gpPractice, gpPhone, conditions,
    medications, allergies, previousTreatments, skinConcerns,
  } = req.body as Record<string, unknown>;

  // Token validation — prefer secure token; fall back to legacy booking ID with warning
  let bookingId: string | null = null;
  if (token) {
    bookingId = await validateTokenOnly(token as string, res);
    if (!bookingId) return;
  } else if (typeof legacyBookingId === "string" && legacyBookingId.length === 36) {
    console.warn(`[SECURITY] Medical form submitted without token — legacy booking link used: ${legacyBookingId}`);
    bookingId = legacyBookingId;
  } else {
    return res.status(403).json({ error: "A valid form link is required. Please use the link emailed to you." });
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

    const gpAddress = [gpPractice, gpPhone].filter(Boolean).join(" | ") || null;
    const formData: Record<string, unknown> = {
      client_email: clientEmail,
      client_name: clientName,
      location_id: locationId,
      booking_id: bookingId,
      date_of_birth: dob ?? null,
      address: address ?? null,
      gp_name: gpName ?? null,
      gp_address: gpAddress,
      medications: medications ?? null,
      allergies: allergies ?? null,
      medical_conditions: Array.isArray(conditions) ? (conditions as string[]).join(", ") : (conditions ?? null),
      previous_aesthetics: previousTreatments ?? null,
      skin_conditions: skinConcerns ?? null,
      submitted_at: new Date().toISOString(),
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
        return res.status(500).json({ error: "Failed to update medical form" });
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
        return res.status(500).json({ error: "Failed to save medical form" });
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
    token, bookingId: legacyBookingId,
    consent_procedure,
    consent_risks,
    consent_aftercare,
    consent_no_guarantee,
    consent_over_18,
    consent_medical_accurate,
    signature_data,
    signature_name,
  } = req.body as Record<string, unknown>;

  if (!signature_data) {
    return res.status(400).json({ error: "Signature is required" });
  }

  // Token validation — prefer secure token; fall back to legacy booking ID with warning
  let bookingId: string | null = null;
  if (token) {
    bookingId = await validateAndConsumeToken(token as string, res);
    if (!bookingId) return;
  } else if (typeof legacyBookingId === "string" && legacyBookingId.length === 36) {
    console.warn(`[SECURITY] Consent form submitted without token — legacy booking link used: ${legacyBookingId}`);
    bookingId = legacyBookingId;
  } else {
    return res.status(403).json({ error: "A valid form link is required. Please use the link emailed to you." });
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
      return res.status(500).json({ error: "Failed to save consent form" });
    }

    // Mark booking as forms completed and confirmed
    await supabaseAdmin
      .from("bookings")
      .update({ forms_completed: true, status: "confirmed" })
      .eq("id", bookingId);

    // Send client confirmation email now that forms + consent are complete
    if (booking.client_email) {
      try {
        // Fetch location info for the email
        const locRes = await supabaseAdmin
          .from("locations")
          .select("name, address")
          .eq("id", booking.location_id)
          .maybeSingle();
        const locName = String(locRes.data?.name ?? "StarrBeauty");
        const locAddr = String(locRes.data?.address ?? locName);

        // Fetch treatment duration + price
        let durationMins = 60;
        let totalPrice = 0;
        let depositAmt = Number(booking.deposit_amount ?? 0);
        if (booking.treatment_id) {
          const txRes = await supabaseAdmin
            .from("treatments")
            .select("duration_minutes, price")
            .eq("id", booking.treatment_id)
            .maybeSingle();
          durationMins = Number(txRes.data?.duration_minutes ?? 60);
          totalPrice = Number(txRes.data?.price ?? 0);
        }

        const { sendClientConfirmationEmail } = await import("../lib/email");
        await sendClientConfirmationEmail({
          clientEmail: String(booking.client_email),
          clientName: String(booking.client_name ?? ""),
          treatment: resolvedTreatmentName,
          date: String(booking.booking_date ?? ""),
          time: String(booking.time_slot ?? ""),
          durationMinutes: durationMins,
          deposit: depositAmt,
          balance: Math.max(0, totalPrice - depositAmt),
          bookingId: String(bookingId),
          depositPaid: true,
          whatsapp: "447701298985",
          locationName: locName,
          locationAddress: locAddr,
        });
      } catch (emailErr) {
        console.error("POST /api/forms/consent — confirmation email error", emailErr);
      }
    }

    // Notify owner that forms are complete
    const ownerEmail = process.env.ADMIN_EMAIL || "starrbeautyyltd@gmail.com";
    sendFormsCompletedOwnerEmail({
      ownerEmail,
      clientName: String(booking.client_name ?? "Client"),
      clientEmail: String(booking.client_email ?? ""),
      treatment: resolvedTreatmentName,
      date: String(booking.booking_date ?? ""),
      time: String(booking.time_slot ?? ""),
      bookingId: String(bookingId),
    }).catch((err) => console.error("sendFormsCompletedOwnerEmail error (non-fatal):", err));

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

// ── GET /api/admin/webhook-events — auth required ──────────────────────────
// Returns last 20 payments as a proxy for webhook events (each payment = webhook fired).
router.get("/admin/webhook-events", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = (req.headers["x-location-id"] as string | undefined) ?? null;
  try {
    let query = supabaseAdmin
      .from("payments")
      .select("id, booking_id, client_email, amount, type, stripe_payment_intent_id, location_id, created_at, bookings(client_name, treatment_name, booking_date, time_slot, status)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (locationId) query = query.eq("location_id", locationId);

    const { data, error } = await query;
    if (error) throw error;

    const events = (data ?? []).map((p: Record<string, unknown>) => {
      const bk = p.bookings as Record<string, unknown> | null;
      return {
        id: p.id,
        bookingId: p.booking_id,
        timestamp: p.created_at,
        eventType: "payment_intent.succeeded",
        paymentIntentId: p.stripe_payment_intent_id,
        clientName: bk?.client_name ?? p.client_email ?? "—",
        clientEmail: p.client_email,
        treatment: bk?.treatment_name ?? "—",
        date: bk?.booking_date ?? "—",
        time: bk?.time_slot ?? "—",
        amount: p.amount,
        status: bk?.status ?? "—",
        outcome: "success",
      };
    });

    return res.json({ events });
  } catch (err) {
    console.error("GET /api/admin/webhook-events", err);
    return res.status(500).json({ error: "Server error", events: [] });
  }
});

// ── POST /api/admin/bookings/:id/send-forms — auth required ────────────────
// Manually send the forms link email to the client for a specific booking.
// Used by the admin portal "Send Forms Link" button.
router.post("/admin/bookings/:id/send-forms", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { id: bookingId } = req.params;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(bookingId)) return res.status(400).json({ error: "Invalid booking id" });

  try {
    const { data: bk, error: bkErr } = await supabaseAdmin
      .from("bookings")
      .select("id, client_name, client_email, treatment_name, booking_date, time_slot, location_id, forms_completed")
      .eq("id", bookingId)
      .single();

    if (bkErr || !bk) return res.status(404).json({ error: "Booking not found" });
    if (!bk.client_email) return res.status(400).json({ error: "Booking has no client email" });

    // Resolve location name
    let locationName: string | undefined;
    if (bk.location_id) {
      const { data: loc } = await supabaseAdmin
        .from("locations")
        .select("name")
        .eq("id", bk.location_id)
        .maybeSingle();
      locationName = loc?.name as string | undefined;
    }

    // Generate a secure 32-byte hex token with 14-day expiry
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { error: tokenInsertErr } = await supabaseAdmin
      .from("form_tokens")
      .insert({ token, booking_id: bookingId, expires_at: expiresAt });

    if (tokenInsertErr) {
      // If form_tokens table doesn't exist yet, fall back to booking-id link with a warning
      if (String(tokenInsertErr.message ?? "").includes("does not exist") || String(tokenInsertErr.code ?? "") === "42P01") {
        console.warn("form_tokens table not found — sending legacy booking-id link. Run the form_tokens SQL migration in Supabase.");
        await sendFormsLinkEmail({
          clientEmail: String(bk.client_email),
          clientName: String(bk.client_name ?? ""),
          treatment: String(bk.treatment_name ?? "your treatment"),
          date: String(bk.booking_date ?? ""),
          time: String(bk.time_slot ?? ""),
          bookingId,
          locationName,
        });
        return res.json({ success: true, email: bk.client_email, warning: "form_tokens table missing — token not generated" });
      }
      throw tokenInsertErr;
    }

    await sendFormsLinkEmail({
      clientEmail: String(bk.client_email),
      clientName: String(bk.client_name ?? ""),
      treatment: String(bk.treatment_name ?? "your treatment"),
      date: String(bk.booking_date ?? ""),
      time: String(bk.time_slot ?? ""),
      bookingId,
      token,
      locationName,
    });

    console.log(`Forms link email sent for booking ${bookingId} to ${bk.client_email} (token: ${token.slice(0, 8)}...)`);
    return res.json({ success: true, email: bk.client_email });
  } catch (err) {
    console.error("POST /api/admin/bookings/:id/send-forms", err);
    return res.status(500).json({ error: "Failed to send forms email" });
  }
});

export default router;
