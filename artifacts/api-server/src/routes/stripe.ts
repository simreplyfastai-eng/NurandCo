// STRIPE KEYS — add to Replit Secrets before going live
// STRIPE_SECRET_KEY=sk_live_...
// STRIPE_PUBLISHABLE_KEY=pk_live_...
// STRIPE_WEBHOOK_SECRET=whsec_...
// Get these from stripe.com/dashboard

import { Router } from "express";
import Stripe from "stripe";
import { pool } from "@workspace/db";
import { getTreatmentDuration, getTreatmentCategory, hasConflict } from "../lib/treatments";
import { sendClientConfirmationEmail, sendAdminNotificationEmail } from "../lib/email";
import { upsertClientFromBooking } from "./clients";

const router = Router();

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

async function getWhatsApp(): Promise<string> {
  try {
    const res = await pool.query("SELECT value FROM portal_kv WHERE key='dd_settings'");
    if (res.rows.length) {
      const settings = res.rows[0].value as Record<string, string>;
      return settings.whatsapp ?? "";
    }
  } catch { /* ignore */ }
  return "";
}

// GET /api/config — returns non-sensitive public config for frontend
router.get("/config", async (_req, res) => {
  const whatsapp = await getWhatsApp();
  return res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
    whatsapp,
  });
});

// POST /api/stripe/create-payment-intent
router.post("/stripe/create-payment-intent", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: "Stripe is not configured. Please contact the clinic to arrange payment." });
  }
  const { amount, treatment, clientName, clientEmail } = req.body as Record<string, string>;
  if (!amount || !treatment) {
    return res.status(400).json({ error: "amount and treatment required" });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount),
      currency: "gbp",
      receipt_email: clientEmail || undefined,
      metadata: {
        treatment,
        clientName: clientName ?? "",
        clientEmail: clientEmail ?? "",
      },
      automatic_payment_methods: { enabled: true },
    });
    return res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
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

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } else {
      // Dev mode: parse raw body as JSON
      event = JSON.parse((req.body as Buffer).toString()) as Stripe.Event;
    }
  } catch (err) {
    console.error("Stripe webhook signature error", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { treatment, clientName, clientEmail } = pi.metadata ?? {};
    const paymentIntentId = pi.id;

    try {
      // Idempotent: check if booking already exists with this payment intent id
      const existing = await pool.query(
        "SELECT * FROM bookings WHERE stripe_payment_id=$1",
        [paymentIntentId],
      );

      if (existing.rows.length) {
        // Already exists — ensure depositPaid and status are correct
        await pool.query(
          "UPDATE bookings SET deposit_paid=true, status='Confirmed' WHERE stripe_payment_id=$1 AND deposit_paid=false",
          [paymentIntentId],
        );
      } else {
        // Booking not yet created (network failure edge case) — create it now
        if (treatment && clientName) {
          const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          const durationMinutes = getTreatmentDuration(treatment);
          const category = getTreatmentCategory(treatment);
          const depositAmountPence = pi.amount; // already in pence
          const deposit = Math.round(depositAmountPence / 100);
          const price = deposit * 2;

          const clientId = await upsertClientFromBooking({
            name: clientName,
            email: clientEmail ?? "",
            phone: "",
            date: new Date().toISOString().slice(0, 10),
            source: "Website",
          });

          await pool.query(
            `INSERT INTO bookings
              (id,client_id,client_name,client_email,treatment,category,price,deposit,
               deposit_paid,balance_paid,date,time,status,payment_method,
               stripe_payment_id,notes,created_at,source,duration_minutes,reminder_sent)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,false,'','','Confirmed','Stripe',$9,'',
               $10,'Website',$11,false)`,
            [
              id, clientId ?? null, clientName, clientEmail ?? "",
              treatment, category, price, deposit,
              paymentIntentId, Date.now(), durationMinutes,
            ],
          );

          // Send emails
          const whatsapp = await getWhatsApp();
          if (clientEmail) {
            sendClientConfirmationEmail({
              clientEmail,
              clientName,
              treatment,
              date: "",
              time: "",
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
              clientPhone: "",
              treatment,
              durationMinutes,
              date: "",
              time: "",
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
