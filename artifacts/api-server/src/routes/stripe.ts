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
): Promise<{ id: string | null; durationMinutes: number; price: number }> {
  if (!name || !locationId) return { id: null, durationMinutes: 30, price: 0 };
  try {
    const { data } = await supabaseAdmin
      .from("treatments")
      .select("id, duration_minutes, price")
      .eq("location_id", locationId)
      .eq("name", name)
      .single();
    if (data) return { id: data.id, durationMinutes: Number(data.duration_minutes ?? 30), price: Number(data.price ?? 0) };
  } catch { /* fall through */ }
  return { id: null, durationMinutes: 30, price: 0 };
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
  { handle: "@StarrFacess",      label: "Face Treatments", url: "https://instagram.com/StarrFacess" },
  { handle: "@StarrAestheticss", label: "Aesthetics",       url: "https://instagram.com/StarrAestheticss" },
  { handle: "@StarrSuitess",     label: "The Suite",        url: "https://instagram.com/StarrSuitess" },
  { handle: "@StarrNailedd",     label: "Nails",            url: "https://instagram.com/StarrNailedd" },
];
const TT_ACCOUNTS_DEFAULT = [
  { handle: "@StarrFacess",      label: "Face Treatments", url: "https://tiktok.com/@StarrFacess" },
  { handle: "@StarrAestheticss", label: "Aesthetics",       url: "https://tiktok.com/@StarrAestheticss" },
  { handle: "@StarrSuitess",     label: "The Suite",        url: "https://tiktok.com/@StarrSuitess" },
  { handle: "@StarrNailedd",     label: "Nails",            url: "https://tiktok.com/@StarrNailedd" },
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
  if (locationId) {
    const info = await getTreatmentInfo(treatment, locationId);
    treatmentPrice = info.price;
    durationMinutes = info.durationMinutes;
  }

  if (!treatmentPrice && treatment !== "In-Person Consultation" && treatment !== "Virtual Consultation") {
    return res.status(400).json({ error: "Unknown treatment. Please refresh and try again." });
  }

  const depSettings = locationId
    ? await getDepositSettings(locationId)
    : { depositInjectables: 0.10, depositOther: 0.10 };
  const depositAmountPence = Math.round(getDepositAmount(treatment, depSettings) * 100);

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
