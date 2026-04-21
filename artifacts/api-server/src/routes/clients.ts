import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuth } from "../lib/auth";

const router = Router();

function getLocationId(req: import("express").Request): string | null {
  return (
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined) ??
    null
  );
}

function rowToClient(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    joinDate: row.join_date ?? (row.created_at ? new Date(String(row.created_at)).toISOString().slice(0, 10) : ""),
    notes: row.notes ?? "",
    source: row.source ?? "Website",
    createdAt: row.created_at ? (typeof row.created_at === "number" ? row.created_at : new Date(String(row.created_at)).getTime()) : 0,
    dateOfBirth: row.date_of_birth ?? "",
    visitCount: Number(row.visit_count ?? 0),
    totalSpent: Number(row.total_spent ?? 0),
    lastVisit: row.last_visit ?? null,
  };
}

// GET /api/clients — requires admin JWT
router.get("/clients", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const locationId = getLocationId(req);
    let query = supabaseAdmin
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (locationId) query = query.eq("location_id", locationId);

    const { data, error } = await query;
    if (error) throw error;
    return res.json((data ?? []).map(rowToClient));
  } catch (err) {
    console.error("GET /api/clients", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/clients  — upsert by email/phone — requires admin JWT
router.post("/clients", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const c = req.body;
  if (!c.name) return res.status(400).json({ error: "name required" });

  const locationId = getLocationId(req);
  const email = (c.email ?? "").trim().toLowerCase();
  const phone = (c.phone ?? "").trim().replace(/\s/g, "");
  const now = new Date().toISOString();

  try {
    let existing: Record<string, unknown> | null = null;

    if (email) {
      let q = supabaseAdmin.from("clients").select("*").eq("email", email).limit(1);
      if (locationId) q = q.eq("location_id", locationId);
      const { data } = await q;
      if (data?.length) existing = data[0] as Record<string, unknown>;
    }
    if (!existing && phone) {
      let q = supabaseAdmin.from("clients").select("*").eq("phone", phone).limit(1);
      if (locationId) q = q.eq("location_id", locationId);
      const { data } = await q;
      if (data?.length) existing = data[0] as Record<string, unknown>;
    }

    if (existing) {
      const updates: Record<string, unknown> = {};
      if (c.name) updates.name = c.name;
      if (email) updates.email = email;
      if (phone) updates.phone = phone;
      if (c.notes) updates.notes = c.notes;
      if (c.source) updates.source = c.source;
      await supabaseAdmin.from("clients").update(updates).eq("id", String(existing.id));
      const { data: updated } = await supabaseAdmin.from("clients").select("*").eq("id", String(existing.id)).maybeSingle();
      return res.status(200).json(rowToClient((updated ?? {}) as Record<string, unknown>));
    }

    const payload: Record<string, unknown> = {
      name: c.name,
      email: email || null,
      phone: phone || null,
      notes: c.notes ?? "",
      source: c.source ?? "Website",
      created_at: now,
    };
    if (locationId) payload.location_id = locationId;

    const { data: inserted, error } = await supabaseAdmin
      .from("clients")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return res.status(201).json(rowToClient(inserted as Record<string, unknown>));
  } catch (err) {
    console.error("POST /api/clients", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/clients/bulk  — batch upsert — requires admin JWT
router.post("/clients/bulk", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const clients: unknown[] = req.body;
  if (!Array.isArray(clients)) return res.status(400).json({ error: "array required" });

  const locationId = getLocationId(req);
  let upserted = 0;

  for (const raw of clients as Record<string, unknown>[]) {
    if (!raw.name) continue;
    const email = String(raw.email ?? "").trim().toLowerCase();
    const phone = String(raw.phone ?? "").trim().replace(/\s/g, "");

    let existing: Record<string, unknown> | null = null;
    if (email) {
      let q = supabaseAdmin.from("clients").select("id").eq("email", email).limit(1);
      if (locationId) q = q.eq("location_id", locationId);
      const { data } = await q;
      if (data?.length) existing = data[0] as Record<string, unknown>;
    }
    if (!existing && phone) {
      let q = supabaseAdmin.from("clients").select("id").eq("phone", phone).limit(1);
      if (locationId) q = q.eq("location_id", locationId);
      const { data } = await q;
      if (data?.length) existing = data[0] as Record<string, unknown>;
    }

    if (existing) {
      const updates: Record<string, unknown> = {};
      if (String(raw.name)) updates.name = String(raw.name);
      if (email) updates.email = email;
      if (phone) updates.phone = phone;
      await supabaseAdmin.from("clients").update(updates).eq("id", String(existing.id));
    } else {
      const payload: Record<string, unknown> = {
        name: String(raw.name),
        email: email || null,
        phone: phone || null,
        notes: String(raw.notes ?? ""),
        source: String(raw.source ?? "Website"),
        created_at: new Date().toISOString(),
      };
      if (locationId) payload.location_id = locationId;
      await supabaseAdmin.from("clients").insert(payload).catch(() => {});
    }
    upserted++;
  }

  return res.json({ ok: true, upserted });
});

// PUT /api/clients/:id — requires admin JWT
router.put("/clients/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  const c = req.body;
  try {
    const updates: Record<string, unknown> = {};
    if (c.name != null) updates.name = c.name;
    if (c.email != null) updates.email = c.email;
    if (c.phone != null) updates.phone = c.phone;
    if (c.notes != null) updates.notes = c.notes;
    if (c.source != null) updates.source = c.source;

    await supabaseAdmin.from("clients").update(updates).eq("id", id);
    const { data: updated } = await supabaseAdmin.from("clients").select("*").eq("id", id).maybeSingle();
    if (!updated) return res.status(404).json({ error: "not found" });
    return res.json(rowToClient(updated as Record<string, unknown>));
  } catch (err) {
    console.error("PUT /api/clients/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/clients/:id — requires admin JWT
router.delete("/clients/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    await supabaseAdmin.from("clients").delete().eq("id", req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/clients/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/clients/sample  — remove seeded test clients only — requires admin JWT
router.delete("/clients/sample", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const SAMPLE_NAMES = ["Ellisha W.", "Donna S.", "Sophie M.", "Chloe R.", "Amara J.", "Priya K.", "Zara T."];
  try {
    const locationId = getLocationId(req);
    let q = supabaseAdmin.from("clients").delete().in("name", SAMPLE_NAMES);
    if (locationId) q = q.eq("location_id", locationId);
    await q;
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/clients/sample", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/clients  — clear all (used by resetPortal) — requires admin JWT
router.delete("/clients", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const locationId = getLocationId(req);
    let q = supabaseAdmin.from("clients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (locationId) q = q.eq("location_id", locationId);
    await q;
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/clients", err);
    return res.status(500).json({ error: "db error" });
  }
});

// Helper exported for use in bookings route — upsert a client silently
export async function upsertClientFromBooking(data: {
  name: string;
  email: string;
  phone: string;
  date: string;
  source: string;
  locationId?: string;
  dob?: string;
  notes?: string;
}): Promise<string | null> {
  if (!data.name) return null;
  const email = data.email.trim().toLowerCase();
  const phone = data.phone.trim().replace(/\s/g, "");
  const locationId = data.locationId ?? null;

  try {
    let existing: Record<string, unknown> | null = null;

    if (email) {
      let q = supabaseAdmin.from("clients").select("id").eq("email", email).limit(1);
      if (locationId) q = q.eq("location_id", locationId);
      const { data: rows } = await q;
      if (rows?.length) existing = rows[0] as Record<string, unknown>;
    }
    if (!existing && phone) {
      let q = supabaseAdmin.from("clients").select("id").eq("phone", phone).limit(1);
      if (locationId) q = q.eq("location_id", locationId);
      const { data: rows } = await q;
      if (rows?.length) existing = rows[0] as Record<string, unknown>;
    }
    if (!existing && !email && !phone && data.name) {
      let q = supabaseAdmin.from("clients").select("id")
        .ilike("name", data.name.trim()).limit(1);
      if (locationId) q = q.eq("location_id", locationId);
      const { data: rows } = await q;
      if (rows?.length) existing = rows[0] as Record<string, unknown>;
    }

    if (existing) {
      const updates: Record<string, unknown> = {};
      if (email) updates.email = email;
      if (phone) updates.phone = phone;
      if (data.dob) updates.date_of_birth = data.dob;
      await supabaseAdmin.from("clients").update(updates).eq("id", String(existing.id));
      return String(existing.id);
    } else {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: email || null,
        phone: phone || null,
        notes: data.notes ?? "",
        source: data.source,
        created_at: new Date().toISOString(),
      };
      if (locationId) payload.location_id = locationId;
      if (data.dob) payload.date_of_birth = data.dob;

      const { data: inserted, error } = await supabaseAdmin
        .from("clients")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return String(inserted.id);
    }
  } catch (err) {
    console.error("upsertClientFromBooking", err);
    return null;
  }
}

export async function clearSampleClients(locationId?: string): Promise<void> {
  const SAMPLE_NAMES = ["Ellisha W.", "Donna S.", "Sophie M.", "Chloe R.", "Amara J.", "Priya K.", "Zara T."];
  let q = supabaseAdmin.from("clients").delete().in("name", SAMPLE_NAMES);
  if (locationId) q = q.eq("location_id", locationId);
  await q;
}

export default router;
