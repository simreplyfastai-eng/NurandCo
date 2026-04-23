import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuth } from "../lib/auth";

const router = Router();

function getLocationId(req: import("express").Request): string | null {
  return (
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined) ??
    (req.body?.locationId as string | undefined) ??
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
      await supabaseAdmin.from("clients").update(updates).eq("id", String(existing.id));
      const { data: updated } = await supabaseAdmin.from("clients").select("*").eq("id", String(existing.id)).maybeSingle();
      return res.status(200).json(rowToClient((updated ?? {}) as Record<string, unknown>));
    }

    if (!locationId) return res.status(400).json({ error: "locationId required" });
    const payload: Record<string, unknown> = {
      name: c.name,
      email: email || "",
      phone: phone || "",
      notes: c.notes ?? "",
      created_at: now,
      location_id: locationId,
    };

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
      if (!locationId) continue;
      const payload: Record<string, unknown> = {
        name: String(raw.name),
        email: email || null,
        phone: phone || null,
        notes: String(raw.notes ?? ""),
        created_at: new Date().toISOString(),
        location_id: locationId,
      };
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
  const callerLocationId = getLocationId(req);
  try {
    // IDOR guard: verify the client belongs to the caller's location before updating
    if (callerLocationId) {
      const { data: existing } = await supabaseAdmin
        .from("clients")
        .select("location_id")
        .eq("id", id)
        .maybeSingle();
      if (!existing) return res.status(404).json({ error: "not found" });
      if (String(existing.location_id) !== callerLocationId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const updates: Record<string, unknown> = {};
    if (c.name != null) updates.name = c.name;
    if (c.email != null) updates.email = c.email;
    if (c.phone != null) updates.phone = c.phone;
    if (c.notes != null) updates.notes = c.notes;

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
  const { id } = req.params;
  try {
    // Remove bookings referencing this client first (foreign key constraint)
    const { error: bErr } = await supabaseAdmin.from("bookings").delete().eq("client_id", id);
    if (bErr) {
      console.error("DELETE /api/clients/:id — bookings delete error", bErr);
      return res.status(500).json({ error: "Failed to remove client bookings" });
    }
    const { error: cErr } = await supabaseAdmin.from("clients").delete().eq("id", id);
    if (cErr) {
      console.error("DELETE /api/clients/:id — client delete error", cErr);
      return res.status(500).json({ error: "Failed to delete client" });
    }
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

/**
 * findOrCreateClient — smart dedup with email-first, phone-fallback.
 * When updateStats is provided the client's visit_count and total_spent are incremented.
 * Call WITHOUT updateStats when reserving a slot (awaiting_payment); WITH updateStats
 * when payment is confirmed (Stripe webhook).
 */
export async function findOrCreateClient(params: {
  locationId: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  dob?: string;
  notes?: string;
  updateStats?: { depositAmount: number; bookingDate: string };
}): Promise<string | null> {
  const { locationId, name, source, dob, notes, updateStats } = params;
  if (!name || !locationId) return null;

  const email = (params.email ?? "").trim().toLowerCase();
  const rawPhone = (params.phone ?? "").trim().replace(/\s/g, "");
  // Normalise +44XXXXXXXXXX → 0XXXXXXXXXX for phone dedup
  const phone = rawPhone.replace(/^\+44/, "0");

  try {
    let existing: Record<string, unknown> | null = null;

    // 1. Email lookup (primary)
    if (email) {
      const { data } = await supabaseAdmin
        .from("clients")
        .select("id, visit_count, total_spent, email, phone, name")
        .eq("location_id", locationId)
        .ilike("email", email)
        .maybeSingle();
      if (data) existing = data as Record<string, unknown>;
    }

    // 2. Phone lookup within location (fallback — try both normalised forms)
    if (!existing && phone) {
      const altPhone = rawPhone; // original (e.g. +447...)
      const { data } = await supabaseAdmin
        .from("clients")
        .select("id, visit_count, total_spent, email, phone, name")
        .eq("location_id", locationId)
        .or(`phone.eq.${phone},phone.eq.${altPhone}`)
        .maybeSingle();
      if (data) existing = data as Record<string, unknown>;
    }

    // 3. Cross-location email lookup — client exists under a different (or null) location_id
    if (!existing && email) {
      const { data } = await supabaseAdmin
        .from("clients")
        .select("id, visit_count, total_spent, email, phone, name, location_id")
        .ilike("email", email)
        .maybeSingle();
      if (data) {
        existing = data as Record<string, unknown>;
        // Migrate their location_id to the current location silently
        await supabaseAdmin
          .from("clients")
          .update({ location_id: locationId })
          .eq("id", String(data.id));
      }
    }

    if (existing) {
      const updates: Record<string, unknown> = {
        // Fill gaps — never overwrite existing values with empty
        name: name || existing.name,
        ...(email && !existing.email ? { email } : {}),
        ...(phone && !existing.phone ? { phone } : {}),
        ...(dob ? { date_of_birth: dob } : {}),
      };
      if (updateStats) {
        updates.visit_count = Number(existing.visit_count ?? 0) + 1;
        updates.total_spent = Number(existing.total_spent ?? 0) + updateStats.depositAmount;
        updates.last_visit = updateStats.bookingDate;
      }
      await supabaseAdmin.from("clients").update(updates).eq("id", String(existing.id));
      return String(existing.id);
    }

    // 3. Genuinely new client — INSERT
    const payload: Record<string, unknown> = {
      location_id: locationId,
      name,
      email: email || null,
      phone: phone || null,
      notes: notes ?? "",
      source: source ?? "Website",
      created_at: new Date().toISOString(),
      visit_count: updateStats ? 1 : 0,
      total_spent: updateStats ? updateStats.depositAmount : 0,
      last_visit: updateStats ? updateStats.bookingDate : null,
    };
    if (dob) payload.date_of_birth = dob;

    const { data: inserted, error } = await supabaseAdmin
      .from("clients")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return String(inserted.id);
  } catch (err) {
    console.error("findOrCreateClient", err);
    return null;
  }
}

/** Backward-compat alias used by bookings route (no stat updates) */
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
  if (!data.locationId) return null;
  return findOrCreateClient({
    locationId: data.locationId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    source: data.source,
    dob: data.dob,
    notes: data.notes,
    // no updateStats — called before payment confirmed
  });
}

export async function clearSampleClients(locationId?: string): Promise<void> {
  const SAMPLE_NAMES = ["Ellisha W.", "Donna S.", "Sophie M.", "Chloe R.", "Amara J.", "Priya K.", "Zara T."];
  let q = supabaseAdmin.from("clients").delete().in("name", SAMPLE_NAMES);
  if (locationId) q = q.eq("location_id", locationId);
  await q;
}

export default router;
