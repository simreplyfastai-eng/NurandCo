import Stripe from 'stripe';
import crypto from 'crypto';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const API_BASE = 'http://localhost:8080';

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-12-18.acacia' });

// Test booking data
const TEST_BOOKING_ID = crypto.randomUUID();
const TEST_DATA = {
  treatment: 'Anti-Wrinkle 1 Area',
  clientName: 'Test Bulletproof',
  clientEmail: 'test-bulletproof@example.com',
  clientPhone: '+44 7700 900001',
  bookingDate: '2026-05-15',
  bookingTime: '11:00',
  bookingId: TEST_BOOKING_ID,
  locationId: '[LOCATION_1_UUID]', // Hornchurch
};

let passed = 0, failed = 0;
function ok(msg) { console.log('  ✓', msg); passed++; }
function fail(msg, detail='') { console.log('  ✗', msg, detail ? `(${detail})` : ''); failed++; }

// ── Step 1: Validate that missing bookingTime is rejected ───────────────────
console.log('\n[STEP 1] Bulletproof 8 — time validation');
try {
  const r = await fetch(`${API_BASE}/api/stripe/create-payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...TEST_DATA, bookingTime: '' }), // no time
  });
  const d = await r.json();
  if (!r.ok && d.error?.includes('time')) ok('Missing bookingTime correctly rejected (400)');
  else fail('Missing bookingTime should be rejected', JSON.stringify(d));
} catch(e) { fail('Step 1 error', e.message); }

// ── Step 2: Create a real Stripe PaymentIntent via our API ─────────────────
console.log('\n[STEP 2] Create PaymentIntent via /api/stripe/create-payment-intent');
let clientSecret, paymentIntentId;
try {
  const r = await fetch(`${API_BASE}/api/stripe/create-payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_DATA),
  });
  const d = await r.json();
  if (r.ok && d.clientSecret && d.paymentIntentId) {
    clientSecret = d.clientSecret;
    paymentIntentId = d.paymentIntentId;
    ok(`PaymentIntent created: ${paymentIntentId}, deposit: £${d.depositAmountPence/100}`);
  } else {
    fail('PaymentIntent creation failed', JSON.stringify(d));
  }
} catch(e) { fail('Step 2 error', e.message); }

if (!paymentIntentId) { console.log('\nCannot continue without PaymentIntent — aborting'); process.exit(1); }

// ── Step 3: Confirm payment with Stripe test card ──────────────────────────
console.log('\n[STEP 3] Confirm PaymentIntent with test card pm_card_visa');
let piConfirmed;
try {
  piConfirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: 'pm_card_visa',
    return_url: 'http://localhost:8080/forms.html',
  });
  if (piConfirmed.status === 'succeeded') {
    ok(`PaymentIntent status: succeeded (amount: £${piConfirmed.amount/100})`);
  } else {
    fail(`PaymentIntent status: ${piConfirmed.status} (expected succeeded)`);
  }
} catch(e) { fail('Step 3 — stripe.paymentIntents.confirm error', e.message); }

// ── Step 4: Construct and sign a real webhook event ────────────────────────
console.log('\n[STEP 4] Bulletproof 2/4 — fire signed webhook event');
const piForWebhook = await stripe.paymentIntents.retrieve(paymentIntentId);
const eventPayload = JSON.stringify({
  id: `evt_test_${Date.now()}`,
  object: 'event',
  type: 'payment_intent.succeeded',
  data: { object: piForWebhook },
  livemode: false,
  created: Math.floor(Date.now()/1000),
});

const timestamp = Math.floor(Date.now()/1000);
const sigPayload = `${timestamp}.${eventPayload}`;
const sig = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(sigPayload).digest('hex');
const stripeSignature = `t=${timestamp},v1=${sig}`;

try {
  const r = await fetch(`${API_BASE}/api/stripe/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': stripeSignature,
    },
    body: eventPayload,
  });
  const d = await r.json();
  if (r.ok && d.received) {
    ok(`Webhook accepted (200) — booking being processed`);
  } else {
    fail(`Webhook returned ${r.status}`, JSON.stringify(d));
  }
} catch(e) { fail('Step 4 error', e.message); }

// ── Step 5: Wait 2s then check Supabase for booking ────────────────────────
console.log('\n[STEP 5] Verify booking was created in Supabase');
await new Promise(r => setTimeout(r, 2000));
try {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${TEST_BOOKING_ID}&select=id,status,deposit_paid,stripe_session_id,stripe_payment_intent_id,time_slot,booking_date,forms_completed`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    }
  });
  const rows = await r.json();
  const bk = rows[0];
  if (bk) {
    if (bk.status === 'confirmed') ok(`Booking status: confirmed`);
    else fail(`Booking status: ${bk.status} (expected confirmed)`);
    if (bk.deposit_paid) ok('deposit_paid: true');
    else fail('deposit_paid should be true');
    if (bk.stripe_session_id) ok(`stripe_session_id set: ${bk.stripe_session_id.slice(0,12)}…`);
    else fail('stripe_session_id is NULL');
    if (bk.stripe_payment_intent_id) ok(`stripe_payment_intent_id set`);
    else fail('stripe_payment_intent_id is NULL');
    if (bk.time_slot === '11:00') ok(`time_slot: ${bk.time_slot}`);
    else fail(`time_slot wrong: ${bk.time_slot} (expected 11:00)`);
    if (bk.booking_date === '2026-05-15') ok(`booking_date: ${bk.booking_date}`);
    else fail(`booking_date wrong: ${bk.booking_date}`);
    if (bk.forms_completed === false) ok('forms_completed: false');
    else fail(`forms_completed: ${bk.forms_completed}`);
  } else {
    fail('Booking NOT found in Supabase after webhook fired');
  }
} catch(e) { fail('Step 5 error', e.message); }

// ── Step 6: Test /api/forms/status (server-side retry + response shape) ─────
console.log('\n[STEP 6] Bulletproof 1 — /api/forms/status response');
try {
  const r = await fetch(`${API_BASE}/api/forms/status?booking=${TEST_BOOKING_ID}`);
  const d = await r.json();
  if (r.ok && d.booking) {
    ok('Forms status endpoint returned booking');
    if (d.booking.status === 'confirmed') ok('Booking confirmed in forms response');
    else fail(`status: ${d.booking.status}`);
    if (d.booking.time_slot || d.booking.time) ok(`time in response: ${d.booking.time_slot||d.booking.time}`);
    else fail('time missing from forms response');
  } else {
    fail('Forms status returned error', JSON.stringify(d));
  }
} catch(e) { fail('Step 6 error', e.message); }

// ── Step 7: Fire webhook a second time — idempotency ──────────────────────
console.log('\n[STEP 7] Bulletproof 2 — duplicate webhook idempotency');
try {
  const r = await fetch(`${API_BASE}/api/stripe/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': stripeSignature,
    },
    body: eventPayload,
  });
  const d = await r.json();
  // Check Supabase still has exactly 1 booking with this PI
  await new Promise(r => setTimeout(r, 500));
  const dbR = await fetch(`${SUPABASE_URL}/rest/v1/bookings?stripe_payment_intent_id=eq.${paymentIntentId}&select=id`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
  });
  const rows = await dbR.json();
  if (r.ok && d.received && rows.length === 1) {
    ok(`Duplicate webhook handled — still exactly 1 booking (idempotent ✓)`);
  } else {
    fail(`Duplicate webhook created ${rows.length} bookings (expected 1)`, JSON.stringify(d));
  }
} catch(e) { fail('Step 7 error', e.message); }

// ── Step 8: Send fake webhook without signature ────────────────────────────
console.log('\n[STEP 8] Bulletproof 3 — reject unsigned webhook');
try {
  const r = await fetch(`${API_BASE}/api/stripe/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': 't=1234,v1=fakesig',
    },
    body: eventPayload,
  });
  if (r.status === 400) ok('Unsigned webhook correctly rejected (400)');
  else fail(`Expected 400, got ${r.status}`);
} catch(e) { fail('Step 8 error', e.message); }

// ── Step 9: Check webhook events log shows the event ─────────────────────
console.log('\n[STEP 9] Bulletproof 7 — webhook events log');
try {
  const loginR = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  const { token } = await loginR.json();
  const r = await fetch(`${API_BASE}/api/admin/webhook-events`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-location-id': TEST_DATA.locationId }
  });
  const { events } = await r.json();
  if (Array.isArray(events) && events.length > 0) ok(`Webhook events log has ${events.length} event(s)`);
  else fail('Webhook events log empty');
} catch(e) { fail('Step 9 error', e.message); }

// ── Cleanup: delete test booking ──────────────────────────────────────────
console.log('\n[CLEANUP] Removing test booking from Supabase');
try {
  await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${TEST_BOOKING_ID}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
  });
  console.log('  Test booking removed');
} catch(e) { console.log('  Cleanup failed (non-critical):', e.message); }

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`);
console.log(`RESULT: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}`);
process.exit(failed > 0 ? 1 : 0);
