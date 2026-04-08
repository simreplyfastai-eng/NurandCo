import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

function rowToClient(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    joinDate: row.join_date ?? "",
    notes: row.notes ?? "",
    source: row.source ?? "Website",
    createdAt: Number(row.created_at ?? 0),
    dateOfBirth: row.date_of_birth ?? "",
  };
}

// GET /api/clients — requires admin JWT
router.get("/clients", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const result = await pool.query(
      "SELECT * FROM clients ORDER BY created_at DESC",
    );
    return res.json(result.rows.map(rowToClient));
  } catch (err) {
    console.error("GET /api/clients", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/clients  — upsert by email (if non-empty) or phone (if non-empty), else create new — requires admin JWT
router.post("/clients", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const c = req.body;
  if (!c.name) return res.status(400).json({ error: "name required" });

  const email = (c.email ?? "").trim().toLowerCase();
  const phone = (c.phone ?? "").trim().replace(/\s/g, "");
  const id = c.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  const now = c.createdAt ?? Date.now();

  try {
    // Attempt to find an existing client to deduplicate
    let existing: Record<string, unknown> | null = null;

    if (email) {
      const r = await pool.query(
        "SELECT * FROM clients WHERE LOWER(TRIM(email)) = $1 LIMIT 1",
        [email],
      );
      if (r.rows.length) existing = r.rows[0];
    }
    if (!existing && phone) {
      const r = await pool.query(
        "SELECT * FROM clients WHERE REPLACE(REPLACE(phone,' ',''),'-','') = $1 LIMIT 1",
        [phone],
      );
      if (r.rows.length) existing = r.rows[0];
    }

    if (existing) {
      // Merge new data into existing record (never overwrite with blank)
      await pool.query(
        `UPDATE clients SET
          name = CASE WHEN $2 != '' THEN $2 ELSE name END,
          email = CASE WHEN $3 != '' THEN $3 ELSE email END,
          phone = CASE WHEN $4 != '' THEN $4 ELSE phone END,
          notes = CASE WHEN $5 != '' THEN $5 ELSE notes END,
          source = CASE WHEN $6 != '' THEN $6 ELSE source END
         WHERE id = $1`,
        [existing.id, c.name, email, phone, c.notes ?? "", c.source ?? ""],
      );
      const updated = await pool.query("SELECT * FROM clients WHERE id=$1", [existing.id]);
      return res.status(200).json(rowToClient(updated.rows[0]));
    }

    // No match — create new client
    await pool.query(
      `INSERT INTO clients (id, name, email, phone, join_date, notes, source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [id, c.name, email, phone, c.joinDate ?? "", c.notes ?? "", c.source ?? "Website", now],
    );
    const inserted = await pool.query("SELECT * FROM clients WHERE id=$1", [id]);
    return res.status(201).json(rowToClient(inserted.rows[0]));
  } catch (err) {
    console.error("POST /api/clients", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/clients/bulk  — batch upsert (for portal seeding, runs deduplication) — requires admin JWT
router.post("/clients/bulk", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const clients: unknown[] = req.body;
  if (!Array.isArray(clients)) return res.status(400).json({ error: "array required" });
  let upserted = 0;
  try {
    for (const raw of clients as Record<string, unknown>[]) {
      if (!raw.name) continue;
      const email = String(raw.email ?? "").trim().toLowerCase();
      const phone = String(raw.phone ?? "").trim().replace(/\s/g, "");
      const id = String(raw.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)));

      let existing: Record<string, unknown> | null = null;
      if (email) {
        const r = await pool.query(
          "SELECT * FROM clients WHERE LOWER(TRIM(email)) = $1 LIMIT 1", [email],
        );
        if (r.rows.length) existing = r.rows[0];
      }
      if (!existing && phone) {
        const r = await pool.query(
          "SELECT * FROM clients WHERE REPLACE(REPLACE(phone,' ',''),'-','') = $1 LIMIT 1", [phone],
        );
        if (r.rows.length) existing = r.rows[0];
      }

      if (existing) {
        await pool.query(
          `UPDATE clients SET
            name = CASE WHEN $2 != '' THEN $2 ELSE name END,
            email = CASE WHEN $3 != '' THEN $3 ELSE email END,
            phone = CASE WHEN $4 != '' THEN $4 ELSE phone END
           WHERE id = $1`,
          [existing.id, String(raw.name), email, phone],
        );
      } else {
        await pool.query(
          `INSERT INTO clients (id, name, email, phone, join_date, notes, source, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
          [id, String(raw.name), email, phone,
           String(raw.joinDate ?? ""), String(raw.notes ?? ""),
           String(raw.source ?? "Website"), Number(raw.createdAt ?? Date.now())],
        );
      }
      upserted++;
    }
    return res.json({ ok: true, upserted });
  } catch (err) {
    console.error("POST /api/clients/bulk", err);
    return res.status(500).json({ error: "db error" });
  }
});

// PUT /api/clients/:id — requires admin JWT
router.put("/clients/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  const c = req.body;
  try {
    await pool.query(
      `UPDATE clients SET
        name  = COALESCE($2, name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        join_date = COALESCE($5, join_date),
        notes = COALESCE($6, notes),
        source = COALESCE($7, source)
       WHERE id = $1`,
      [id, c.name ?? null, c.email ?? null, c.phone ?? null,
       c.joinDate ?? null, c.notes ?? null, c.source ?? null],
    );
    const updated = await pool.query("SELECT * FROM clients WHERE id=$1", [id]);
    if (!updated.rows.length) return res.status(404).json({ error: "not found" });
    return res.json(rowToClient(updated.rows[0]));
  } catch (err) {
    console.error("PUT /api/clients/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/clients/:id — requires admin JWT
router.delete("/clients/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    await pool.query("DELETE FROM clients WHERE id=$1", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/clients/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/clients/sample  — remove seeded test clients only — requires admin JWT
router.delete("/clients/sample", async (_req, res) => {
  if (!requireAuth(_req, res)) return;
  const SAMPLE_NAMES = ["Ellisha W.", "Donna S.", "Sophie M.", "Chloe R.", "Amara J.", "Priya K.", "Zara T."];
  const placeholders = SAMPLE_NAMES.map((_, i) => `$${i + 1}`).join(",");
  try {
    const result = await pool.query(
      `DELETE FROM clients WHERE name IN (${placeholders})`,
      SAMPLE_NAMES,
    );
    return res.json({ ok: true, deleted: result.rowCount });
  } catch (err) {
    console.error("DELETE /api/clients/sample", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/clients  — clear all (used by resetPortal) — requires admin JWT
router.delete("/clients", async (_req, res) => {
  if (!requireAuth(_req, res)) return;
  try {
    await pool.query("DELETE FROM clients");
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/clients", err);
    return res.status(500).json({ error: "db error" });
  }
});

export default router;

// Helper exported for use in bookings route — upsert a client silently
// Returns the client id so callers can store it as a FK on bookings
export async function upsertClientFromBooking(data: {
  name: string;
  email: string;
  phone: string;
  date: string;
  source: string;
  dob?: string;
  notes?: string;
}): Promise<string | null> {
  if (!data.name) return null;
  const email = data.email.trim().toLowerCase();
  const phone = data.phone.trim().replace(/\s/g, "");
  try {
    let existing: Record<string, unknown> | null = null;
    if (email) {
      const r = await pool.query(
        "SELECT * FROM clients WHERE LOWER(TRIM(email)) = $1 LIMIT 1", [email],
      );
      if (r.rows.length) existing = r.rows[0];
    }
    if (!existing && phone) {
      const r = await pool.query(
        "SELECT * FROM clients WHERE REPLACE(REPLACE(phone,' ',''),'-','') = $1 LIMIT 1", [phone],
      );
      if (r.rows.length) existing = r.rows[0];
    }
    if (!existing && !email && !phone && data.name) {
      const r = await pool.query(
        "SELECT * FROM clients WHERE LOWER(TRIM(name)) = $1 LIMIT 1",
        [data.name.trim().toLowerCase()],
      );
      if (r.rows.length) existing = r.rows[0];
    }

    if (existing) {
      await pool.query(
        `UPDATE clients SET
          email = CASE WHEN $2 != '' THEN $2 ELSE email END,
          phone = CASE WHEN $3 != '' THEN $3 ELSE phone END,
          date_of_birth = CASE WHEN $4 IS NOT NULL AND $4 != '' THEN $4 ELSE date_of_birth END
         WHERE id = $1`,
        [existing.id, email, phone, data.dob ?? null],
      );
      return String(existing.id);
    } else {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await pool.query(
        `INSERT INTO clients (id, name, email, phone, join_date, notes, source, created_at, date_of_birth)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
        [id, data.name, email, phone, data.date, data.notes ?? "", data.source, Date.now(), data.dob ?? null],
      );
      return id;
    }
  } catch (err) {
    console.error("upsertClientFromBooking", err);
    return null;
  }
}

// DELETE /api/clients/sample  — remove seeded test data only
export async function clearSampleClients(): Promise<void> {
  const SAMPLE_NAMES = ["Ellisha W.", "Donna S.", "Sophie M.", "Chloe R.", "Amara J.", "Priya K.", "Zara T."];
  const placeholders = SAMPLE_NAMES.map((_, i) => `$${i + 1}`).join(",");
  await pool.query(`DELETE FROM clients WHERE name IN (${placeholders})`, SAMPLE_NAMES);
}
