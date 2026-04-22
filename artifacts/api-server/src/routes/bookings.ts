import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { findOrCreateClient } from "./clients";
import {
  sendCancellationEmail,
  sendRescheduleEmail,
  sendAdminNotificationEmail,
  sendClientConfirmationEmail,
  sendConsultationConfirmationEmail,
  sendConsultationAdminEmail,
} from "../lib/email";
import { requireAuth } from "../lib/auth";
import { ukDateStr, ukDayOfWeek } from "../lib/tz";
import { sanitize } from "../lib/sanitize";

const router = Router();

// ─── helpers ────────────────────────────────────────────────────────────────

function getLocationId(req: import("express").Request): string | null {
  return (
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined) ??
    null
  );
}

function supabaseRowToBooking(row: Record<string, unknown>) {
  const treatment = (row.treatments as Record<string, unknown> | null) ?? null;
  const createdRaw = row.created_at;
  const createdAt =
    typeof createdRaw === "number"
      ? createdRaw
      : createdRaw
      ? new Date(String(createdRaw)).getTime()
      : Date.now();

  // DB stores lowercase statuses; capitalise for UI
  const rawStatus = String(row.status ?? "pending");
  const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  return {
    id: String(row.id ?? ""),
    clientId: row.client_id ?? null,
    clientName: row.client_name ?? "",
    clientEmail: row.client_email ?? "",
    clientPhone: row.client_phone ?? "",
    clientDOB: "",
    clientNotes: "",
    treatment: ((treatment?.name ?? row.treatment_name ?? "Not specified") as string),
    category: (row.category ?? "") as string,
    price: Number(row.total_amount ?? row.price ?? 0),
    deposit: Number(row.deposit_amount ?? row.deposit ?? 0),
    depositPaid: Boolean(row.deposit_paid),
    balancePaid: false,
    date: (row.booking_date ?? row.date ?? "") as string,
    time: (row.time_slot ?? row.time ?? "") as string,
    status,
    paymentMethod: (row.payment_method ?? "Stripe") as string,
    stripePaymentId: (row.stripe_payment_intent_id ?? null) as string | null,
    notes: (row.notes ?? "") as string,
    createdAt,
    source: "Website",
    durationMinutes: Number(treatment?.duration_minutes ?? 30),
    reminderSent: Boolean(row.reminder_sent),
    locationId: row.location_id as string | undefined,
  };
}

/** Look up treatment UUID from name + locationId */
async function getTreatmentId(name: string, locationId: string): Promise<string | null> {
  if (!name || !locationId) return null;
  try {
    const { data } = await supabaseAdmin
      .from("treatments")
      .select("id, duration_minutes")
      .eq("location_id", locationId)
      .eq("name", name)
      .single();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

async function getTreatmentInfo(
  name: string,
  locationId: string,
): Promise<{ id: string | null; durationMinutes: number; depositAmount: number; price: number }> {
  try {
    const { data } = await supabaseAdmin
      .from("treatments")
      .select("id, duration_minutes, price, deposit_amount")
      .eq("location_id", locationId)
      .eq("name", name)
      .single();
    if (data) {
      return {
        id: data.id,
        durationMinutes: Number(data.duration_minutes ?? 30),
        depositAmount: Number(data.deposit_amount ?? 0),
        price: Number(data.price ?? 0),
      };
    }
  } catch { /* fall through */ }
  return { id: null, durationMinutes: 30, depositAmount: 0, price: 0 };
}

async function isDateBlocked(locationId: string, date: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from("blocked_dates")
      .select("id")
      .eq("location_id", locationId)
      .eq("date", date)
      .limit(1);
    return !!(data && data.length > 0);
  } catch { return false; }
}

async function isLocationOpen(locationId: string, date: string): Promise<boolean> {
  try {
    const dayIndex = ukDayOfWeek(date);
    const { data } = await supabaseAdmin
      .from("availability_settings")
      .select("is_open")
      .eq("location_id", locationId)
      .eq("day_of_week", dayIndex)
      .maybeSingle();
    return !!(data?.is_open);
  } catch { return true; } // fail open — don't block bookings on DB error
}

async function isSlotAvailable(locationId: string, date: string, time: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("location_id", locationId)
      .eq("booking_date", date)
      .eq("time_slot", time)
      .not("status", "eq", "cancelled")
      .limit(1);
    return !data || data.length === 0;
  } catch { return true; } // fail open
}

async function runAvailabilityChecks(
  locationId: string,
  date: string,
  time: string,
): Promise<{ ok: boolean; error?: string; code?: string; status?: number }> {
  if (await isDateBlocked(locationId, date)) {
    return { ok: false, error: "This date is not available.", code: "DATE_BLOCKED", status: 409 };
  }
  if (!(await isLocationOpen(locationId, date))) {
    return { ok: false, error: "The clinic is closed on this day.", code: "CLINIC_CLOSED", status: 409 };
  }
  if (!(await isSlotAvailable(locationId, date, time))) {
    return { ok: false, error: "Sorry, this slot has just been taken.", code: "SLOT_TAKEN", status: 409 };
  }
  return { ok: true };
}

async function getWhatsApp(locationId?: string | null): Promise<string> {
  if (locationId) {
    try {
      const { data } = await supabaseAdmin
        .from("locations")
        .select("whatsapp")
        .eq("id", locationId)
        .single();
      if (data?.whatsapp) return String(data.whatsapp);
    } catch { /* fall through */ }
  }
  return process.env.WHATSAPP ?? "";
}

async function getLocationInfo(locationId: string): Promise<{ name: string; address: string } | null> {
  try {
    const { data } = await supabaseAdmin
      .from("locations")
      .select("name, address")
      .eq("id", locationId)
      .single();
    return data ? { name: String(data.name ?? ""), address: String(data.address ?? "") } : null;
  } catch {
    return null;
  }
}

/** Auto-complete: mark confirmed bookings whose appointment time has passed */
export async function runAutoComplete(): Promise<number> {
  try {
    const { data } = await supabaseAdmin
      .from("bookings")
      .select("id, booking_date, time_slot, treatments(duration_minutes)")
      .eq("status", "confirmed");

    if (!data?.length) return 0;

    const now = Date.now();
    const toComplete: string[] = [];

    for (const row of data) {
      const bookingDate = String(row.booking_date ?? "");
      const timeSlot = String(row.time_slot ?? "00:00");
      if (!bookingDate) continue;

      const treatment = row.treatments as Record<string, unknown> | null;
      const durationMins = Number(treatment?.duration_minutes ?? row.duration_minutes ?? 30);

      const [y, m, d] = bookingDate.split("-").map(Number);
      const [h, min] = timeSlot.split(":").map(Number);
      const apptMs = Date.UTC(y, m - 1, d, h, min) + durationMins * 60_000 + 15 * 60_000;

      if (now > apptMs) toComplete.push(String(row.id));
    }

    if (!toComplete.length) return 0;

    await supabaseAdmin
      .from("bookings")
      .update({ status: "completed" })
      .in("id", toComplete);

    return toComplete.length;
  } catch (err) {
    console.error("runAutoComplete error", err);
    return 0;
  }
}

export async function cleanupGhostBookings(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .delete()
      .in("status", ["pending", "awaiting_payment"])
      .lt("created_at", cutoff)
      .select("id");
    if (error) throw error;
    return data?.length ?? 0;
  } catch (err) {
    console.error("cleanupGhostBookings error", err);
    return 0;
  }
}

// ─── routes ─────────────────────────────────────────────────────────────────

// GET /api/bookings — all bookings for a location — admin only
router.get("/bookings", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "X-Location-Id header required" });

  await runAutoComplete();
  const { month, limit } = req.query as Record<string, string>;

  try {
    let query = supabaseAdmin
      .from("bookings")
      .select("*, treatments(name, duration_minutes)")
      .eq("location_id", locationId);

    if (month) query = query.like("booking_date", `${month}-%`);
    query = query.order("created_at", { ascending: false });
    if (limit) query = query.limit(Number(limit));

    const { data, error } = await query;
    if (error) throw error;
    const rows = data ?? [];
    if (!rows.length) return res.json([]);

    // Batch-fetch form status for all bookings in this response
    const ids = rows.map((r) => String(r.id));
    const [medRes, conRes] = await Promise.all([
      supabaseAdmin.from("medical_forms").select("booking_id").in("booking_id", ids),
      supabaseAdmin.from("consent_forms").select("booking_id").in("booking_id", ids),
    ]);
    const medSet = new Set((medRes.data ?? []).map((r) => String(r.booking_id)));
    const conSet = new Set((conRes.data ?? []).map((r) => String(r.booking_id)));

    return res.json(
      rows.map((r) => ({
        ...supabaseRowToBooking(r as Record<string, unknown>),
        hasMedical: medSet.has(String(r.id)),
        hasConsent: conSet.has(String(r.id)),
      })),
    );
  } catch (err) {
    console.error("GET /api/bookings", err);
    return res.status(500).json({ error: "db error" });
  }
});

// GET /api/bookings/date/:date — active bookings for a date (for slot checking)
router.get("/bookings/date/:date", async (req, res) => {
  const locationId = getLocationId(req);
  try {
    let query = supabaseAdmin
      .from("bookings")
      .select("id, time_slot, status, treatments(name, duration_minutes)")
      .eq("booking_date", req.params.date)
      .neq("status", "cancelled")
      .order("time_slot", { ascending: true });

    if (locationId) query = query.eq("location_id", locationId);

    const { data, error } = await query;
    if (error) throw error;
    return res.json(
      (data ?? []).map((r) => {
        const t = r.treatments as Record<string, unknown> | null;
        return {
          id: r.id,
          time: r.time_slot ?? "",
          durationMinutes: Number(t?.duration_minutes ?? 30),
          status: r.status ?? "pending",
          treatment: (t?.name ?? "") as string,
        };
      }),
    );
  } catch (err) {
    console.error("GET /api/bookings/date/:date", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/bookings
router.post("/bookings", async (req, res) => {
  const b = req.body;
  const locationId = getLocationId(req) ?? b.locationId ?? null;

  const name = sanitize(b.clientName) ?? "";
  const email = (b.clientEmail ?? "").trim().toLowerCase();
  const phone = sanitize(b.clientPhone) ?? "";
  const notes = sanitize(b.notes) ?? "";
  const { date, time, treatment } = b;

  if (!name || name.length < 2) return res.status(400).json({ error: "Please enter your name." });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Please enter a valid email address." });
  if (!phone || phone.replace(/\s/g, "").length < 7)
    return res.status(400).json({ error: "Please enter your phone number." });
  if (!date || !time || !treatment)
    return res.status(400).json({ error: "Missing required booking fields." });

  if (b.source !== "Portal") {
    const todayUK = ukDateStr();
    if (date < todayUK) return res.status(400).json({ error: "Cannot book a date in the past." });
  }

  try {
    let treatInfo = { id: null as string | null, durationMinutes: 30, depositAmount: 0, price: 0 };
    if (locationId) {
      treatInfo = await getTreatmentInfo(treatment, locationId);
    }

    const durationMinutes = treatInfo.durationMinutes;
    const price = b.price !== undefined ? Number(b.price) : treatInfo.price;
    const deposit = b.deposit !== undefined ? Number(b.deposit) : treatInfo.depositAmount;
    const balance = price - deposit;

    const depositPaid = b.stripePaymentId && b.depositPaid
      ? true
      : b.source === "Website"
      ? false
      : (b.depositPaid ?? false);

    const isConsultation =
      treatment === "In-Person Consultation" ||
      treatment === "Virtual Consultation" ||
      treatment === "Consultation";

    if (locationId && b.source !== "Portal") {
      // Run all three checks in spec order: date blocked → clinic closed → slot taken
      const avail = await runAvailabilityChecks(locationId, date, time ?? "");
      if (!avail.ok) {
        return res.status(avail.status ?? 409).json({ error: avail.error, code: avail.code });
      }
    }

    const clientId = await findOrCreateClient({
      locationId: locationId ?? "",
      name,
      email,
      phone,
      source: b.source ?? "Website",
      dob: b.clientDOB ?? "",
      notes: isConsultation ? (sanitize(b.clientNotes) ?? "") : "",
      // no updateStats — payment not yet confirmed at this point
    }).catch(() => null);

    // Check if webhook already confirmed this booking
    const alreadyConfirmed = !!(
      b.stripePaymentId &&
      b.id &&
      (
        await supabaseAdmin
          .from("bookings")
          .select("id")
          .eq("id", b.id)
          .eq("status", "confirmed")
          .maybeSingle()
      ).data
    );

    const bookingId = b.id ?? crypto.randomUUID();

    const insertData: Record<string, unknown> = {
      id: bookingId,
      location_id: locationId,
      treatment_id: treatInfo.id,
      treatment_name: b.treatment ?? treatInfo.name ?? "",
      client_name: name,
      client_email: email,
      client_phone: phone,
      booking_date: date,
      time_slot: time ?? "",
      status: (b.status ?? "pending").toLowerCase().replace("awaiting_payment", "pending"),
      deposit_amount: deposit,
      total_amount: price,
      deposit_paid: depositPaid,
      stripe_payment_intent_id: b.stripePaymentId ?? null,
      notes,
      client_id: clientId ?? null,
      created_at: b.createdAt ? new Date(Number(b.createdAt)).toISOString() : new Date().toISOString(),
      reminder_sent: false,
    };

    const { data: upserted, error: upsertErr } = await supabaseAdmin
      .from("bookings")
      .upsert(insertData, { onConflict: "id" })
      .select("*, treatments(name, duration_minutes)")
      .single();

    if (upsertErr) throw upsertErr;
    const booking = supabaseRowToBooking(upserted as Record<string, unknown>);

    const whatsapp = await getWhatsApp(locationId);
    const locationInfo = locationId ? await getLocationInfo(locationId) : null;
    const adminEmail = process.env.ADMIN_EMAIL ?? "";

    if (isConsultation) {
      if (!alreadyConfirmed && b.clientEmail) {
        sendConsultationConfirmationEmail({
          clientEmail: b.clientEmail,
          clientName: b.clientName,
          date: b.date,
          time: b.time ?? "",
          whatsapp,
          locationName: locationInfo?.name,
          locationAddress: locationInfo?.address,
        }).catch(() => {});
      }
      if (!alreadyConfirmed && adminEmail) {
        sendConsultationAdminEmail({
          adminEmail,
          clientName: b.clientName,
          clientEmail: b.clientEmail ?? "",
          clientPhone: b.clientPhone ?? "",
          clientDOB: b.clientDOB ?? "",
          clientNotes: b.clientNotes ?? "",
          treatmentInterest: b.notes ?? "",
          date: b.date,
          time: b.time ?? "",
          locationName: locationInfo?.name,
        }).catch(() => {});
      }
    } else {
      if (b.clientEmail && depositPaid) {
        sendClientConfirmationEmail({
          clientEmail: b.clientEmail,
          clientName: b.clientName,
          treatment: b.treatment,
          date: b.date,
          time: b.time ?? "",
          durationMinutes,
          deposit,
          balance,
          depositPaid: true,
          whatsapp,
          locationName: locationInfo?.name,
          locationAddress: locationInfo?.address,
        }).catch(() => {});
      }
      if (adminEmail) {
        sendAdminNotificationEmail({
          adminEmail,
          clientName: b.clientName,
          clientEmail: b.clientEmail ?? "",
          clientPhone: b.clientPhone ?? "",
          treatment: b.treatment,
          durationMinutes,
          date: b.date,
          time: b.time ?? "",
          deposit,
          depositPaid,
          source: b.source ?? "Portal",
          locationName: locationInfo?.name,
        }).catch(() => {});
      }
    }

    return res.status(201).json(booking);
  } catch (err) {
    console.error("POST /api/bookings", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/bookings/bulk — upsert array — admin only
router.post("/bookings/bulk", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  const bookings: unknown[] = req.body;
  if (!Array.isArray(bookings)) return res.status(400).json({ error: "array required" });

  try {
    for (const b of bookings as Record<string, unknown>[]) {
      const treatment = String(b.treatment ?? "");
      const treatInfo = await getTreatmentInfo(treatment, locationId);
      const id = String(b.id ?? crypto.randomUUID());
      await supabaseAdmin.from("bookings").upsert({
        id,
        location_id: locationId,
        treatment_id: treatInfo.id,
        client_name: String(b.clientName ?? ""),
        client_email: String(b.clientEmail ?? ""),
        client_phone: String(b.clientPhone ?? ""),
        booking_date: String(b.date ?? ""),
        time_slot: String(b.time ?? ""),
        status: String(b.status ?? "pending").toLowerCase(),
        deposit_amount: Number(b.deposit ?? treatInfo.depositAmount),
        total_amount: Number(b.price ?? treatInfo.price),
        deposit_paid: Boolean(b.depositPaid),
        stripe_payment_intent_id: b.stripePaymentId ?? null,
        notes: String(b.notes ?? ""),
      }, { onConflict: "id" });
    }
    return res.json({ ok: true, count: bookings.length });
  } catch (err) {
    console.error("POST /api/bookings/bulk", err);
    return res.status(500).json({ error: "db error" });
  }
});

// GET /api/bookings/:id — fetch single booking — admin only
router.get("/bookings/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*, treatments(name, duration_minutes)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "not found" });
    const [medRes, conRes] = await Promise.all([
      supabaseAdmin.from("medical_forms").select("booking_id").eq("booking_id", id),
      supabaseAdmin.from("consent_forms").select("booking_id").eq("booking_id", id),
    ]);
    return res.json({
      ...supabaseRowToBooking(data as Record<string, unknown>),
      hasMedical: !!(medRes.data?.length),
      hasConsent: !!(conRes.data?.length),
    });
  } catch (err) {
    console.error("GET /api/bookings/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

// PUT /api/bookings/:id — update booking — admin only
router.put("/bookings/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  const { id } = req.params;
  const b = req.body;

  try {
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("bookings")
      .select("*, treatments(name, duration_minutes)")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !existing) return res.status(404).json({ error: "not found" });
    if (locationId && existing.location_id !== locationId)
      return res.status(403).json({ error: "location mismatch" });

    const prevStatus = String(existing.status ?? "");
    const prevDepositPaid = Boolean(existing.deposit_paid);
    const prevDate = String(existing.booking_date ?? "");
    const prevTime = String(existing.time_slot ?? "");

    const updates: Record<string, unknown> = {};
    if (b.clientName != null) updates.client_name = b.clientName;
    if (b.clientEmail != null) updates.client_email = b.clientEmail;
    if (b.clientPhone != null) updates.client_phone = b.clientPhone;
    if (b.date != null) updates.booking_date = b.date;
    if (b.time != null) updates.time_slot = b.time;
    if (b.status != null) updates.status = String(b.status).toLowerCase();
    if (b.notes != null) updates.notes = b.notes;
    if (b.depositPaid != null) updates.deposit_paid = b.depositPaid;
    if (b.stripePaymentId != null) updates.stripe_payment_intent_id = b.stripePaymentId;
    if (b.price != null) updates.total_amount = Number(b.price);
    if (b.deposit != null) updates.deposit_amount = Number(b.deposit);

    if (b.treatment != null) {
      const locId = locationId ?? String(existing.location_id ?? "");
      const treatInfo = await getTreatmentInfo(String(b.treatment), locId);
      if (treatInfo.id) updates.treatment_id = treatInfo.id;
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select("*, treatments(name, duration_minutes)")
      .single();

    if (updateErr) throw updateErr;
    const booking = supabaseRowToBooking(updated as Record<string, unknown>);

    const whatsapp = await getWhatsApp(locationId);
    const locationInfo = locationId ? await getLocationInfo(locationId) : null;

    if (String(b.status ?? "").toLowerCase() === "cancelled" && prevStatus !== "cancelled" && booking.clientEmail) {
      sendCancellationEmail({
        clientEmail: booking.clientEmail as string,
        clientName: booking.clientName as string,
        treatment: booking.treatment as string,
        date: booking.date as string,
        time: booking.time as string,
        whatsapp,
        locationName: locationInfo?.name,
      }).catch(() => {});
    }

    // When date or time changes on an active booking, send reschedule email
    const newDate = b.date != null ? String(b.date) : null;
    const newTime = b.time != null ? String(b.time) : null;
    const dateChanged = newDate !== null && newDate !== prevDate;
    const timeChanged = newTime !== null && newTime !== prevTime;
    if (
      (dateChanged || timeChanged) &&
      String(b.status ?? "").toLowerCase() !== "cancelled" &&
      booking.clientEmail
    ) {
      sendRescheduleEmail({
        clientEmail: booking.clientEmail as string,
        clientName: booking.clientName as string,
        treatment: booking.treatment as string,
        newDate: booking.date as string,
        newTime: booking.time as string,
        whatsapp,
        locationName: locationInfo?.name,
      }).catch(() => {});
    }

    // When a booking is marked completed, update client stats (visit count + total spent)
    if (String(b.status ?? "").toLowerCase() === "completed" && prevStatus !== "completed" && booking.clientEmail) {
      const clientEmail = String(booking.clientEmail).toLowerCase().trim();
      const locId = locationId ?? String(existing.location_id ?? "");
      const bookingDate = String(booking.date ?? new Date().toISOString().slice(0, 10));
      const totalAmount = Number(booking.price ?? 0);
      try {
        const { data: existingClient } = await supabaseAdmin
          .from("clients")
          .select("id, visit_count, total_spent")
          .eq("location_id", locId)
          .ilike("email", clientEmail)
          .maybeSingle();
        if (existingClient) {
          await supabaseAdmin
            .from("clients")
            .update({
              visit_count: Number(existingClient.visit_count ?? 0) + 1,
              total_spent: Number(existingClient.total_spent ?? 0) + totalAmount,
              last_visit: bookingDate,
            })
            .eq("id", existingClient.id);
        }
      } catch (statsErr) {
        console.warn("Could not update client stats on completion", statsErr);
      }
    }

    if (b.depositPaid === true && !prevDepositPaid && booking.clientEmail) {
      const dep = Number(booking.deposit ?? 0);
      sendClientConfirmationEmail({
        clientEmail: booking.clientEmail as string,
        clientName: booking.clientName as string,
        treatment: booking.treatment as string,
        date: booking.date as string,
        time: booking.time as string,
        durationMinutes: booking.durationMinutes,
        deposit: dep,
        balance: Number(booking.price ?? 0) - dep,
        depositPaid: true,
        whatsapp,
        locationName: locationInfo?.name,
        locationAddress: locationInfo?.address,
      }).catch(() => {});
    }

    return res.json(booking);
  } catch (err) {
    console.error("PUT /api/bookings/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/bookings/:id — admin only
router.delete("/bookings/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  try {
    let query = supabaseAdmin.from("bookings").delete().eq("id", req.params.id);
    if (locationId) query = query.eq("location_id", locationId);
    const { error } = await query;
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/bookings/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/bookings/sample — remove seeded test data — admin only
router.delete("/bookings/sample", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  const SAMPLE_NAMES = ["Ellisha W.", "Donna S.", "Sophie M.", "Chloe R.", "Amara J.", "Priya K.", "Zara T."];
  try {
    let query = supabaseAdmin.from("bookings").delete().in("client_name", SAMPLE_NAMES);
    if (locationId) query = query.eq("location_id", locationId);
    const { data, error } = await query.select("id");
    if (error) throw error;
    return res.json({ ok: true, deleted: data?.length ?? 0 });
  } catch (err) {
    console.error("DELETE /api/bookings/sample", err);
    return res.status(500).json({ error: "db error" });
  }
});

export default router;
