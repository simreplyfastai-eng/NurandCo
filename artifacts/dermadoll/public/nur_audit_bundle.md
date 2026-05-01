# Nur & Co — Booking Pipeline Audit Bundle

Generated: 2026-04-29 23:12:09 UTC

This document contains the complete source code of all files needed to audit
the booking pipeline + email confirmation flow for Nur & Co Aesthetics.

## Files included
1. `app.ts` — middleware order
2. `routes/bookings.ts` — booking creation route
3. `routes/stripe.ts` — payment intent + webhook handler
4. `lib/email.ts` — confirmation/reminder/cancellation templates
5. `nur-schema.sql` — full database schema
6. Bookings table CREATE statement (extracted)

## Critical IDs
- Supabase project: kgbgqukgsfcrpkdxiptx
- Location ID (nur-and-co): f2c78e92-66bd-4fca-8006-e31009edfa8f
- API server: PORT=8080 in ./artifacts/api-server/
- Domain (NOT YET PUBLISHED): nurandcoaesthetics.co.uk
- Clinic address: Bedale Road, Sherwood, Nottingham NG5 3GL

---

# 1. app.ts (middleware order)

```typescript
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust the Replit proxy so each client's real IP is used for rate limiting
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        imgSrc: ["'self'", "data:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins: (string | RegExp)[] = [
  "https://nurandcoaesthetics.co.uk",
  "https://aestheticsnottingham.co.uk",
  "https://www.nurandcoaesthetics.co.uk",
  "https://www.aestheticsnottingham.co.uk",
  "http://localhost:3000",
  "http://localhost:5173",
];
// Allow Replit dev-domain proxy in development so the portal preview works
if (process.env.REPLIT_DEV_DOMAIN) {
  allowedOrigins.push(new RegExp(`https://${process.env.REPLIT_DEV_DOMAIN.replace(/\./g, "\\.")}.*`));
}
app.use(cors({ origin: allowedOrigins, credentials: true }));
// Raw body needed for Stripe webhook signature verification
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Rate limiting ───────────────────────────────────────────────────────────

// General catch-all: 200 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

// Login: 10 attempts per 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

// Booking creation: 5 per hour
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking attempts. Please try again later." },
});

// Enquiries: 5 per minute per IP
const enquiryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many enquiry attempts. Please try again in a minute." },
});

// Payment intent: 5 per 10 min
const piLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a few minutes." },
});

// Form submission (health data): 10 per minute per IP
const formsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many form submissions. Please try again in a minute." },
});

app.use("/api", apiLimiter);
app.post("/api/auth/login", loginLimiter);
app.post("/api/auth/change-password", loginLimiter);
app.post("/api/bookings", bookingLimiter);
app.post("/api/enquiries", enquiryLimiter);
app.post("/api/stripe/create-payment-intent", piLimiter);
app.post("/api/forms/medical", formsLimiter);
app.post("/api/forms/consent", formsLimiter);

app.use("/api", router);

export default app;
```

---

# 2. routes/bookings.ts

```typescript
import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { createCalendarEvent, deleteCalendarEvent } from '../googleCalendar';
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
      // new Date() respects process.env.TZ="Europe/London" — correctly handles BST/GMT
      const apptMs = new Date(y, m - 1, d, h, min).getTime() + durationMins * 60_000 + 15 * 60_000;

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

  const isPortal = b.source === "Portal";

  if (!name || name.length < 2) return res.status(400).json({ error: "Please enter your name." });
  if (!isPortal) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Please enter a valid email address." });
    if (!phone || phone.replace(/\s/g, "").length < 7)
      return res.status(400).json({ error: "Please enter your phone number." });
  }
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

    try {
      const googleEventId = await createCalendarEvent(booking.locationId ?? locationId, {
        date: booking.date,
        time: booking.time,
        treatment_name: booking.treatment,
        customer_name: booking.clientName as string,
        customer_phone: booking.clientPhone as string,
        customer_email: booking.clientEmail as string,
        notes: booking.notes,
      });
      if (googleEventId) {
        await supabaseAdmin
          .from('bookings')
          .update({ google_event_id: googleEventId })
          .eq('id', booking.id);
      }
    } catch (err: any) {
      console.error('Google Calendar sync failed (non-fatal):', err?.message ?? err);
      if (err?.errors) console.error('Google API errors:', JSON.stringify(err.errors));
    }

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
  } catch (err: any) {
    console.error("POST /api/bookings", err);
    return res.status(500).json({ error: err?.message ?? "db error" });
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

    if (String(b.status ?? "").toLowerCase() === "cancelled" && prevStatus !== "cancelled") {
      if (booking.clientEmail) {
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
      const gEventId = String(existing.google_event_id ?? "");
      const gLocId = String(existing.location_id ?? "");
      if (gEventId && gLocId) {
        try {
          await deleteCalendarEvent(gLocId, gEventId);
        } catch (err) {
          console.error('Google Calendar delete failed (non-fatal):', err);
        }
      }
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
    // Fetch google_event_id before deleting so we can clean up Calendar
    const { data: existing } = await supabaseAdmin
      .from("bookings")
      .select("google_event_id, location_id")
      .eq("id", req.params.id)
      .maybeSingle();

    let query = supabaseAdmin.from("bookings").delete().eq("id", req.params.id);
    if (locationId) query = query.eq("location_id", locationId);
    const { error } = await query;
    if (error) throw error;

    const gEventId = String(existing?.google_event_id ?? "");
    const gLocId = String(existing?.location_id ?? "");
    if (gEventId && gLocId) {
      try {
        await deleteCalendarEvent(gLocId, gEventId);
      } catch (err) {
        console.error('Google Calendar delete failed (non-fatal):', err);
      }
    }

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
```

---

# 3. routes/stripe.ts

```typescript
// STRIPE KEYS — add to Replit Secrets before going live
// STRIPE_SECRET_KEY=sk_live_...
// STRIPE_PUBLISHABLE_KEY=pk_live_...
// STRIPE_WEBHOOK_SECRET=whsec_...

import { Router } from "express";
import Stripe from "stripe";
import { supabaseAdmin } from "../lib/supabase";
import { sendAdminNotificationEmail, sendWebhookAlertEmail } from "../lib/email";
import { findOrCreateClient } from "./clients";
import { getDepositAmount } from "../lib/treatments";
import { ukDateStr } from "../lib/tz";
import { createCalendarEvent } from "../googleCalendar";

const router = Router();

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

/** Read dd_settings for a specific location from portal_kv */
async function getLocationSettings(locationId?: string | null): Promise<Record<string, unknown>> {
  if (!locationId) return getAnySettings();
  try {
    const { data } = await supabaseAdmin
      .from("portal_kv")
      .select("value")
      .eq("location_id", locationId)
      .eq("key", "dd_settings")
      .maybeSingle();
    return (data?.value as Record<string, unknown>) ?? getAnySettings();
  } catch {
    return {};
  }
}

/** Fallback: read dd_settings from any location (for global config requests) */
async function getAnySettings(): Promise<Record<string, unknown>> {
  try {
    const { data } = await supabaseAdmin
      .from("portal_kv")
      .select("value")
      .eq("key", "dd_settings")
      .limit(1)
      .maybeSingle();
    return (data?.value as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
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
    const settings = await getLocationSettings(locationId);
    if (settings.whatsapp) return String(settings.whatsapp);
  }
  return "";
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

async function getTreatmentInfo(
  name: string,
  locationId: string,
): Promise<{ id: string | null; durationMinutes: number; price: number; depositAmount: number }> {
  if (!name || !locationId) return { id: null, durationMinutes: 30, price: 0, depositAmount: 0 };
  try {
    const { data } = await supabaseAdmin
      .from("treatments")
      .select("id, duration_minutes, price, deposit_amount")
      .eq("location_id", locationId)
      .eq("name", name)
      .single();
    if (data) return { id: data.id, durationMinutes: Number(data.duration_minutes ?? 30), price: Number(data.price ?? 0), depositAmount: Number(data.deposit_amount ?? 0) };
  } catch { /* fall through */ }
  return { id: null, durationMinutes: 30, price: 0, depositAmount: 0 };
}

// ── helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns fixed deposit amounts from dd_settings in portal_kv.
 * Injectables default £20, everything else default £10.
 */
async function getDepositSettings(locationId: string): Promise<{ depositInjectables: number; depositOther: number }> {
  try {
    const settings = await getLocationSettings(locationId);
    const inj = Number(settings.depositInjectables ?? 0);
    const other = Number(settings.depositOther ?? 0);
    if (inj > 0 || other > 0) {
      return { depositInjectables: inj || 20, depositOther: other || 10 };
    }
  } catch { /* fall through */ }
  return { depositInjectables: 20, depositOther: 10 };
}

const IG_ACCOUNTS_DEFAULT = [
  { handle: "@[Client]Facess",      label: "Face Treatments", url: "https://instagram.com/[Client]Facess" },
  { handle: "@[ClientName]s", label: "Aesthetics",       url: "https://instagram.com/[ClientName]s" },
  { handle: "@[Client]Suitess",     label: "The Suite",        url: "https://instagram.com/[Client]Suitess" },
  { handle: "@[Client]Nailedd",     label: "Nails",            url: "https://instagram.com/[Client]Nailedd" },
];
const TT_ACCOUNTS_DEFAULT = [
  { handle: "@[Client]Facess",      label: "Face Treatments", url: "https://tiktok.com/@[Client]Facess" },
  { handle: "@[ClientName]s", label: "Aesthetics",       url: "https://tiktok.com/@[ClientName]s" },
  { handle: "@[Client]Suitess",     label: "The Suite",        url: "https://tiktok.com/@[Client]Suitess" },
  { handle: "@[Client]Nailedd",     label: "Nails",            url: "https://tiktok.com/@[Client]Nailedd" },
];

// GET /api/config — public config + checklist
// ?locationId=<uuid>  optional — returns location-specific whatsapp/depositPercent
router.get("/config", async (req, res) => {
  const locationId = (req.query.locationId as string | undefined) ??
                     (req.headers["x-location-id"] as string | undefined) ?? null;
  const settings = await getLocationSettings(locationId);
  const whatsapp = await getWhatsApp(locationId) || String(settings.whatsapp ?? "447701298985");
  const depositPercent = Number(settings.depositPercent ?? settings.deposit ?? 30);
  const instagramAccounts = Array.isArray(settings.instagramAccounts) ? settings.instagramAccounts : IG_ACCOUNTS_DEFAULT;
  const tiktokAccounts    = Array.isArray(settings.tiktokAccounts)    ? settings.tiktokAccounts    : TT_ACCOUNTS_DEFAULT;
  return res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
    whatsapp,
    depositPercent,
    instagramAccounts,
    tiktokAccounts,
    hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasStripePublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
    hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    hasWhatsapp: !!whatsapp,
    hasCronSecret: !!process.env.CRON_SECRET,
  });
});

// POST /api/stripe/create-payment-intent
router.post("/stripe/create-payment-intent", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: "Stripe is not configured. Please contact the clinic to arrange payment." });
  }

  const {
    treatment, clientName, clientEmail, clientPhone,
    bookingDate, bookingTime, bookingId, locationId,
  } = req.body as Record<string, string>;

  if (!treatment) return res.status(400).json({ error: "treatment required" });

  // BULLETPROOF 8 — fail fast before taking payment if essential booking fields are missing
  if (!bookingDate?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return res.status(400).json({ error: "Booking date is required — please go back and select a date." });
  }
  if (!bookingTime?.match(/^\d{2}:\d{2}$/)) {
    return res.status(400).json({ error: "Booking time is required — please go back and select a time slot." });
  }
  if (!locationId) {
    return res.status(400).json({ error: "Location is required." });
  }

  let treatmentPrice = 0;
  let durationMinutes = 30;
  let dbDepositAmount = 0;
  if (locationId) {
    const info = await getTreatmentInfo(treatment, locationId);
    treatmentPrice = info.price;
    durationMinutes = info.durationMinutes;
    dbDepositAmount = info.depositAmount;
  }

  if (!treatmentPrice && treatment !== "In-Person Consultation" && treatment !== "Virtual Consultation") {
    return res.status(400).json({ error: "Unknown treatment. Please refresh and try again." });
  }

  const depSettings = locationId
    ? await getDepositSettings(locationId)
    : { depositInjectables: 20, depositOther: 10 };
  const depositAmountPence = dbDepositAmount > 0
    ? Math.round(dbDepositAmount * 100)
    : Math.round(getDepositAmount(treatment, depSettings) * 100);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmountPence,
      currency: "gbp",
      receipt_email: clientEmail || undefined,
      metadata: {
        treatment,
        clientName: clientName ?? "",
        clientEmail: clientEmail ?? "",
        clientPhone: clientPhone ?? "",
        bookingDate: bookingDate ?? "",
        bookingTime: bookingTime ?? "",
        bookingId: bookingId ?? "",
        locationId: locationId ?? "",
        durationMinutes: String(durationMinutes),
      },
      automatic_payment_methods: { enabled: true },
    });
    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      depositAmountPence,
    });
  } catch (err) {
    console.error("POST /api/stripe/create-payment-intent", err);
    return res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// POST /api/stripe/webhook
router.post("/stripe/webhook", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(200).json({ received: true });

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  if (!webhookSecret) {
    console.error("CRITICAL: STRIPE_WEBHOOK_SECRET is not set.");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature error", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const {
      treatment, clientName, clientEmail, clientPhone,
      bookingDate, bookingTime, bookingId, locationId, durationMinutes,
    } = pi.metadata ?? {};
    const paymentIntentId = pi.id;

    try {
      // BULLETPROOF 2 — Idempotency: check at the very top before doing any work.
      // Stripe can fire the same webhook more than once. If we already created/confirmed
      // a booking for this payment intent, return immediately.
      const { data: alreadyConfirmed } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .eq("deposit_paid", true)
        .maybeSingle();

      if (alreadyConfirmed) {
        console.log(`Webhook idempotency: booking ${alreadyConfirmed.id} already confirmed for PI ${paymentIntentId} — skipping duplicate`);
        return res.status(200).json({ received: true });
      }

      const depositFromStripe = Math.round(pi.amount / 100);
      const whatsapp = await getWhatsApp(locationId || null);
      const locationInfo = locationId ? await getLocationInfo(locationId) : null;
      const adminEmail = process.env.ADMIN_EMAIL ?? "";

      // 1. Update pre-saved "pending" booking
      if (bookingId) {
        const { data: updated } = await supabaseAdmin
          .from("bookings")
          .update({
            deposit_paid: true,
            status: "confirmed",
            stripe_payment_intent_id: paymentIntentId,
            stripe_session_id: paymentIntentId,
            deposit_amount: depositFromStripe,
          })
          .eq("id", bookingId)
          .in("status", ["pending", "awaiting_payment"])
          .select("*, treatments(name, duration_minutes)")
          .maybeSingle();

        if (updated) {
          const treatmentRec = updated.treatments as Record<string, unknown> | null;
          const bDate = String(updated.booking_date ?? bookingDate ?? "");
          const bTime = String(updated.time_slot ?? bookingTime ?? "");
          const dur = Number(treatmentRec?.duration_minutes ?? durationMinutes ?? 30);
          const totalAmount = Number(updated.total_amount ?? depositFromStripe);
          const balanceDue = Math.max(0, totalAmount - depositFromStripe);

          // 1a. Upsert Supabase clients table (with stat updates — payment confirmed)
          let supabaseClientId: string | null = null;
          if (clientName && locationId) {
            supabaseClientId = await findOrCreateClient({
              locationId,
              name: clientName,
              email: clientEmail ?? "",
              phone: clientPhone ?? "",
              source: "Website",
              updateStats: { depositAmount: depositFromStripe, bookingDate: bDate },
            }).catch(() => null);
          }

          // 1b. Create payments record
          const paymentLocationId = (updated.location_id as string | null) ?? (locationId || null);
          supabaseAdmin.from("payments").insert({
            booking_id: bookingId,
            client_email: clientEmail ?? String(updated.client_email ?? ""),
            amount: depositFromStripe,
            type: "deposit",
            stripe_payment_intent_id: paymentIntentId,
            stripe_charge_id: null,
            location_id: paymentLocationId,
          }).then(() => {}).catch((e: unknown) => console.error("payments insert", e));

          // 1c. Update booking balance_due + client_id if we resolved it
          const bkUpdate: Record<string, unknown> = { balance_due: balanceDue };
          if (supabaseClientId && !updated.client_id) bkUpdate.client_id = supabaseClientId;
          supabaseAdmin.from("bookings").update(bkUpdate).eq("id", bookingId)
            .then(() => {}).catch((e: unknown) => console.error("booking balance_due update", e));

          if (adminEmail) {
            sendAdminNotificationEmail({
              adminEmail,
              clientName: clientName ?? "",
              clientEmail: clientEmail ?? "",
              clientPhone: clientPhone ?? "",
              treatment: treatment ?? "",
              durationMinutes: dur,
              date: bDate,
              time: bTime,
              deposit: depositFromStripe,
              depositPaid: true,
              source: "Website",
              locationName: locationInfo?.name,
              locationAddress: locationInfo?.address,
              bookingId: bookingId ?? undefined,
            }).catch(() => {});
          }

          // 1d. Google Calendar sync (non-blocking)
          const gcalLocationId = String((updated.location_id as string | null) ?? locationId ?? "");
          createCalendarEvent(gcalLocationId, {
            date: bDate,
            time: bTime,
            treatment_name: treatment ?? "",
            customer_name: clientName ?? "",
            customer_phone: clientPhone ?? "",
            customer_email: clientEmail ?? "",
          }).then((eventId) => {
            if (eventId) {
              supabaseAdmin.from("bookings").update({ google_event_id: eventId }).eq("id", bookingId)
                .then(() => console.log(`Google Calendar: event ${eventId} created for booking ${bookingId}`))
                .catch((e: unknown) => console.error("Google Calendar: failed to save event ID", e));
            } else {
              console.warn("Google Calendar: no event created for booking", bookingId, "— not connected or no token for location", gcalLocationId);
            }
          }).catch((err: any) => {
            console.error("Google Calendar sync failed (non-fatal):", err?.message ?? err);
            if (err?.errors) console.error("Google API errors:", JSON.stringify(err.errors));
          });
        }
      }

      // 2. Idempotency: check if already confirmed
      const { data: existingByPi } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();

      if (existingByPi) {
        await supabaseAdmin
          .from("bookings")
          .update({ deposit_paid: true, status: "confirmed" })
          .eq("stripe_payment_intent_id", paymentIntentId)
          .eq("deposit_paid", false);
      } else if (treatment && clientName && locationId) {
        // 3. Fallback: create booking from metadata
        const id = bookingId || crypto.randomUUID();
        const dur = Number(durationMinutes ?? 30);
        const bDate = bookingDate?.match(/^\d{4}-\d{2}-\d{2}$/) ? bookingDate : ukDateStr();
        const bTime = bookingTime?.match(/^\d{2}:\d{2}$/) ? bookingTime : "";

        const treatInfo = await getTreatmentInfo(treatment, locationId);
        const price = treatInfo.price || depositFromStripe * 2;

        // Slot conflict check — payment already taken so we log but still create the booking
        const slotFree = await (async () => {
          try {
            const { data } = await supabaseAdmin.from("bookings").select("id")
              .eq("location_id", locationId).eq("booking_date", bDate).eq("time_slot", bTime)
              .not("status", "eq", "cancelled").limit(1);
            return !data || data.length === 0;
          } catch { return true; }
        })();
        if (!slotFree) {
          console.warn(`Stripe webhook: slot conflict for ${bDate} ${bTime} at ${locationId} — payment already taken, creating booking with conflict note`);
        }

        const clientId = await findOrCreateClient({
          locationId,
          name: clientName,
          email: clientEmail ?? "",
          phone: clientPhone ?? "",
          source: "Website",
          updateStats: { depositAmount: depositFromStripe, bookingDate: bDate },
        }).catch(() => null);

        const balanceDue3 = Math.max(0, price - depositFromStripe);
        await supabaseAdmin.from("bookings").upsert({
          id,
          location_id: locationId,
          treatment_id: treatInfo.id,
          treatment_name: treatment,
          client_id: clientId,
          client_name: clientName,
          client_email: clientEmail ?? "",
          client_phone: clientPhone ?? "",
          booking_date: bDate,
          time_slot: bTime,
          status: "confirmed",
          deposit_amount: depositFromStripe,
          total_amount: price,
          balance_due: balanceDue3,
          deposit_paid: true,
          stripe_payment_intent_id: paymentIntentId,
          stripe_session_id: paymentIntentId,
          forms_completed: false,
          reminder_sent: false,
          notes: slotFree ? "" : "⚠️ Slot conflict — review required",
        }, { onConflict: "id" });

        // Fallback payments record
        supabaseAdmin.from("payments").insert({
          booking_id: id,
          client_email: clientEmail ?? "",
          amount: depositFromStripe,
          type: "deposit",
          stripe_payment_intent_id: paymentIntentId,
          stripe_charge_id: null,
          location_id: locationId,
        }).then(() => {}).catch((e: unknown) => console.error("fallback payments insert", e));

        if (adminEmail) {
          sendAdminNotificationEmail({
            adminEmail,
            clientName,
            clientEmail: clientEmail ?? "",
            clientPhone: clientPhone ?? "",
            treatment,
            durationMinutes: dur,
            date: bDate,
            time: bTime,
            deposit: depositFromStripe,
            depositPaid: true,
            source: "Website",
            locationName: locationInfo?.name,
            locationAddress: locationInfo?.address,
            bookingId: id,
          }).catch(() => {});
        }

        // Fallback path: Google Calendar sync (non-blocking)
        createCalendarEvent(locationId, {
          date: bDate,
          time: bTime,
          treatment_name: treatment,
          customer_name: clientName,
          customer_phone: clientPhone ?? "",
          customer_email: clientEmail ?? "",
        }).then((eventId) => {
          if (eventId) {
            supabaseAdmin.from("bookings").update({ google_event_id: eventId }).eq("id", id)
              .then(() => console.log(`Google Calendar: event ${eventId} created for booking ${id}`))
              .catch((e: unknown) => console.error("Google Calendar: failed to save event ID (fallback)", e));
          } else {
            console.warn("Google Calendar: no event created for fallback booking", id, "— not connected or no token for location", locationId);
          }
        }).catch((err: any) => {
          console.error("Google Calendar sync failed (fallback, non-fatal):", err?.message ?? err);
          if (err?.errors) console.error("Google API errors:", JSON.stringify(err.errors));
        });
      }
    } catch (err) {
      // BULLETPROOF 4 — Log full context and alert admin by email
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = err instanceof Error ? (err.stack ?? "") : "";
      console.error("WEBHOOK FAILED", JSON.stringify({
        paymentIntentId,
        treatment, clientName, clientEmail,
        bookingDate, bookingTime, bookingId, locationId,
        error: errMsg,
        stack: errStack.slice(0, 500),
      }));

      const adminEmail = process.env.ADMIN_EMAIL ?? "";
      if (adminEmail) {
        sendWebhookAlertEmail({
          adminEmail,
          paymentIntentId,
          clientName: clientName ?? "",
          clientEmail: clientEmail ?? "",
          clientPhone: clientPhone ?? "",
          treatment: treatment ?? "",
          bookingDate: bookingDate ?? "",
          bookingTime: bookingTime ?? "",
          bookingId: bookingId ?? "",
          locationId: locationId ?? "",
          error: errMsg,
        }).catch(() => {});
      }
    }
  }

  // Always return 200 so Stripe does not keep retrying
  return res.status(200).json({ received: true });
});

export default router;
```

---

# 4. lib/email.ts

```typescript
import { Resend } from "resend";

const RESEND_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = "[CLIENT_NAME] <hello@[CLIENT_NAME]y.co.uk>";
const SITE_URL = (process.env.PUBLIC_URL ?? "").replace(/\/$/, "");

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!RESEND_KEY) return null;
  if (!_resend) _resend = new Resend(RESEND_KEY);
  return _resend;
}

// ── Date / time helpers ───────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function fmtDateUK(dateStr: string): string {
  if (!dateStr) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function addMinutesToTime(time: string, mins: number): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

type CalBooking = {
  treatment_name: string;
  booking_date: string;
  time_slot: string;
  duration_minutes?: number;
  id?: string;
  deposit_amount?: number;
  total_price?: number;
};
type CalLocation = { name: string; address_full: string };

export function buildGoogleCalendarUrl(booking: CalBooking, location: CalLocation): string {
  const start = booking.time_slot.slice(0, 5);
  const end = addMinutesToTime(start, booking.duration_minutes ?? 60);
  const fmt = (d: string, t: string) => d.replace(/-/g, "") + "T" + t.replace(":", "") + "00";
  const title = encodeURIComponent(`${booking.treatment_name} @ [CLIENT_NAME]`);
  const details = encodeURIComponent(
    `[CLIENT_NAME] appointment\nTreatment: ${booking.treatment_name}\nLocation: ${location.address_full}\nContact: wa.me/447701298985`,
  );
  const loc = encodeURIComponent(location.address_full);
  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${title}&dates=${fmt(booking.booking_date, start)}/${fmt(booking.booking_date, end)}` +
    `&details=${details}&location=${loc}`
  );
}

export function buildICSContent(booking: CalBooking, location: CalLocation): string {
  const start = booking.time_slot.slice(0, 5);
  const end = addMinutesToTime(start, booking.duration_minutes ?? 60);
  const dtFmt = (d: string, t: string) => `${d.replace(/-/g, "")}T${t.replace(":", "")}00`;
  const stamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const uid = `${booking.id ?? Date.now()}@[CLIENT_NAME]y.co.uk`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//[CLIENT_NAME]//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/London:${dtFmt(booking.booking_date, start)}`,
    `DTEND;TZID=Europe/London:${dtFmt(booking.booking_date, end)}`,
    `SUMMARY:${booking.treatment_name} @ [CLIENT_NAME]`,
    `DESCRIPTION:Treatment: ${booking.treatment_name}\\nContact: +44 7701 298985`,
    `LOCATION:${location.address_full}`,
    `ORGANIZER;CN=[CLIENT_NAME]:mailto:info@[CLIENT_NAME]y.co.uk`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// ── Plain-text footer (required for deliverability + legal compliance) ─────────

const PLAIN_FOOTER = `
--
[CLIENT_NAME]
[LOCATION_1], Essex · [LOCATION_2], London
hello@[CLIENT_NAME]y.co.uk | [CLIENT_NAME]y.co.uk | WhatsApp: +44 7701 298985

You received this email because you have an appointment booked with [CLIENT_NAME].
To stop receiving appointment emails, reply to this message or email hello@[CLIENT_NAME]y.co.uk with the subject "Unsubscribe".

© 2026 [CLIENT_NAME]. All rights reserved.
`.trim();

// ── Base email template ───────────────────────────────────────────────────────

function buildEmail(content: string, subject: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:-apple-system,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
  <tr><td align="center">

  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:12px;border:1px solid #E8DDD3;box-shadow:0 2px 12px rgba(92,30,30,0.06);">
  <tr><td>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="background:#5C1A1A;padding:28px 40px;border-radius:12px 12px 0 0;text-align:center;">
        <div style="font-family:Georgia,serif;font-size:26px;color:#FFFFFF;letter-spacing:0.12em;font-weight:normal;">[CLIENT]</div>
        <div style="font-family:-apple-system,Arial,sans-serif;font-size:10px;color:#C9A96E;letter-spacing:0.28em;margin-top:2px;">[CLIENT_TYPE]</div>
      </td>
    </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="height:3px;background:#C9A96E;"></td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:36px 40px;">${content}</td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:20px 40px 24px;border-top:1px solid #E8DDD3;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;color:#8C7B6B;letter-spacing:0.08em;">[CLIENT NAME] &middot; ESSEX &amp; LONDON</p>
        <p style="margin:0 0 2px;font-size:10px;color:#B5A89A;">[LOCATION_1], Essex &middot; [LOCATION_2], London</p>
        <p style="margin:0 0 8px;font-size:10px;color:#B5A89A;">
          <a href="mailto:hello@[CLIENT_NAME]y.co.uk" style="color:#C9A96E;text-decoration:none;">hello@[CLIENT_NAME]y.co.uk</a>
          &nbsp;&middot;&nbsp;
          <a href="https://wa.me/447701298985" style="color:#C9A96E;text-decoration:none;">WhatsApp</a>
          &nbsp;&middot;&nbsp;
          <a href="https://[CLIENT_NAME]y.co.uk" style="color:#C9A96E;text-decoration:none;">[CLIENT_NAME]y.co.uk</a>
        </p>
        <p style="margin:0 0 6px;font-size:10px;color:#B5A89A;line-height:1.5;">
          You received this email because you have an appointment booked with [CLIENT_NAME].<br>
          <a href="mailto:hello@[CLIENT_NAME]y.co.uk?subject=Unsubscribe" style="color:#B5A89A;text-decoration:underline;">Unsubscribe</a>
          from appointment emails.
        </p>
        <p style="margin:0;font-size:10px;color:#B5A89A;">&copy; 2026 [CLIENT_NAME]. All rights reserved.</p>
      </td>
    </tr>
    </table>

  </td></tr>
  </table>

  </td></tr>
  </table>
</body>
</html>`;
}

// ── Booking details box ───────────────────────────────────────────────────────

function buildBookingBox(booking: CalBooking, location: CalLocation): string {
  const deposit = booking.deposit_amount ?? 0;
  const balance = Math.max(0, (booking.total_price ?? 0) - deposit);
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:20px 0;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:6px 0;border-bottom:1px solid #E8DDD3;">
      <span style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;">Treatment</span><br>
      <span style="font-size:16px;color:#5C1A1A;font-family:Georgia,serif;">${booking.treatment_name}</span>
    </td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #E8DDD3;">
      <span style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;">Date &amp; Time</span><br>
      <span style="font-size:15px;color:#2C2420;font-weight:600;">${formatDate(booking.booking_date)} at ${booking.time_slot}</span>
    </td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #E8DDD3;">
      <span style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;">Location</span><br>
      <span style="font-size:14px;color:#2C2420;">${location.name}</span><br>
      <span style="font-size:12px;color:#8C7B6B;">${location.address_full}</span>
    </td></tr>
    <tr><td style="padding:10px 0 6px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <span style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;">Deposit Paid</span><br>
          <span style="font-size:15px;color:#5C1A1A;font-weight:600;">&pound;${deposit}</span>
        </td>
        <td align="right">
          <span style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;">Balance Due on Day</span><br>
          <span style="font-size:15px;color:#2C2420;font-weight:600;">&pound;${balance}</span>
        </td>
      </tr></table>
    </td></tr>
    </table>
  </td></tr>
  </table>`;
}

function buildBookingBoxText(booking: CalBooking, location: CalLocation): string {
  const deposit = booking.deposit_amount ?? 0;
  const balance = Math.max(0, (booking.total_price ?? 0) - deposit);
  return [
    `Treatment:  ${booking.treatment_name}`,
    `Date & Time: ${formatDate(booking.booking_date)} at ${booking.time_slot}`,
    `Location:   ${location.name}, ${location.address_full}`,
    `Deposit paid:    £${deposit}`,
    `Balance due on day: £${balance}`,
  ].join("\n");
}

// Helper: log HTML to console when Resend is not configured
function logEmailPreview(subject: string, to: string, html: string): void {
  console.log(`\n[EMAIL PREVIEW — no RESEND_API_KEY]\nTo: ${to}\nSubject: ${subject}\n${"─".repeat(60)}\n${html}\n${"─".repeat(60)}\n`);
}

// ── Email 1 — Client booking confirmation (trigger: after consent submitted) ──

export async function sendClientConfirmationEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  durationMinutes: number;
  deposit: number;
  balance: number;
  bookingId?: string;
  depositPaid?: boolean;
  whatsapp: string;
  locationName?: string;
  locationAddress?: string;
  formsUrl?: string;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const loc: CalLocation = {
    name: params.locationName ?? "[CLIENT_NAME]",
    address_full: params.locationAddress ?? "[CLIENT_NAME] Clinic",
  };
  const bk: CalBooking = {
    treatment_name: params.treatment,
    booking_date: params.date,
    time_slot: params.time,
    deposit_amount: params.deposit,
    total_price: params.deposit + params.balance,
    duration_minutes: params.durationMinutes,
    id: params.bookingId,
  };
  const googleUrl = buildGoogleCalendarUrl(bk, loc);
  const icsUrl = params.bookingId
    ? `${SITE_URL}/api/calendar/ics?booking=${params.bookingId}`
    : "#";

  const content = `
    <p style="font-size:24px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 6px;">You're booked in ✨</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Hi ${firstName}, your appointment is confirmed. We look forward to seeing you.</p>

    ${buildBookingBox(bk, loc)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="text-align:center;">
      <p style="font-size:12px;color:#8C7B6B;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em;">Add to your calendar</p>
      <a href="${googleUrl}" target="_blank" style="display:inline-block;margin:4px;padding:10px 18px;background:#C9A96E;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:12px;letter-spacing:0.08em;">+ Google Calendar</a>
      <a href="${icsUrl}" style="display:inline-block;margin:4px;padding:10px 18px;background:#5C1A1A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:12px;letter-spacing:0.08em;">+ Apple Calendar</a>
    </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border-left:3px solid #C9A96E;margin:0 0 20px;">
    <tr><td style="padding:16px 20px;">
      <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 10px;">Before your appointment</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;line-height:1.6;">&#10022; Arrive 5 minutes early</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;line-height:1.6;">&#10022; Clean face &mdash; no makeup on treatment area</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;line-height:1.6;">&#10022; Avoid alcohol 24 hours before</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;line-height:1.6;">&#10022; No blood thinners 24hrs before injectables</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;line-height:1.6;">&#10022; Contact us if any medical details change</p>
    </td></tr>
    </table>

    <p style="font-size:12px;color:#8C7B6B;line-height:1.6;margin:0 0 20px;border-top:1px solid #E8DDD3;padding-top:16px;">
      <strong style="color:#5C1A1A;">Cancellation policy:</strong> Please give at least 48 hours notice to cancel or reschedule. Deposits are non-refundable for cancellations under 48 hours or no-shows. To reschedule, WhatsApp us at <a href="https://wa.me/447701298985" style="color:#C9A96E;">+44 7701 298985</a>
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <a href="https://instagram.com/[ClientName]s" style="display:inline-block;margin:0 6px;font-size:11px;color:#C9A96E;text-decoration:none;letter-spacing:0.08em;">@[ClientName]s</a>
      <a href="https://instagram.com/[Client]Facess" style="display:inline-block;margin:0 6px;font-size:11px;color:#C9A96E;text-decoration:none;letter-spacing:0.08em;">@[Client]Facess</a>
      <a href="https://instagram.com/[Client]Nailedd" style="display:inline-block;margin:0 6px;font-size:11px;color:#C9A96E;text-decoration:none;letter-spacing:0.08em;">@[Client]Nailedd</a>
    </td></tr>
    </table>`;

  const subject = `Appointment confirmed: ${params.treatment} — [CLIENT_NAME]`;
  const text = [
    `You're booked in, ${firstName}`,
    "",
    buildBookingBoxText(bk, loc),
    "",
    "Add to Google Calendar: " + googleUrl,
    "Add to Apple Calendar: " + icsUrl,
    "",
    "Before your appointment:",
    "- Arrive 5 minutes early",
    "- Clean face — no makeup on treatment area",
    "- Avoid alcohol 24 hours before",
    "- No blood thinners 24hrs before injectables",
    "- Contact us if any medical details change",
    "",
    "Cancellation policy: Please give at least 48 hours notice to cancel or reschedule.",
    "Deposits are non-refundable for cancellations under 48 hours or no-shows.",
    "To reschedule: WhatsApp +44 7701 298985",
    "",
    PLAIN_FOOTER,
  ].join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html, text });
  } catch (err) {
    console.error("sendClientConfirmationEmail error", err);
  }
}

// ── Email 2 — Admin new booking alert (trigger: after Stripe payment) ─────────

export async function sendAdminNotificationEmail(params: {
  adminEmail: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  treatment: string;
  durationMinutes: number;
  date: string;
  time: string;
  deposit: number;
  depositPaid?: boolean;
  source: string;
  locationName?: string;
  locationAddress?: string;
  bookingId?: string;
}): Promise<void> {
  const dateDisp = params.date ? fmtDateUK(params.date) : "TBC";
  const loc: CalLocation = {
    name: params.locationName ?? "[CLIENT_NAME]",
    address_full: params.locationAddress ?? params.locationName ?? "[CLIENT_NAME] Clinic",
  };
  const bk: CalBooking = {
    treatment_name: params.treatment,
    booking_date: params.date,
    time_slot: params.time,
    deposit_amount: params.deposit,
    total_price: params.deposit,
    duration_minutes: params.durationMinutes,
    id: params.bookingId,
  };
  const portalUrl = `${SITE_URL}/portal.html`;

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 6px;">New Booking Received</p>
    <p style="font-size:13px;color:#8C7B6B;margin:0 0 24px;">A new appointment has been booked and deposit payment received.</p>

    ${buildBookingBox(bk, loc)}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 20px;">
    <tr><td style="padding:16px 24px;">
      <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 12px;">Client Details</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Name:</strong> ${params.clientName}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Email:</strong> <a href="mailto:${params.clientEmail}" style="color:#C9A96E;">${params.clientEmail || "—"}</a></p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Phone:</strong> <a href="tel:${params.clientPhone}" style="color:#C9A96E;">${params.clientPhone || "—"}</a></p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Deposit:</strong> <span style="color:#5C1A1A;font-weight:600;">&pound;${params.deposit} ${params.depositPaid ? "&#x2713; paid" : "pending"}</span></p>
      <p style="font-size:14px;color:#2C2420;margin:8px 0 4px;"><strong>Forms:</strong> <span style="background:#FFF3CD;color:#856404;padding:2px 8px;border-radius:4px;font-size:12px;">Pending</span></p>
      <p style="font-size:12px;color:#8C7B6B;margin:4px 0;">Booked via ${params.source} &middot; ${dateDisp} at ${params.time}</p>
    </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <a href="${portalUrl}" style="display:inline-block;padding:12px 28px;background:#5C1A1A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;letter-spacing:0.1em;">View in admin portal &rarr;</a>
    </td></tr>
    </table>`;

  const subject = `New booking: ${params.clientName} — ${params.treatment}`;
  const text = [
    "New Booking Received",
    "",
    buildBookingBoxText(bk, loc),
    "",
    "Client Details:",
    `Name:   ${params.clientName}`,
    `Email:  ${params.clientEmail || "—"}`,
    `Phone:  ${params.clientPhone || "—"}`,
    `Deposit: £${params.deposit} ${params.depositPaid ? "(paid)" : "(pending)"}`,
    `Source: ${params.source}`,
    "",
    `Admin portal: ${portalUrl}`,
    "",
    PLAIN_FOOTER,
  ].join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.adminEmail) {
    logEmailPreview(subject, params.adminEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.adminEmail, subject, html, text });
  } catch (err) {
    console.error("sendAdminNotificationEmail error", err);
  }
}

// ── Email 3 — 24hr reminder (trigger: hourly cron) ───────────────────────────

export async function sendReminderEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  whatsapp: string;
  locationName?: string;
  locationAddress?: string;
  durationMinutes?: number;
  bookingId?: string;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const loc: CalLocation = {
    name: params.locationName ?? "[CLIENT_NAME]",
    address_full: params.locationAddress ?? params.locationName ?? "[CLIENT_NAME] Clinic",
  };
  const bk: CalBooking = {
    treatment_name: params.treatment,
    booking_date: params.date,
    time_slot: params.time,
    duration_minutes: params.durationMinutes ?? 60,
    id: params.bookingId,
  };

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 6px;">Your appointment is tomorrow ✨</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Hi ${firstName}, just a friendly reminder about your upcoming appointment.</p>

    ${buildBookingBox(bk, loc)}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border-left:3px solid #C9A96E;margin:0 0 20px;">
    <tr><td style="padding:16px 20px;">
      <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 10px;">Your pre-appointment checklist</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;">&#10022; Clean face, no makeup on treatment area</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;">&#10022; Avoid alcohol tonight</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;">&#10022; Arrive 5 minutes early</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;">&#10022; Bring a valid ID</p>
    </td></tr>
    </table>

    <p style="font-size:13px;color:#8C7B6B;margin:0 0 16px;line-height:1.6;">Need to cancel or reschedule? Please let us know as soon as possible. <a href="https://wa.me/447701298985" style="color:#C9A96E;text-decoration:none;">WhatsApp us &rarr;</a></p>`;

  const subject = `Reminder: your ${params.treatment} appointment is tomorrow`;
  const text = [
    `Hi ${firstName},`,
    "",
    "Just a friendly reminder about your appointment tomorrow.",
    "",
    buildBookingBoxText(bk, loc),
    "",
    "Pre-appointment checklist:",
    "- Clean face, no makeup on treatment area",
    "- Avoid alcohol tonight",
    "- Arrive 5 minutes early",
    "- Bring a valid ID",
    "",
    "Need to cancel or reschedule? WhatsApp us: https://wa.me/447701298985",
    "",
    PLAIN_FOOTER,
  ].join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html, text });
  } catch (err) {
    console.error("sendReminderEmail error", err);
  }
}

// ── Email 4 — Cancellation (trigger: admin sets status → cancelled) ───────────

export async function sendCancellationEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  whatsapp: string;
  locationName?: string;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const locationName = params.locationName ?? "[CLIENT_NAME]";

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 6px;">Appointment cancelled</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Hi ${firstName}, your appointment has been cancelled. We hope to see you again soon.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 20px;">
    <tr><td style="padding:16px 24px;">
      <p style="font-size:12px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Cancelled appointment</p>
      <p style="font-size:15px;color:#5C1A1A;font-family:Georgia,serif;margin:0 0 4px;text-decoration:line-through;">${params.treatment}</p>
      <p style="font-size:13px;color:#8C7B6B;margin:0;">${formatDate(params.date)} at ${params.time} &middot; ${locationName}</p>
    </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr><td align="center">
      <a href="https://wa.me/447701298985" style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;letter-spacing:0.1em;">Rebook via WhatsApp &rarr;</a>
    </td></tr>
    </table>`;

  const subject = `Your [CLIENT_NAME] appointment has been cancelled`;
  const text = [
    `Hi ${firstName},`,
    "",
    "Your appointment has been cancelled.",
    "",
    `Treatment: ${params.treatment}`,
    `Date & Time: ${formatDate(params.date)} at ${params.time}`,
    `Location: ${locationName}`,
    "",
    "To rebook, WhatsApp us: https://wa.me/447701298985",
    "",
    PLAIN_FOOTER,
  ].join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html, text });
  } catch (err) {
    console.error("sendCancellationEmail error", err);
  }
}

// ── Email 5a — Reschedule notification ──────────────────────────────────────

export async function sendRescheduleEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  newDate: string;
  newTime: string;
  whatsapp?: string;
  locationName?: string;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const locationName = params.locationName ?? "[CLIENT_NAME]";
  const whatsapp = params.whatsapp ?? "447701298985";

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 6px;">Appointment rescheduled</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Hi ${firstName}, your appointment has been rescheduled. Here are your new details.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 20px;">
    <tr><td style="padding:16px 24px;">
      <p style="font-size:12px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">New appointment details</p>
      <p style="font-size:15px;color:#5C1A1A;font-family:Georgia,serif;margin:0 0 4px;">${params.treatment}</p>
      <p style="font-size:13px;color:#8C7B6B;margin:0;">${formatDate(params.newDate)} at ${params.newTime} &middot; ${locationName}</p>
    </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr><td align="center">
      <a href="https://wa.me/${whatsapp}" style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;letter-spacing:0.1em;">Questions? WhatsApp us &rarr;</a>
    </td></tr>
    </table>`;

  const subject = `Your [CLIENT_NAME] appointment has been rescheduled`;
  const text = [
    `Hi ${firstName},`,
    "",
    "Your appointment has been rescheduled.",
    "",
    `Treatment: ${params.treatment}`,
    `New date & time: ${formatDate(params.newDate)} at ${params.newTime}`,
    `Location: ${locationName}`,
    "",
    `Questions? WhatsApp us: https://wa.me/${whatsapp}`,
    "",
    PLAIN_FOOTER,
  ].join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html, text });
  } catch (err) {
    console.error("sendRescheduleEmail error", err);
  }
}

// ── Email 5 — Forms reminder (trigger: cron — forms pending + appt within 48h) ─

export async function sendFormsReminderEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  bookingId: string;
  locationName?: string;
  locationAddress?: string;
  durationMinutes?: number;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const loc: CalLocation = {
    name: params.locationName ?? "[CLIENT_NAME]",
    address_full: params.locationAddress ?? params.locationName ?? "[CLIENT_NAME] Clinic",
  };
  const bk: CalBooking = {
    treatment_name: params.treatment,
    booking_date: params.date,
    time_slot: params.time,
    duration_minutes: params.durationMinutes ?? 60,
    id: params.bookingId,
  };
  const formsUrl = `${SITE_URL}/forms.html?booking=${params.bookingId}`;

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 6px;">Your forms are still needed</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Hi ${firstName}, your appointment is coming up but we still need your forms. It only takes a couple of minutes.</p>

    ${buildBookingBox(bk, loc)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr><td align="center">
      <a href="${formsUrl}" style="display:inline-block;padding:14px 32px;background:#5C1A1A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:14px;letter-spacing:0.1em;">Complete your forms &rarr;</a>
      <p style="font-size:11px;color:#8C7B6B;margin:8px 0 0;">Medical intake and consent form</p>
    </td></tr>
    </table>`;

  const subject = `Forms still needed for your appointment`;
  const text = [
    `Hi ${firstName},`,
    "",
    "Your appointment is coming up but we still need your forms. It only takes a couple of minutes.",
    "",
    buildBookingBoxText(bk, loc),
    "",
    "Complete your forms here: " + formsUrl,
    "",
    PLAIN_FOOTER,
  ].join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html, text });
  } catch (err) {
    console.error("sendFormsReminderEmail error", err);
  }
}

// ── Consultation confirmation (kept for backwards compat) ─────────────────────

export async function sendConsultationConfirmationEmail(params: {
  clientEmail: string;
  clientName: string;
  date: string;
  time: string;
  whatsapp: string;
  locationName?: string;
  locationAddress?: string;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const dateStr = params.date ? formatDate(params.date) : "To be confirmed";
  const wa = params.whatsapp || "available on request";
  const locationName = params.locationName ?? "[CLIENT_NAME]";
  const locationAddress = params.locationAddress ?? "[CLIENT_NAME] Clinic";

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 6px;">Looking forward to meeting you, ${firstName}</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Your consultation is booked. This is your first step towards your aesthetic goals.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:20px 0;">
    <tr><td style="padding:20px 24px;">
      <p style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Aesthetic Consultation</p>
      <p style="font-size:16px;color:#5C1A1A;font-family:Georgia,serif;margin:0 0 8px;">${dateStr} at ${params.time}</p>
      <p style="font-size:13px;color:#8C7B6B;margin:0;">${locationName}, ${locationAddress}</p>
      <p style="font-size:13px;color:#5C1A1A;font-weight:600;margin:12px 0 0;">&pound;25 consultation fee</p>
    </td></tr>
    </table>
    <p style="font-size:13px;color:#8C7B6B;margin:0 0 8px;">Questions before your visit? <a href="https://wa.me/${wa.replace(/\s/g, "")}" style="color:#C9A96E;text-decoration:none;">WhatsApp us</a></p>
    <p style="font-size:12px;color:#8C7B6B;margin:0;font-style:italic;">Please arrive 5 minutes early. We look forward to seeing you.</p>`;

  const subject = `Consultation confirmed — [CLIENT_NAME] ${locationName}`;
  const text = [
    `Hi ${firstName},`,
    "",
    "Your consultation is confirmed.",
    "",
    `Date & Time: ${dateStr} at ${params.time}`,
    `Location: ${locationName}, ${locationAddress}`,
    `Consultation fee: £25`,
    "",
    `Questions? WhatsApp us: https://wa.me/${wa.replace(/\s/g, "")}`,
    "Please arrive 5 minutes early.",
    "",
    PLAIN_FOOTER,
  ].join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html, text });
  } catch (err) {
    console.error("sendConsultationConfirmationEmail error", err);
  }
}

// ── Consultation admin notification (kept for backwards compat) ───────────────

export async function sendConsultationAdminEmail(params: {
  adminEmail: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientDOB: string;
  clientNotes: string;
  treatmentInterest: string;
  date: string;
  time: string;
  locationName?: string;
}): Promise<void> {
  const dateDisp = params.date ? fmtDateUK(params.date) : "TBC";
  const locationName = params.locationName ?? "[CLIENT_NAME]";

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 6px;">New consultation booked</p>
    <p style="font-size:13px;color:#8C7B6B;margin:0 0 24px;">A new aesthetic consultation has been scheduled.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 20px;">
    <tr><td style="padding:16px 24px;">
      <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 12px;">Client Details</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Name:</strong> ${params.clientName}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Email:</strong> <a href="mailto:${params.clientEmail}" style="color:#C9A96E;">${params.clientEmail || "—"}</a></p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Phone:</strong> <a href="tel:${params.clientPhone}" style="color:#C9A96E;">${params.clientPhone || "—"}</a></p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>DOB:</strong> ${params.clientDOB || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Treatment interest:</strong> ${params.treatmentInterest || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Skin concerns:</strong> ${params.clientNotes || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:8px 0 0;"><strong>Date:</strong> ${dateDisp} at ${params.time} &middot; ${locationName}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Fee:</strong> <span style="color:#5C1A1A;font-weight:600;">&pound;25 &#x2713;</span></p>
    </td></tr>
    </table>`;

  const subject = `New consultation — ${params.clientName} — ${dateDisp} at ${params.time} [${locationName}]`;
  const text = [
    "New Consultation Booked",
    "",
    `Name:               ${params.clientName}`,
    `Email:              ${params.clientEmail || "—"}`,
    `Phone:              ${params.clientPhone || "—"}`,
    `DOB:                ${params.clientDOB || "—"}`,
    `Treatment interest: ${params.treatmentInterest || "—"}`,
    `Skin concerns:      ${params.clientNotes || "—"}`,
    `Date:               ${dateDisp} at ${params.time}`,
    `Location:           ${locationName}`,
    `Fee: £25 paid`,
    "",
    PLAIN_FOOTER,
  ].join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.adminEmail) {
    logEmailPreview(subject, params.adminEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.adminEmail, subject, html, text });
  } catch (err) {
    console.error("sendConsultationAdminEmail error", err);
  }
}

// ── Training enquiry emails ────────────────────────────────────────────────────

export async function sendEnquiryEmails(params: {
  adminEmail: string;
  name: string;
  email: string;
  phone: string;
  courseName: string;
  locationLabel: string;
  experienceLevel?: string | null;
  message?: string | null;
  enquiryId?: string;
}): Promise<void> {
  const firstName = params.name.split(" ")[0] ?? params.name;
  const refCode = `ENQ-${(params.enquiryId ?? "").slice(0, 8).toUpperCase()}`;
  const resend = getResend();
  const submittedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });

  const promises: Promise<unknown>[] = [];

  // EMAIL A — Admin alert
  if (params.adminEmail) {
    const adminSubject = `New training enquiry: ${params.name} — ${params.courseName}`;
    const adminContent = `
      <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 16px;">New Training Enquiry Received</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 24px;">
        <tr><td style="padding:20px 24px;">
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Name:</strong> ${params.name}</p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Email:</strong> <a href="mailto:${params.email}" style="color:#C9A96E;">${params.email}</a></p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Phone:</strong> <a href="tel:${params.phone}" style="color:#C9A96E;">${params.phone}</a></p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Course:</strong> ${params.courseName}</p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Experience:</strong> ${params.experienceLevel || "—"}</p>
          ${params.message ? `<p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Message:</strong> ${params.message}</p>` : ""}
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Submitted:</strong> ${submittedAt}</p>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
        <tr>
          <td style="padding-right:8px;">
            <a href="https://wa.me/${params.phone.replace(/\D/g, "")}" style="display:inline-block;background:#C9A96E;color:#FFFFFF;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.1em;padding:12px 24px;text-decoration:none;border-radius:4px;">Reply via WhatsApp</a>
          </td>
          <td>
            <a href="/portal.html" style="display:inline-block;background:#5C1A1A;color:#FFFFFF;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.1em;padding:12px 24px;text-decoration:none;border-radius:4px;">View in portal</a>
          </td>
        </tr>
      </table>`;
    const adminText = [
      "New Training Enquiry",
      "",
      `Name:       ${params.name}`,
      `Email:      ${params.email}`,
      `Phone:      ${params.phone}`,
      `Course:     ${params.courseName}`,
      `Experience: ${params.experienceLevel || "—"}`,
      params.message ? `Message:    ${params.message}` : "",
      `Submitted:  ${submittedAt}`,
      "",
      PLAIN_FOOTER,
    ].filter(Boolean).join("\n");
    const adminHtml = buildEmail(adminContent, adminSubject);
    if (!resend) {
      logEmailPreview(adminSubject, params.adminEmail, adminHtml);
    } else {
      promises.push(
        resend.emails
          .send({ from: FROM, to: params.adminEmail, subject: adminSubject, html: adminHtml, text: adminText })
          .catch((e: unknown) => console.error("sendEnquiryEmails admin error", e)),
      );
    }
  }

  // EMAIL B — Auto-reply to enquirer
  if (params.email) {
    const clientSubject = `Your enquiry has been received — [Client] Academy`;
    const clientContent = `
      <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 16px;">We've received your enquiry ✨</p>
      <p style="font-size:15px;color:#2C2420;margin:0 0 8px;">Hi ${firstName},</p>
      <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Thank you for your interest in the <strong style="color:#5C1A1A;">${params.courseName}</strong>. Eva will be in touch within 24 hours.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 24px;">
        <tr><td style="padding:20px 24px;">
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Course:</strong> ${params.courseName}</p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Location:</strong> ${params.locationLabel}</p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Reference:</strong> ${refCode}</p>
        </td></tr>
      </table>
      <p style="font-size:14px;color:#8C7B6B;margin:0 0 16px;">In the meantime, feel free to reach out:</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td>
            <a href="https://wa.me/447701298985" style="display:inline-block;background:#C9A96E;color:#FFFFFF;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.1em;padding:12px 28px;text-decoration:none;border-radius:4px;">WhatsApp us</a>
          </td>
        </tr>
      </table>
      <p style="font-size:13px;color:#8C7B6B;margin:0;">
        Instagram: <a href="https://instagram.com/[ClientName]s" style="color:#C9A96E;">@[ClientName]s</a> &nbsp;·&nbsp; <a href="https://instagram.com/[Client]Facess" style="color:#C9A96E;">@[Client]Facess</a>
      </p>`;
    const clientText = [
      `Hi ${firstName},`,
      "",
      `Thank you for your interest in the ${params.courseName}. Eva will be in touch within 24 hours.`,
      "",
      `Course:    ${params.courseName}`,
      `Location:  ${params.locationLabel}`,
      `Reference: ${refCode}`,
      "",
      "Questions? WhatsApp us: https://wa.me/447701298985",
      "",
      PLAIN_FOOTER,
    ].join("\n");
    const clientHtml = buildEmail(clientContent, clientSubject);
    if (!resend) {
      logEmailPreview(clientSubject, params.email, clientHtml);
    } else {
      promises.push(
        resend.emails
          .send({ from: FROM, to: params.email, subject: clientSubject, html: clientHtml, text: clientText })
          .catch((e: unknown) => console.error("sendEnquiryEmails client error", e)),
      );
    }
  }

  await Promise.all(promises);
}

// ── Email: Webhook failure alert (trigger: catch in payment_intent.succeeded) ──

export async function sendWebhookAlertEmail(params: {
  adminEmail: string;
  paymentIntentId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  treatment: string;
  bookingDate: string;
  bookingTime: string;
  bookingId: string;
  locationId: string;
  error: string;
}): Promise<void> {
  const formsLink = params.bookingId
    ? `${SITE_URL}/forms.html?booking=${params.bookingId}`
    : "— booking ID missing —";

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#C62828;margin:0 0 6px;">&#9888; Action Required — Webhook Error</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 20px;">A payment was received from Stripe but the booking creation failed. <strong>Manual action needed.</strong></p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3CD;border-radius:8px;border-left:4px solid #C9A96E;margin:0 0 20px;">
    <tr><td style="padding:16px 20px;">
      <p style="font-size:12px;color:#856404;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;font-weight:700;">Error Detail</p>
      <p style="font-size:13px;color:#2C2420;font-family:monospace;margin:0;word-break:break-all;">${params.error}</p>
    </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 20px;">
    <tr><td style="padding:20px 24px;">
      <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 12px;">Payment Details</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Payment Intent:</strong> <code style="font-size:12px;background:#e8e0d8;padding:2px 6px;border-radius:3px;">${params.paymentIntentId}</code></p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Client:</strong> ${params.clientName || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Email:</strong> <a href="mailto:${params.clientEmail}" style="color:#C9A96E;">${params.clientEmail || "—"}</a></p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Phone:</strong> ${params.clientPhone || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Treatment:</strong> ${params.treatment || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Date:</strong> ${params.bookingDate || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Time:</strong> ${params.bookingTime || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:8px 0 0;"><strong>Forms Link:</strong> <a href="${formsLink}" style="color:#C9A96E;word-break:break-all;">${formsLink}</a></p>
    </td></tr>
    </table>

    <p style="font-size:13px;color:#5C1A1A;font-weight:600;margin:0 0 8px;">What to do:</p>
    <ol style="font-size:13px;color:#2C2420;padding-left:20px;margin:0 0 20px;line-height:1.8;">
      <li>Check the Stripe dashboard — the payment <strong>was</strong> received</li>
      <li>Open the admin portal and manually create a booking for this client</li>
      <li>Use the "Send to Client" button to send the forms link</li>
      <li>WhatsApp the client if needed: <a href="https://wa.me/${params.clientPhone?.replace(/[^0-9]/g, '')}" style="color:#C9A96E;">+${params.clientPhone || "unknown"}</a></li>
    </ol>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <a href="${SITE_URL}/portal.html" style="display:inline-block;padding:12px 28px;background:#5C1A1A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;letter-spacing:0.1em;">Open Admin Portal &rarr;</a>
    </td></tr>
    </table>`;

  const subject = `ACTION NEEDED — Payment received but booking failed (${params.clientName || params.paymentIntentId})`;
  const text = [
    "ACTION REQUIRED — Webhook Error",
    "",
    `Error: ${params.error}`,
    "",
    `Payment Intent: ${params.paymentIntentId}`,
    `Client: ${params.clientName || "—"}`,
    `Email: ${params.clientEmail || "—"}`,
    `Phone: ${params.clientPhone || "—"}`,
    `Treatment: ${params.treatment || "—"}`,
    `Date: ${params.bookingDate || "—"}`,
    `Time: ${params.bookingTime || "—"}`,
    "",
    `Forms link: ${formsLink}`,
    "",
    "Action: Manually create this booking in the admin portal and send the client their forms link.",
    "",
    `Portal: ${SITE_URL}/portal.html`,
  ].join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend) {
    logEmailPreview(subject, params.adminEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.adminEmail, subject, html, text });
  } catch (err) {
    console.error("sendWebhookAlertEmail error", err);
  }
}

// ── Email: Manual "Send Forms Link" (trigger: admin clicks button in portal) ──

export async function sendFormsLinkEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  bookingId: string;
  token?: string;
  locationName?: string;
  locationAddress?: string;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  // Use token-based URL when available; fall back to booking-id for legacy links
  const formsUrl = params.token
    ? `${SITE_URL}/forms.html?token=${params.token}`
    : `${SITE_URL}/forms.html?booking=${params.bookingId}`;
  const dateDisp = params.date ? formatDate(params.date) : "your upcoming appointment";
  const timeDisp = params.time ? ` at ${params.time.slice(0, 5)}` : "";

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 6px;">Your pre-appointment forms</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Hi ${firstName}, please complete your health and consent forms before your appointment. This only takes a few minutes.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 24px;">
    <tr><td style="padding:20px 24px;">
      <p style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Your appointment</p>
      <p style="font-size:16px;color:#5C1A1A;font-family:Georgia,serif;margin:0 0 4px;">${params.treatment}</p>
      <p style="font-size:14px;color:#2C2420;font-weight:600;margin:0;">${dateDisp}${timeDisp}</p>
      ${params.locationName ? `<p style="font-size:13px;color:#8C7B6B;margin:4px 0 0;">${params.locationName}</p>` : ""}
    </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr><td align="center">
      <a href="${formsUrl}" style="display:inline-block;padding:14px 36px;background:#5C1A1A;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.06em;">Complete Your Forms &rarr;</a>
    </td></tr>
    </table>

    <p style="font-size:12px;color:#8C7B6B;line-height:1.6;margin:0 0 8px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${formsUrl}" style="color:#C9A96E;word-break:break-all;">${formsUrl}</a>
    </p>
    <p style="font-size:12px;color:#8C7B6B;line-height:1.6;margin:0;">
      If you have any questions, please WhatsApp us at <a href="https://wa.me/447701298985" style="color:#C9A96E;">+44 7701 298985</a>
    </p>`;

  const subject = `Action required: complete your forms — ${params.treatment} at [CLIENT_NAME]`;
  const text = [
    `Hi ${firstName},`,
    "",
    "Please complete your pre-appointment health and consent forms before your appointment.",
    "",
    `Treatment: ${params.treatment}`,
    `Date: ${dateDisp}${timeDisp}`,
    params.locationName ? `Location: ${params.locationName}` : "",
    "",
    "Complete your forms here:",
    formsUrl,
    "",
    "If you have any questions, WhatsApp us: https://wa.me/447701298985",
    "",
    PLAIN_FOOTER,
  ].filter(Boolean).join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html, text });
  } catch (err) {
    console.error("sendFormsLinkEmail error", err);
    throw err;
  }
}

// ── Email: Forms completed — owner notification ───────────────────────────────

export async function sendFormsCompletedOwnerEmail(params: {
  ownerEmail: string;
  clientName: string;
  clientEmail: string;
  treatment: string;
  date: string;
  time: string;
  bookingId: string;
  locationName?: string;
}): Promise<void> {
  const dateDisp = params.date ? formatDate(params.date) : "—";
  const timeDisp = params.time ? params.time.slice(0, 5) : "—";
  const portalUrl = `${SITE_URL}/portal.html#bookings`;

  const subject = `Forms completed — ${params.clientName} (${params.treatment})`;

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1A1A;margin:0 0 6px;">Forms completed</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">A client has submitted their medical history and consent form.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 24px;">
    <tr><td style="padding:20px 24px;">
      <p style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">Booking details</p>
      <p style="font-size:15px;color:#5C1A1A;font-family:Georgia,serif;font-weight:bold;margin:0 0 6px;">${params.clientName}</p>
      <p style="font-size:13px;color:#2C2420;margin:0 0 4px;">${params.treatment}</p>
      <p style="font-size:13px;color:#2C2420;margin:0 0 4px;">${dateDisp} at ${timeDisp}${params.locationName ? ` &mdash; ${params.locationName}` : ""}</p>
      ${params.clientEmail ? `<p style="font-size:13px;color:#8C7B6B;margin:4px 0 0;">${params.clientEmail}</p>` : ""}
    </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr><td align="center">
      <a href="${portalUrl}" style="display:inline-block;padding:14px 36px;background:#5C1A1A;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.06em;">View in Portal &rarr;</a>
    </td></tr>
    </table>

    <p style="font-size:12px;color:#8C7B6B;line-height:1.6;margin:0;">
      Open the booking in your admin portal to review the submitted forms.
    </p>`;

  const text = [
    `Forms completed — ${params.clientName}`,
    "",
    `Client: ${params.clientName} (${params.clientEmail})`,
    `Treatment: ${params.treatment}`,
    `Date: ${dateDisp} at ${timeDisp}`,
    params.locationName ? `Location: ${params.locationName}` : "",
    "",
    `View in portal: ${portalUrl}`,
    "",
    PLAIN_FOOTER,
  ].filter(Boolean).join("\n");

  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend) {
    logEmailPreview(subject, params.ownerEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.ownerEmail, subject, html, text });
  } catch (err) {
    console.error("sendFormsCompletedOwnerEmail error", err);
  }
}
```

---

# 5. nur-schema.sql (full schema)

```sql
-- ============================================================
-- NUR & CO AESTHETICS — Premium Plus Schema (single location)
-- Target: Supabase project nur-andco-aesthetix (kgbgqukgsfcrpkdxiptx)
-- Idempotent: safe to re-run
-- Last edited: 27 Apr 2026
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

create table if not exists locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  address text,
  address_full text,
  postcode text,
  phone text,
  email text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists treatments (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  name text not null,
  category text,
  description text,
  duration_minutes integer not null default 30,
  price numeric(10,2) not null default 0,
  deposit_amount numeric(10,2) not null default 20,
  deposit_type text default 'fixed',
  requires_medical_form boolean default false,
  requires_consent_form boolean default false,
  short_description text,
  active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);
create index if not exists idx_treatments_location on treatments(location_id);
create index if not exists idx_treatments_active on treatments(active);

create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text,
  phone text,
  date_of_birth date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete restrict,
  treatment_id uuid references treatments(id) on delete restrict,
  client_id uuid references clients(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  booking_date date not null,
  time_slot time not null,
  duration_minutes integer not null default 30,
  status text default 'pending',
  deposit_paid boolean default false,
  stripe_payment_intent_id text,
  google_calendar_event_id text,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_bookings_date on bookings(booking_date);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_email on bookings(client_email);

-- =====================================================
-- 2. AVAILABILITY & SCHEDULING
-- =====================================================

create table if not exists availability_settings (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_open boolean default true,
  open_time time,
  close_time time,
  slot_duration_minutes integer default 30,
  buffer_minutes integer default 15,
  unique(location_id, day_of_week)
);

create table if not exists blocked_dates (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  blocked_date date not null,
  reason text,
  created_at timestamptz default now(),
  unique(location_id, blocked_date)
);

create table if not exists blocked_slots (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  day_of_week integer check (day_of_week between 0 and 6),
  all_days boolean default false,
  start_time time not null,
  end_time time not null,
  label text,
  created_at timestamptz default now()
);
create index if not exists idx_blocked_slots_location on blocked_slots(location_id, day_of_week);

-- =====================================================
-- 3. PREMIUM PLUS — Forms
-- =====================================================

create table if not exists medical_forms (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  client_email text not null,
  client_name text not null,
  dob date,
  address text,
  gp_name text,
  gp_practice text,
  conditions jsonb default '{}',
  medications text,
  allergies text,
  pregnancy_status text,
  additional_notes text,
  signature_data text,
  ip_address text,
  submitted_at timestamptz default now()
);
create index if not exists idx_medical_forms_booking on medical_forms(booking_id);
create index if not exists idx_medical_forms_email on medical_forms(client_email);

create table if not exists consent_forms (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  client_email text not null,
  client_name text not null,
  treatment text,
  consents jsonb default '{}',
  additional_notes text,
  signature_data text,
  ip_address text,
  signed_at timestamptz default now()
);
create index if not exists idx_consent_forms_booking on consent_forms(booking_id);

create table if not exists form_tokens (
  token text primary key,
  booking_id uuid references bookings(id) on delete cascade,
  expires_at timestamptz not null,
  submitted_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_form_tokens_booking on form_tokens(booking_id);

-- =====================================================
-- 4. PREMIUM PLUS — Subscriptions (Nur's brief)
-- =====================================================

create table if not exists subscription_tiers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  price_monthly numeric(10,2) not null,
  cadence text default 'monthly',
  treatments_included jsonb default '[]',
  stripe_price_id text,
  display_order integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete restrict,
  tier_id uuid references subscription_tiers(id) on delete restrict,
  status text default 'pending',
  start_date date,
  next_billing_date date,
  stripe_customer_id text,
  stripe_subscription_id text,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_subscriptions_client on subscriptions(client_id);
create index if not exists idx_subscriptions_status on subscriptions(status);

-- =====================================================
-- 5. ELITE+ — Google Calendar
-- =====================================================

create table if not exists google_calendar_tokens (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  calendar_id text,
  updated_at timestamptz default now()
);

-- =====================================================
-- 6. ADMIN & PORTAL
-- =====================================================

create table if not exists admin_users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  active boolean default true,
  last_login timestamptz,
  created_at timestamptz default now()
);

create table if not exists portal_kv (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

create table if not exists enquiries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null default '',
  phone text default '',
  message text default '',
  source text default 'contact_form',
  status text default 'new',
  created_at timestamptz default now()
);

-- =====================================================
-- 7. RLS
-- =====================================================

alter table locations             enable row level security;
alter table treatments            enable row level security;
alter table clients               enable row level security;
alter table bookings              enable row level security;
alter table availability_settings enable row level security;
alter table blocked_dates         enable row level security;
alter table blocked_slots         enable row level security;
alter table medical_forms         enable row level security;
alter table consent_forms         enable row level security;
alter table form_tokens           enable row level security;
alter table subscription_tiers    enable row level security;
alter table subscriptions         enable row level security;
alter table google_calendar_tokens enable row level security;
alter table admin_users           enable row level security;
alter table portal_kv             enable row level security;
alter table enquiries             enable row level security;

drop policy if exists "locations_anon_read" on locations;
create policy "locations_anon_read" on locations
  for select to anon using (active = true);

drop policy if exists "treatments_anon_read" on treatments;
create policy "treatments_anon_read" on treatments
  for select to anon using (active = true);

drop policy if exists "subscription_tiers_anon_read" on subscription_tiers;
create policy "subscription_tiers_anon_read" on subscription_tiers
  for select to anon using (active = true);

drop policy if exists "availability_anon_read" on availability_settings;
create policy "availability_anon_read" on availability_settings
  for select to anon using (true);

drop policy if exists "blocked_dates_anon_read" on blocked_dates;
create policy "blocked_dates_anon_read" on blocked_dates
  for select to anon using (true);

drop policy if exists "blocked_slots_anon_read" on blocked_slots;
create policy "blocked_slots_anon_read" on blocked_slots
  for select to anon using (true);

drop policy if exists "bookings_anon_insert" on bookings;
create policy "bookings_anon_insert" on bookings
  for insert to anon with check (true);

drop policy if exists "medical_forms_anon_insert" on medical_forms;
create policy "medical_forms_anon_insert" on medical_forms
  for insert to anon with check (true);

drop policy if exists "consent_forms_anon_insert" on consent_forms;
create policy "consent_forms_anon_insert" on consent_forms
  for insert to anon with check (true);

drop policy if exists "enquiries_anon_insert" on enquiries;
create policy "enquiries_anon_insert" on enquiries
  for insert to anon with check (true);

-- =====================================================
-- 8. SEED — Nur's location & default availability
-- =====================================================

insert into locations (name, slug, address, postcode, active)
values ('Nottingham', 'nur-and-co', 'Nottingham, UK', null, true)
on conflict (slug) do nothing;

do $$
declare
  loc_id uuid;
begin
  select id into loc_id from locations where slug = 'nur-and-co';
  if loc_id is null then return; end if;

  insert into availability_settings (location_id, day_of_week, is_open, open_time, close_time, slot_duration_minutes, buffer_minutes)
  values
    (loc_id, 0, false, null,    null,    30, 15),
    (loc_id, 1, true,  '09:00', '18:00', 30, 15),
    (loc_id, 2, true,  '09:00', '18:00', 30, 15),
    (loc_id, 3, true,  '09:00', '18:00', 30, 15),
    (loc_id, 4, true,  '09:00', '18:00', 30, 15),
    (loc_id, 5, true,  '09:00', '18:00', 30, 15),
    (loc_id, 6, true,  '09:00', '18:00', 30, 15)
  on conflict (location_id, day_of_week) do nothing;
end $$;

-- ============================================================
-- END
-- ============================================================

-- =====================================================
-- 9. GRANTS (Postgres role permissions, separate from RLS)
-- =====================================================
-- IMPORTANT: Tables created via SQL Editor don't auto-grant
-- table ACLs to anon/authenticated/service_role. Without these
-- grants, queries fail with code 42501 "permission denied"
-- BEFORE RLS even runs. RLS still controls actual access; these
-- grants just let the role's query reach the RLS check.
--
-- This matches what Supabase's dashboard table-creator does.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Default privileges for any tables added later
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
```

---

# 6. Bookings table CREATE (extracted)

```sql
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete restrict,
  treatment_id uuid references treatments(id) on delete restrict,
  client_id uuid references clients(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  booking_date date not null,
  time_slot time not null,
  duration_minutes integer not null default 30,
  status text default 'pending',
  deposit_paid boolean default false,
  stripe_payment_intent_id text,
  google_calendar_event_id text,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_bookings_date on bookings(booking_date);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_email on bookings(client_email);

-- =====================================================
-- 2. AVAILABILITY & SCHEDULING
-- =====================================================

create table if not exists availability_settings (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_open boolean default true,
  open_time time,
  close_time time,
  slot_duration_minutes integer default 30,
  buffer_minutes integer default 15,
  unique(location_id, day_of_week)
);

create table if not exists blocked_dates (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  blocked_date date not null,
  reason text,
  created_at timestamptz default now(),
  unique(location_id, blocked_date)
);

create table if not exists blocked_slots (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  day_of_week integer check (day_of_week between 0 and 6),
```
