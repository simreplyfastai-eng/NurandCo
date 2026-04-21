// STRIPE KEYS — add to Replit Secrets before going live
// STRIPE_SECRET_KEY=sk_live_...
// STRIPE_PUBLISHABLE_KEY=pk_live_...
// STRIPE_WEBHOOK_SECRET=whsec_...

import { Router } from "express";
import Stripe from "stripe";
import { supabaseAdmin } from "../lib/supabase";
import { sendClientConfirmationEmail, sendAdminNotificationEmail } from "../lib/email";
import { upsertClientFromBooking } from "./clients";
import { getDepositAmount } from "../lib/treatments";
import { ukDateStr } from "../lib/tz";

const router = Router();

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

/** Read dd_settings for a location from portal_kv */
async function getLocationSettings(locationId?: string | null): Promise<Record<string, unknown>> {
  if (!locationId) return {};
  try {
    const { data } = await supabaseAdmin
      .from("portal_kv")
      .select("value")
      .eq("location_id", locationId)
      .eq("key", "dd_settings")
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

async function upsertSupabaseClient(params: {
  name: string;
  email: string;
  phone: string;
  locationId: string;
  depositAmount: number;
  bookingDate: string;
}): Promise<string | null> {
  const { name, email, phone, locationId, depositAmount, bookingDate } = params;
  if (!name) return null;
  const emailLower = email.trim().toLowerCase();
  try {
    let existing: Record<string, unknown> | null = null;
    if (emailLower) {
      const { data } = await supabaseAdmin
        .from("clients")
        .select("id, visit_count, total_spent")
        .eq("location_id", locationId)
        .eq("email", emailLower)
        .maybeSingle();
      if (data) existing = data;
    }
    if (!existing && phone) {
      const { data } = await supabaseAdmin
        .from("clients")
        .select("id, visit_count, total_spent")
        .eq("location_id", locationId)
        .eq("phone", phone.trim().replace(/\s/g, ""))
        .maybeSingle();
      if (data) existing = data;
    }

    if (existing) {
      const newCount = Number(existing.visit_count ?? 0) + 1;
      const newSpent = Number(existing.total_spent ?? 0) + depositAmount;
      await supabaseAdmin
        .from("clients")
        .update({ visit_count: newCount, total_spent: newSpent, last_visit: bookingDate })
        .eq("id", String(existing.id));
      return String(existing.id);
    } else {
      const { data, error } = await supabaseAdmin
        .from("clients")
        .insert({
          location_id: locationId,
          name: name.trim(),
          email: emailLower || null,
          phone: phone.trim().replace(/\s/g, "") || null,
          visit_count: 1,
          total_spent: depositAmount,
          last_visit: bookingDate,
          source: "Website",
        })
        .select("id")
        .single();
      if (error) throw error;
      return String(data.id);
    }
  } catch (err) {
    console.error("upsertSupabaseClient", err);
    return null;
  }
}

// GET /api/config — public config + checklist
// ?locationId=<uuid>  optional — returns location-specific whatsapp/depositPercent
router.get("/config", async (req, res) => {
  const locationId = (req.query.locationId as string | undefined) ??
                     (req.headers["x-location-id"] as string | undefined) ?? null;
  const settings = await getLocationSettings(locationId);
  const whatsapp = await getWhatsApp(locationId);
  const depositPercent = Number(settings.depositPercent ?? settings.deposit ?? 30);
  return res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
    whatsapp,
    depositPercent,
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
    : { depositInjectables: 20, depositOther: 10 };
  const depositAmountPence = Math.max(100, Math.round(getDepositAmount(treatment, depSettings) * 100));

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
      const depositFromStripe = Math.round(pi.amount / 100);
      const whatsapp = await getWhatsApp(locationId || null);
      const locationInfo = locationId ? await getLocationInfo(locationId) : null;
      const adminEmail = process.env.ADMIN_EMAIL ?? "";

      // 1. Update pre-saved "awaiting_payment" booking
      if (bookingId) {
        const { data: updated } = await supabaseAdmin
          .from("bookings")
          .update({
            deposit_paid: true,
            status: "confirmed",
            stripe_payment_intent_id: paymentIntentId,
            deposit_amount: depositFromStripe,
          })
          .eq("id", bookingId)
          .eq("status", "awaiting_payment")
          .select("*, treatments(name, duration_minutes)")
          .maybeSingle();

        if (updated) {
          const treatmentRec = updated.treatments as Record<string, unknown> | null;
          const bDate = String(updated.booking_date ?? bookingDate ?? "");
          const bTime = String(updated.time_slot ?? bookingTime ?? "");
          const dur = Number(treatmentRec?.duration_minutes ?? durationMinutes ?? 30);
          const totalAmount = Number(updated.total_amount ?? depositFromStripe);
          const balanceDue = Math.max(0, totalAmount - depositFromStripe);

          // 1a. Upsert Supabase clients table
          let supabaseClientId: string | null = null;
          if (clientName && locationId) {
            supabaseClientId = await upsertSupabaseClient({
              name: clientName,
              email: clientEmail ?? "",
              phone: clientPhone ?? "",
              locationId,
              depositAmount: depositFromStripe,
              bookingDate: bDate,
            }).catch(() => null);
          }

          // 1b. Create payments record
          supabaseAdmin.from("payments").insert({
            booking_id: bookingId,
            client_id: supabaseClientId ?? String(updated.client_id ?? ""),
            amount: depositFromStripe,
            payment_type: "deposit",
            stripe_payment_id: paymentIntentId,
            status: "succeeded",
            location_id: locationId ?? null,
          }).then(() => {}).catch((e: unknown) => console.error("payments insert", e));

          // 1c. Update booking balance_due + client_id if we resolved it
          const bkUpdate: Record<string, unknown> = { balance_due: balanceDue };
          if (supabaseClientId && !updated.client_id) bkUpdate.client_id = supabaseClientId;
          supabaseAdmin.from("bookings").update(bkUpdate).eq("id", bookingId)
            .then(() => {}).catch((e: unknown) => console.error("booking balance_due update", e));

          if (clientEmail) {
            const publicDomain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim()
              ?? process.env.REPLIT_DEV_DOMAIN?.trim();
            const formsUrl = publicDomain && bookingId
              ? `https://${publicDomain}/forms.html?booking=${bookingId}`
              : undefined;
            sendClientConfirmationEmail({
              clientEmail,
              clientName: clientName ?? "",
              treatment: treatment ?? "",
              date: bDate,
              time: bTime,
              durationMinutes: dur,
              deposit: depositFromStripe,
              balance: totalAmount - depositFromStripe,
              depositPaid: true,
              whatsapp,
              locationName: locationInfo?.name,
              locationAddress: locationInfo?.address,
              formsUrl,
            }).catch(() => {});
          }
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
            }).catch(() => {});
          }
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

        const clientId = await upsertClientFromBooking({
          name: clientName,
          email: clientEmail ?? "",
          phone: clientPhone ?? "",
          date: bDate,
          source: "Website",
        }).catch(() => null);

        await supabaseAdmin.from("bookings").upsert({
          id,
          location_id: locationId,
          treatment_id: treatInfo.id,
          client_id: clientId,
          client_name: clientName,
          client_email: clientEmail ?? "",
          client_phone: clientPhone ?? "",
          booking_date: bDate,
          time_slot: bTime,
          status: "confirmed",
          deposit_amount: depositFromStripe,
          total_amount: price,
          deposit_paid: true,
          stripe_payment_intent_id: paymentIntentId,
          reminder_sent: false,
        }, { onConflict: "id" });

        if (clientEmail) {
          sendClientConfirmationEmail({
            clientEmail,
            clientName,
            treatment,
            date: bDate,
            time: bTime,
            durationMinutes: dur,
            deposit: depositFromStripe,
            balance: price - depositFromStripe,
            depositPaid: true,
            whatsapp,
            locationName: locationInfo?.name,
            locationAddress: locationInfo?.address,
          }).catch(() => {});
        }
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
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Stripe webhook booking upsert error", err);
    }
  }

  return res.status(200).json({ received: true });
});

export default router;
