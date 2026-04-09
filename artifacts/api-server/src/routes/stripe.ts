// STRIPE KEYS — add to Replit Secrets before going live
// STRIPE_SECRET_KEY=sk_live_...
// STRIPE_PUBLISHABLE_KEY=pk_live_...
// STRIPE_WEBHOOK_SECRET=whsec_...
// Get these from stripe.com/dashboard

import { Router } from "express";
import Stripe from "stripe";
import { pool } from "@workspace/db";
import { getTreatmentDuration, getTreatmentCategory, getTreatmentPrice, hasConflict } from "../lib/treatments";
import { sendClientConfirmationEmail, sendAdminNotificationEmail } from "../lib/email";
import { upsertClientFromBooking } from "./clients";
import { ukDateStr } from "../lib/tz";

const router = Router();

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

async function getSettings(): Promise<Record<string, string>> {
  try {
    const res = await pool.query("SELECT value FROM portal_kv WHERE key='dd_settings'");
    if (res.rows.length) return (res.rows[0].value as Record<string, string>) ?? {};
  } catch { /* ignore */ }
  return {};
}

async function getWhatsApp(): Promise<string> {
  const settings = await getSettings();
  return settings.whatsapp ?? "";
}

// GET /api/config — returns non-sensitive public config for frontend + portal checklist booleans
router.get("/config", async (_req, res) => {
  const settings = await getSettings();
  const whatsapp = settings.whatsapp ?? "";
  const depositPercent = Number(settings.deposit ?? 50);
  return res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
    whatsapp,
    depositPercent,
    // Checklist booleans — true/false only, never actual values
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
  const { treatment, clientName, clientEmail, clientPhone, bookingDate, bookingTime, bookingId } = req.body as Record<string, string>;
  if (!treatment) {
    return res.status(400).json({ error: "treatment required" });
  }

  // ── Server-side price lookup — never trust client-sent amount ──────────────
  const treatmentPrice = await getTreatmentPrice(treatment);
  if (treatmentPrice === null) {
    return res.status(400).json({ error: "Unknown treatment. Please refresh and try again." });
  }

  const settings = await getSettings();
  // Consultation is always paid in full; all other treatments use the configured deposit %
  const isConsultation = treatment === "Consultation";
  const depositPercent = isConsultation ? 100 : Math.max(1, Math.min(100, Number(settings.deposit ?? 50) || 50));
  const depositAmountPence = Math.max(30, Math.round(treatmentPrice * depositPercent)); // in pence, minimum 30p (Stripe minimum)

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
      },
      automatic_payment_methods: { enabled: true },
    });
    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      depositAmountPence,
      depositPercent,
    });
  } catch (err) {
    console.error("POST /api/stripe/create-payment-intent", err);
    return res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// POST /api/stripe/webhook — handles Stripe events
// Requires raw body — registered in app.ts before express.json()
router.post("/stripe/webhook", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(200).json({ received: true });

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  if (!webhookSecret) {
    console.error("CRITICAL: STRIPE_WEBHOOK_SECRET is not set. All Stripe payments will be taken but no bookings will be confirmed.");
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
    const { treatment, clientName, clientEmail, clientPhone, bookingDate, bookingTime, bookingId } = pi.metadata ?? {};
    const paymentIntentId = pi.id;

    try {
      // 1. Primary path: update the pre-saved "awaiting_payment" booking
      if (bookingId) {
        const depositFromStripe = Math.round(pi.amount / 100);
        const updated = await pool.query(
          `UPDATE bookings
           SET deposit_paid=true, status='Confirmed', stripe_payment_id=$1,
               deposit=GREATEST(deposit, $3), price=GREATEST(price, $3)
           WHERE id=$2 AND status='awaiting_payment'
           RETURNING *`,
          [paymentIntentId, bookingId, depositFromStripe],
        );

        if (updated.rows.length) {
          const row = updated.rows[0] as Record<string, unknown>;
          const bDate = String(row.date ?? bookingDate ?? "");
          const bTime = String(row.time ?? bookingTime ?? "");
          const deposit = Number(row.deposit ?? 0);
          const price = Number(row.price ?? 0);
          const durationMinutes = Number(row.duration_minutes ?? 30);
          const whatsapp = await getWhatsApp();
          if (clientEmail) {
            sendClientConfirmationEmail({
              clientEmail,
              clientName: clientName ?? "",
              treatment: treatment ?? "",
              date: bDate,
              time: bTime,
              durationMinutes,
              deposit,
              balance: price - deposit,
              depositPaid: true,
              whatsapp,
            }).catch(() => {});
          }
          const adminEmail = process.env.ADMIN_EMAIL ?? "";
          if (adminEmail) {
            sendAdminNotificationEmail({
              adminEmail,
              clientName: clientName ?? "",
              clientEmail: clientEmail ?? "",
              clientPhone: clientPhone ?? "",
              treatment: treatment ?? "",
              durationMinutes,
              date: bDate,
              time: bTime,
              deposit,
              depositPaid: true,
              source: "Website",
            }).catch(() => {});
          }
          // Done — pre-saved booking confirmed successfully
        }
      }

      // 2. Idempotency: check if already confirmed with this payment intent
      const existingByPi = await pool.query(
        "SELECT id FROM bookings WHERE stripe_payment_id=$1",
        [paymentIntentId],
      );
      if (existingByPi.rows.length) {
        await pool.query(
          "UPDATE bookings SET deposit_paid=true, status='Confirmed' WHERE stripe_payment_id=$1 AND deposit_paid=false",
          [paymentIntentId],
        );
        // Already handled — nothing more to do
      } else {
        // 3. Fallback: no pre-saved booking found — create from metadata
        // Use bookingId from metadata if provided (shared with client POST), else generate one
        if (treatment && clientName) {
          const id = bookingId || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
          const durationMinutes = getTreatmentDuration(treatment);
          const category = getTreatmentCategory(treatment);
          const depositAmountPence = pi.amount;
          const deposit = Math.round(depositAmountPence / 100);
          const settings = await getSettings();
          const depositPercent = Number(settings.deposit ?? 50) || 50;
          const price = Math.round(deposit * 100 / depositPercent);

          const rawDate = bookingDate || ukDateStr();
          const bDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : rawDate.slice(0, 10);
          const rawTime = bookingTime || "";
          const bTime = /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : "";

          const clientId = await upsertClientFromBooking({
            name: clientName,
            email: clientEmail ?? "",
            phone: clientPhone ?? "",
            date: bDate,
            source: "Website",
          });

          await pool.query(
            `INSERT INTO bookings
              (id,client_id,client_name,client_email,client_phone,treatment,category,price,deposit,
               deposit_paid,balance_paid,date,time,status,payment_method,
               stripe_payment_id,notes,created_at,source,duration_minutes,reminder_sent)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,false,$10,$11,'Confirmed','Stripe',$12,'',
               $13,'Website',$14,false)`,
            [
              id, clientId ?? null, clientName, clientEmail ?? "", clientPhone ?? "",
              treatment, category, price, deposit,
              bDate, bTime,
              paymentIntentId, Date.now(), durationMinutes,
            ],
          );

          const whatsapp = await getWhatsApp();
          if (clientEmail) {
            sendClientConfirmationEmail({
              clientEmail,
              clientName,
              treatment,
              date: bDate,
              time: bTime,
              durationMinutes,
              deposit,
              balance: price - deposit,
              depositPaid: true,
              whatsapp,
            }).catch(() => {});
          }
          const adminEmail = process.env.ADMIN_EMAIL ?? "";
          if (adminEmail) {
            sendAdminNotificationEmail({
              adminEmail,
              clientName,
              clientEmail: clientEmail ?? "",
              clientPhone: clientPhone ?? "",
              treatment,
              durationMinutes,
              date: bDate,
              time: bTime,
              deposit,
              depositPaid: true,
              source: "Website",
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error("Stripe webhook booking upsert error", err);
    }
  }

  return res.status(200).json({ received: true });
});

export default router;
