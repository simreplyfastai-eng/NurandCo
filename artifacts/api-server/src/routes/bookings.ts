import { Router } from "express";
import { pool } from "@workspace/db";
import { upsertClientFromBooking } from "./clients";

const router = Router();

function rowToBooking(row: Record<string, unknown>) {
  return {
    id: row.id,
    clientName: row.client_name,
    clientEmail: row.client_email ?? "",
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
  };
}

// GET /api/bookings  — optional ?month=YYYY-MM  ?limit=N  ?sort=newest
router.get("/bookings", async (req, res) => {
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

// GET /api/bookings/date/:date
router.get("/bookings/date/:date", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bookings WHERE date = $1 ORDER BY time ASC",
      [req.params.date],
    );
    return res.json(result.rows.map(rowToBooking));
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
  const id = b.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  const price = Number(b.price) || 0;
  const deposit = b.deposit !== undefined ? Number(b.deposit) : Math.round(price * 0.5);
  try {
    await pool.query(
      `INSERT INTO bookings
        (id,client_name,client_email,treatment,category,price,deposit,
         deposit_paid,balance_paid,date,time,status,payment_method,
         stripe_payment_id,notes,created_at,source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (id) DO UPDATE SET
        client_name=EXCLUDED.client_name,treatment=EXCLUDED.treatment,
        category=EXCLUDED.category,price=EXCLUDED.price,deposit=EXCLUDED.deposit,
        date=EXCLUDED.date,time=EXCLUDED.time,status=EXCLUDED.status,
        notes=EXCLUDED.notes`,
      [
        id, b.clientName, b.clientEmail ?? "",
        b.treatment, b.category ?? "",
        price, deposit,
        b.depositPaid ?? true, b.balancePaid ?? false,
        b.date, b.time ?? "",
        b.status ?? "Pending", b.paymentMethod ?? "Stripe",
        b.stripePaymentId ?? null, b.notes ?? "",
        b.createdAt ?? Date.now(), b.source ?? "Portal",
      ],
    );
    const result = await pool.query("SELECT * FROM bookings WHERE id=$1", [id]);
    // Auto-upsert client profile (fire-and-forget, non-blocking)
    upsertClientFromBooking({
      name: b.clientName,
      email: b.clientEmail ?? "",
      phone: b.clientPhone ?? "",
      date: b.date,
      source: b.source ?? "Website",
    }).catch(() => {});
    return res.status(201).json(rowToBooking(result.rows[0]));
  } catch (err) {
    console.error("POST /api/bookings", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/bookings/bulk  — upsert array (used for portal seeding/sync)
router.post("/bookings/bulk", async (req, res) => {
  const bookings: unknown[] = req.body;
  if (!Array.isArray(bookings)) return res.status(400).json({ error: "array required" });
  try {
    for (const b of bookings as Record<string, unknown>[]) {
      const id = b.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
      const price = Number(b.price) || 0;
      const deposit = b.deposit !== undefined ? Number(b.deposit) : Math.round(price * 0.5);
      await pool.query(
        `INSERT INTO bookings
          (id,client_name,client_email,treatment,category,price,deposit,
           deposit_paid,balance_paid,date,time,status,payment_method,
           stripe_payment_id,notes,created_at,source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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
        stripe_payment_id=COALESCE($14,stripe_payment_id)
       WHERE id=$1`,
      [
        id,
        b.clientName ?? null, b.clientEmail ?? null,
        b.treatment ?? null, b.category ?? null,
        b.price != null ? Number(b.price) : null,
        b.deposit != null ? Number(b.deposit) : null,
        b.depositPaid ?? null, b.balancePaid ?? null,
        b.date ?? null, b.time ?? null,
        b.status ?? null, b.notes ?? null,
        b.stripePaymentId ?? null,
      ],
    );
    const updated = await pool.query("SELECT * FROM bookings WHERE id=$1", [id]);
    return res.json(rowToBooking(updated.rows[0] ?? cur));
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

// POST /api/stripe/webhook  — placeholder
router.post("/stripe/webhook", (req, res) => {
  // TODO: Stripe webhook handler
  // Will receive payment confirmation events
  // On payment_intent.succeeded:
  //   Find booking by stripePaymentId
  //   Set depositPaid: true, status: "Confirmed"
  //   Trigger confirmation email to client
  console.log("Stripe webhook received (placeholder):", req.body);
  return res.json({ received: true });
});

export default router;
