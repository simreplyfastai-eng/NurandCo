import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { upsertClientFromBooking } from "./clients";
import { hasConflict } from "../lib/treatments";
import {
  sendCancellationEmail,
  sendAdminNotificationEmail,
  sendClientConfirmationEmail,
  sendConsultationConfirmationEmail,
  sendConsultationAdminEmail,
} from "../lib/email";
import { requireAuth } from "../lib/auth";
import { ukDateStr, ukDayOfWeek } from "../lib/tz";

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

  return {
    id: String(row.id ?? ""),
    clientId: row.client_id ?? null,
    clientName: row.client_name ?? "",
    clientEmail: row.client_email ?? "",
    clientPhone: row.client_phone ?? "",
    clientDOB: row.client_dob ?? "",
    clientNotes: row.client_notes ?? "",
    treatment: ((treatment?.name ?? row.treatment_name ?? "") as string),
    category: (row.category ?? "") as string,
    price: Number(row.total_amount ?? row.price ?? 0),
    deposit: Number(row.deposit_amount ?? row.deposit ?? 0),
    depositPaid: Boolean(row.deposit_paid),
    balancePaid: Boolean(row.balance_paid),
    date: (row.booking_date ?? row.date ?? "") as string,
    time: (row.time_slot ?? row.time ?? "") as string,
    status: (row.status ?? "Pending") as string,
    paymentMethod: (row.payment_method ?? "Stripe") as string,
    stripePaymentId: (row.stripe_payment_id ?? null) as string | null,
    notes: (row.notes ?? "") as string,
    createdAt,
    source: (row.source ?? "Website") as string,
    durationMinutes: Number(treatment?.duration_minutes ?? row.duration_minutes ?? 30),
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

async function checkAvailability(
  date: string,
  time: string,
  locationId: string,
): Promise<{ ok: boolean; error?: string; status?: number }> {
  try {
    const { data: blocked } = await supabaseAdmin
      .from("blocked_dates")
      .select("id")
      .eq("location_id", locationId)
      .eq("date", date)
      .maybeSingle();
    if (blocked) return { ok: false, error: "Sorry, we are not available on this day.", status: 400 };

    const dayIndex = ukDayOfWeek(date);
    const { data: settings } = await supabaseAdmin
      .from("availability_settings")
      .select("is_open, start_time, end_time")
      .eq("location_id", locationId)
      .eq("day_of_week", dayIndex)
      .maybeSingle();

    if (!settings || !settings.is_open) {
      return { ok: false, error: "Sorry, we are not available on this day.", status: 400 };
    }

    if (time && settings.start_time && settings.end_time) {
      if (time < settings.start_time || time >= settings.end_time) {
        return { ok: false, error: "Sorry, this time is outside our working hours.", status: 400 };
      }
    }
  } catch {
    // If availability check fails, allow the booking
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
      .select("id, booking_date, time_slot, duration_minutes, treatments(duration_minutes)")
      .eq("status", "Confirmed");

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
      .update({ status: "Complete" })
      .in("id", toComplete);

    return toComplete.length;
  } catch (err) {
    console.error("runAutoComplete error", err);
    return 0;
  }
}

export async function cleanupGhostBookings(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .delete()
      .eq("status", "awaiting_payment")
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
  const { month, limit, sort } = req.query as Record<string, string>;

  try {
    let query = supabaseAdmin
      .from("bookings")
      .select("*, treatments(name, duration_minutes)")
      .eq("location_id", locationId);

    if (month) query = query.like("booking_date", `${month}-%`);
    if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("booking_date", { ascending: false });
    }
    if (limit) query = query.limit(Number(limit));

    const { data, error } = await query;
    if (error) throw error;
    return res.json((data ?? []).map(supabaseRowToBooking));
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
      .select("id, time_slot, duration_minutes, status, treatments(name, duration_minutes)")
      .eq("booking_date", req.params.date)
      .neq("status", "Cancelled")
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
          durationMinutes: Number(t?.duration_minutes ?? r.duration_minutes ?? 30),
          status: r.status ?? "Pending",
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

  const name = (b.clientName ?? "").trim();
  const email = (b.clientEmail ?? "").trim();
  const phone = (b.clientPhone ?? "").trim();
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

    if (locationId) {
      const avail = await checkAvailability(date, time, locationId);
      if (!avail.ok) return res.status(avail.status ?? 400).json({ error: avail.error });
    }

    // Conflict check
    if (time && locationId) {
      const { data: existing } = await supabaseAdmin
        .from("bookings")
        .select("time_slot, duration_minutes, status, treatments(duration_minutes)")
        .eq("location_id", locationId)
        .eq("booking_date", date)
        .neq("status", "Cancelled");

      const conflict = hasConflict(
        time,
        durationMinutes,
        (existing ?? []).map((r) => {
          const t = r.treatments as Record<string, unknown> | null;
          return {
            time: String(r.time_slot ?? ""),
            durationMinutes: Number(t?.duration_minutes ?? r.duration_minutes ?? 30),
            status: String(r.status ?? ""),
          };
        }),
      );
      if (conflict) {
        return res.status(409).json({
          error: "This time slot is no longer available. Please select another time.",
        });
      }
    }

    const clientId = await upsertClientFromBooking({
      name: b.clientName,
      email: b.clientEmail ?? "",
      phone: b.clientPhone ?? "",
      date: b.date,
      source: b.source ?? "Website",
      dob: b.clientDOB ?? "",
      notes: isConsultation ? (b.clientNotes ?? "") : "",
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
          .eq("status", "Confirmed")
          .maybeSingle()
      ).data
    );

    const bookingId = b.id ?? crypto.randomUUID();

    const insertData: Record<string, unknown> = {
      id: bookingId,
      location_id: locationId,
      treatment_id: treatInfo.id,
      client_name: b.clientName,
      client_email: b.clientEmail ?? "",
      client_phone: b.clientPhone ?? "",
      booking_date: date,
      time_slot: time ?? "",
      status: b.status ?? "Pending",
      deposit_amount: deposit,
      total_amount: price,
      deposit_paid: depositPaid,
      balance_paid: b.balancePaid ?? false,
      stripe_payment_id: b.stripePaymentId ?? null,
      notes: b.notes ?? "",
      source: b.source ?? "Portal",
      duration_minutes: durationMinutes,
      client_id: clientId ?? null,
      client_dob: b.clientDOB ?? null,
      client_notes: isConsultation ? (b.clientNotes ?? null) : null,
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
        status: String(b.status ?? "Pending"),
        deposit_amount: Number(b.deposit ?? treatInfo.depositAmount),
        total_amount: Number(b.price ?? treatInfo.price),
        deposit_paid: Boolean(b.depositPaid),
        balance_paid: Boolean(b.balancePaid),
        stripe_payment_id: b.stripePaymentId ?? null,
        notes: String(b.notes ?? ""),
        source: String(b.source ?? "Portal"),
        duration_minutes: treatInfo.durationMinutes,
      }, { onConflict: "id" });
    }
    return res.json({ ok: true, count: bookings.length });
  } catch (err) {
    console.error("POST /api/bookings/bulk", err);
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

    const updates: Record<string, unknown> = {};
    if (b.clientName != null) updates.client_name = b.clientName;
    if (b.clientEmail != null) updates.client_email = b.clientEmail;
    if (b.clientPhone != null) updates.client_phone = b.clientPhone;
    if (b.date != null) updates.booking_date = b.date;
    if (b.time != null) updates.time_slot = b.time;
    if (b.status != null) updates.status = b.status;
    if (b.notes != null) updates.notes = b.notes;
    if (b.depositPaid != null) updates.deposit_paid = b.depositPaid;
    if (b.balancePaid != null) updates.balance_paid = b.balancePaid;
    if (b.stripePaymentId != null) updates.stripe_payment_id = b.stripePaymentId;
    if (b.price != null) updates.total_amount = Number(b.price);
    if (b.deposit != null) updates.deposit_amount = Number(b.deposit);
    if (b.clientDOB != null) updates.client_dob = b.clientDOB;
    if (b.clientNotes != null) updates.client_notes = b.clientNotes;

    if (b.treatment != null) {
      const locId = locationId ?? String(existing.location_id ?? "");
      const treatInfo = await getTreatmentInfo(String(b.treatment), locId);
      if (treatInfo.id) updates.treatment_id = treatInfo.id;
      updates.duration_minutes = treatInfo.durationMinutes;
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

    if (b.status === "Cancelled" && prevStatus !== "Cancelled" && booking.clientEmail) {
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
