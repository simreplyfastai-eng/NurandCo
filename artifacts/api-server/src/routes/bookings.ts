import { Router } from "express";
import { pool } from "@workspace/db";
import { upsertClientFromBooking } from "./clients";
import { getTreatmentDuration, hasConflict } from "../lib/treatments";
import { sendCancellationEmail, sendAdminNotificationEmail } from "../lib/email";

const router = Router();

// ─── helpers ────────────────────────────────────────────────────────────────

function rowToBooking(row: Record<string, unknown>) {
  return {
    id: row.id,
    clientId: row.client_id ?? null,
    clientName: row.client_name,
    clientEmail: row.client_email ?? "",
    clientPhone: row.client_phone ?? "",
    treatment: row.treatment,
    category: row.category ?? "",
    price: row.price ?? 0,
    deposit: row.deposit ?? 0,
    depositPaid: row.deposit_paid ?? true,
    balancePaid: row.balance_paid ?? false,
    date: row.date,
    time: row.time ?? "",
    status: row.status ?? "Pending",
    paymentMethod: row.payment_method ?? "Stripe",
    stripePaymentId: row.stripe_payment_id ?? null,
    notes: row.notes ?? "",
    createdAt: Number(row.created_at ?? 0),
    source: row.source ?? "Portal",
    durationMinutes: Number(row.duration_minutes ?? 30),
    reminderSent: row.reminder_sent ?? false,
  };
}

/** Fetch WhatsApp number from settings stored in portal_kv */
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

/**
 * Auto-complete: mark all Confirmed bookings as Complete if their appointment
 * time (date + time in Europe/London) is more than (duration + 15) mins in the past.
 */
export async function runAutoComplete(): Promise<number> {
  try {
    const result = await pool.query(`
      UPDATE bookings
      SET status = 'Complete'
      WHERE status = 'Confirmed'
        AND (
          -- Convert local date+time to UTC and check if past + buffer
          (date || ' ' || COALESCE(NULLIF(time,''), '00:00'))::timestamptz AT TIME ZONE 'Europe/London'
          + make_interval(mins => duration_minutes + 15)
          < NOW()
        )
    `);
    return result.rowCount ?? 0;
  } catch (err) {
    console.error("runAutoComplete error", err);
    return 0;
  }
}

// ─── routes ─────────────────────────────────────────────────────────────────

// GET /api/bookings  — optional ?month=YYYY-MM  ?limit=N  ?sort=newest
router.get("/bookings", async (req, res) => {
  await runAutoComplete();
  const { month, limit, sort } = req.query as Record<string, string>;
  try {
    const params: unknown[] = [];
    let where = "";
    if (month) {
      params.push(`${month}-%`);
      where = `WHERE date LIKE $1`;
    }
    const order = sort === "newest" ? "created_at DESC" : "date DESC, time ASC";
    const limitClause = limit ? `LIMIT $${params.length + 1}` : "";
    if (limit) params.push(Number(limit));
    const sql = `SELECT * FROM bookings ${where} ORDER BY ${order} ${limitClause}`;
    const result = await pool.query(sql, params);
    return res.json(result.rows.map(rowToBooking));
  } catch (err) {
    console.error("GET /api/bookings", err);
    return res.status(500).json({ error: "db error" });
  }
});

// GET /api/bookings/date/:date — returns all active bookings for a date including durationMinutes
router.get("/bookings/date/:date", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, time, duration_minutes, status, treatment
       FROM bookings
       WHERE date = $1 AND status != 'Cancelled'
       ORDER BY time ASC`,
      [req.params.date],
    );
    return res.json(
      result.rows.map((r) => ({
        id: r.id,
        time: r.time ?? "",
        durationMinutes: Number(r.duration_minutes ?? 30),
        status: r.status ?? "Pending",
        treatment: r.treatment ?? "",
      })),
    );
  } catch (err) {
    console.error("GET /api/bookings/date/:date", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/bookings
router.post("/bookings", async (req, res) => {
  const b = req.body;
  if (!b.clientName || !b.treatment || !b.date) {
    return res.status(400).json({ error: "clientName, treatment, date required" });
  }

  const durationMinutes = getTreatmentDuration(b.treatment);
  const id = b.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  const price = Number(b.price) || 0;
  const deposit = b.deposit !== undefined ? Number(b.deposit) : Math.round(price * 0.5);

  try {
    // Run autocomplete before inserting
    await runAutoComplete();

    // Conflict check — fetch all non-cancelled bookings on that date
    if (b.time) {
      const existing = await pool.query(
        `SELECT time, duration_minutes, status FROM bookings
         WHERE date = $1 AND status != 'Cancelled' AND time != ''`,
        [b.date],
      );
      const conflict = hasConflict(
        b.time,
        durationMinutes,
        existing.rows.map((r) => ({
          time: r.time,
          durationMinutes: Number(r.duration_minutes ?? 30),
          status: r.status,
        })),
      );
      if (conflict) {
        return res.status(409).json({
          error: "This time slot is no longer available. Please select another time.",
        });
      }
    }

    // Resolve / upsert the client
    const clientId = await upsertClientFromBooking({
      name: b.clientName,
      email: b.clientEmail ?? "",
      phone: b.clientPhone ?? "",
      date: b.date,
      source: b.source ?? "Website",
    });

    await pool.query(
      `INSERT INTO bookings
        (id,client_id,client_name,client_email,treatment,category,price,deposit,
         deposit_paid,balance_paid,date,time,status,payment_method,
         stripe_payment_id,notes,created_at,source,duration_minutes,reminder_sent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (id) DO UPDATE SET
        client_id=COALESCE(EXCLUDED.client_id,bookings.client_id),
        client_name=EXCLUDED.client_name,treatment=EXCLUDED.treatment,
        category=EXCLUDED.category,price=EXCLUDED.price,deposit=EXCLUDED.deposit,
        date=EXCLUDED.date,time=EXCLUDED.time,status=EXCLUDED.status,
        notes=EXCLUDED.notes,duration_minutes=EXCLUDED.duration_minutes`,
      [
        id, clientId ?? null, b.clientName, b.clientEmail ?? "",
        b.treatment, b.category ?? "",
        price, deposit,
        b.depositPaid ?? true, b.balancePaid ?? false,
        b.date, b.time ?? "",
        b.status ?? "Pending", b.paymentMethod ?? "Stripe",
        b.stripePaymentId ?? null, b.notes ?? "",
        b.createdAt ?? Date.now(), b.source ?? "Portal",
        durationMinutes, false,
      ],
    );

    const result = await pool.query("SELECT * FROM bookings WHERE id=$1", [id]);
    const booking = rowToBooking(result.rows[0]);

    // Admin notification email (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL ?? "";
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
        source: b.source ?? "Portal",
      }).catch(() => {});
    }

    return res.status(201).json(booking);
  } catch (err: unknown) {
    // Unique constraint violation = race condition — slot taken by another request
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "23505"
    ) {
      return res.status(409).json({
        error: "Sorry, that slot was just taken. Please choose another time.",
      });
    }
    console.error("POST /api/bookings", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/bookings/bulk  — upsert array (portal seeding/sync)
router.post("/bookings/bulk", async (req, res) => {
  const bookings: unknown[] = req.body;
  if (!Array.isArray(bookings)) return res.status(400).json({ error: "array required" });
  try {
    for (const b of bookings as Record<string, unknown>[]) {
      const id = b.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
      const price = Number(b.price) || 0;
      const deposit = b.deposit !== undefined ? Number(b.deposit) : Math.round(price * 0.5);
      const durationMinutes = getTreatmentDuration(String(b.treatment ?? ""));
      await pool.query(
        `INSERT INTO bookings
          (id,client_name,client_email,treatment,category,price,deposit,
           deposit_paid,balance_paid,date,time,status,payment_method,
           stripe_payment_id,notes,created_at,source,duration_minutes,reminder_sent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO NOTHING`,
        [
          id, String(b.clientName ?? ""), String(b.clientEmail ?? ""),
          String(b.treatment ?? ""), String(b.category ?? ""),
          price, deposit,
          b.depositPaid ?? true, b.balancePaid ?? false,
          String(b.date ?? ""), String(b.time ?? ""),
          String(b.status ?? "Pending"), String(b.paymentMethod ?? "Stripe"),
          b.stripePaymentId ?? null, String(b.notes ?? ""),
          Number(b.createdAt ?? Date.now()), String(b.source ?? "Portal"),
          durationMinutes, false,
        ],
      );
    }
    return res.json({ ok: true, count: bookings.length });
  } catch (err) {
    console.error("POST /api/bookings/bulk", err);
    return res.status(500).json({ error: "db error" });
  }
});

// PUT /api/bookings/:id
router.put("/bookings/:id", async (req, res) => {
  const { id } = req.params;
  const b = req.body;
  try {
    const existing = await pool.query("SELECT * FROM bookings WHERE id=$1", [id]);
    if (!existing.rows.length) return res.status(404).json({ error: "not found" });
    const cur = existing.rows[0];
    const prevStatus = cur.status;
    const newStatus: string | null = b.status ?? null;

    // If treatment changed, update duration
    const treatmentName: string | null = b.treatment ?? null;
    const newDuration = treatmentName ? getTreatmentDuration(treatmentName) : null;

    await pool.query(
      `UPDATE bookings SET
        client_name=COALESCE($2,client_name),
        client_email=COALESCE($3,client_email),
        treatment=COALESCE($4,treatment),
        category=COALESCE($5,category),
        price=COALESCE($6,price),
        deposit=COALESCE($7,deposit),
        deposit_paid=COALESCE($8,deposit_paid),
        balance_paid=COALESCE($9,balance_paid),
        date=COALESCE($10,date),
        time=COALESCE($11,time),
        status=COALESCE($12,status),
        notes=COALESCE($13,notes),
        stripe_payment_id=COALESCE($14,stripe_payment_id),
        duration_minutes=COALESCE($15,duration_minutes)
       WHERE id=$1`,
      [
        id,
        b.clientName ?? null, b.clientEmail ?? null,
        treatmentName, b.category ?? null,
        b.price != null ? Number(b.price) : null,
        b.deposit != null ? Number(b.deposit) : null,
        b.depositPaid ?? null, b.balancePaid ?? null,
        b.date ?? null, b.time ?? null,
        newStatus, b.notes ?? null,
        b.stripePaymentId ?? null,
        newDuration,
      ],
    );

    const updated = await pool.query("SELECT * FROM bookings WHERE id=$1", [id]);
    const booking = rowToBooking(updated.rows[0] ?? cur);

    // Send cancellation email if status just changed to Cancelled
    if (newStatus === "Cancelled" && prevStatus !== "Cancelled") {
      const email = booking.clientEmail;
      if (email) {
        const whatsapp = await getWhatsApp();
        sendCancellationEmail({
          clientEmail: email,
          clientName: booking.clientName as string,
          treatment: booking.treatment as string,
          date: booking.date as string,
          time: booking.time as string,
          whatsapp,
        }).catch(() => {});
      }
    }

    return res.json(booking);
  } catch (err) {
    console.error("PUT /api/bookings/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/bookings/:id
router.delete("/bookings/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM bookings WHERE id=$1", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/bookings/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/bookings/sample  — remove seeded test data only
router.delete("/bookings/sample", async (_req, res) => {
  const SAMPLE_NAMES = ["Ellisha W.", "Donna S.", "Sophie M.", "Chloe R.", "Amara J.", "Priya K.", "Zara T."];
  const placeholders = SAMPLE_NAMES.map((_, i) => `$${i + 1}`).join(",");
  try {
    const result = await pool.query(
      `DELETE FROM bookings WHERE client_name IN (${placeholders})`,
      SAMPLE_NAMES,
    );
    return res.json({ ok: true, deleted: result.rowCount });
  } catch (err) {
    console.error("DELETE /api/bookings/sample", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/stripe/webhook  — placeholder
router.post("/stripe/webhook", (req, res) => {
  console.log("Stripe webhook received (placeholder):", req.body);
  return res.json({ received: true });
});

export default router;
