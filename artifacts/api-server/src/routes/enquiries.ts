import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { sendEnquiryEmails } from "../lib/email";
import { requireAuth } from "../lib/auth";
import { sanitize } from "../lib/sanitize";

const router = Router();

const COURSE_LOCATION_SLUG: Record<string, string> = {
  "Essex Masterclass": "hornchurch",
  "London Masterclass": "marylebone",
};

const COURSE_LOCATION_LABEL: Record<string, string> = {
  "Essex Masterclass": "[LOCATION_1] Clinic",
  "London Masterclass": "[LOCATION_2] Clinic",
};

function getLocationId(req: import("express").Request): string | null {
  return (
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined) ??
    null
  );
}

function rowToEnquiry(row: Record<string, unknown>) {
  return {
    id: row.id,
    locationId: row.location_id ?? null,
    courseName: row.course_name ?? "",
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    experienceLevel: row.experience_level ?? null,
    message: row.message ?? null,
    status: row.status ?? "new",
    notes: row.notes ?? null,
    createdAt: row.created_at ?? null,
  };
}

// GET /api/enquiries — protected, filtered by location
router.get("/enquiries", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  try {
    const { data, error } = await supabaseAdmin
      .from("enquiries")
      .select("*")
      .eq("location_id", locationId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json({ enquiries: (data ?? []).map(rowToEnquiry) });
  } catch (err) {
    console.error("GET /api/enquiries", err);
    return res.status(500).json({ error: "db error" });
  }
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/enquiries — public
router.post("/enquiries", async (req, res) => {
  const { name, email, phone, course_name, experience_level, message } =
    req.body as Record<string, string>;

  if (!name || name.trim().length < 2)
    return res.status(400).json({ error: "name required (min 2 chars)" });
  if (!email || !EMAIL_RE.test(email.trim()))
    return res.status(400).json({ error: "valid email required" });
  if (!phone || phone.trim().length < 7)
    return res.status(400).json({ error: "phone required (min 7 chars)" });
  if (!course_name)
    return res.status(400).json({ error: "course_name required" });

  // Resolve location_id from course name
  const slug = COURSE_LOCATION_SLUG[course_name.trim()];
  let locationId: string | null = null;
  if (slug) {
    const { data: loc } = await supabaseAdmin
      .from("locations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    locationId = loc?.id ?? null;
  }

  try {
    const { data: row, error } = await supabaseAdmin
      .from("enquiries")
      .insert({
        location_id: locationId,
        course_name: sanitize(course_name) ?? course_name.trim(),
        name: sanitize(name) ?? name.trim(),
        email: email.trim().toLowerCase(),
        phone: sanitize(phone) ?? phone.trim(),
        experience_level: sanitize(experience_level) || null,
        message: sanitize(message) || null,
        status: "new",
      })
      .select()
      .single();

    if (error) throw error;

    const enquiryId = (row?.id as string) ?? "";
    const locationLabel = COURSE_LOCATION_LABEL[course_name.trim()] ?? course_name.trim();
    const adminEmail = process.env.ADMIN_EMAIL ?? "info@[CLIENT_NAME]y.co.uk";

    sendEnquiryEmails({
      adminEmail,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      courseName: course_name.trim(),
      locationLabel,
      experienceLevel: experience_level?.trim() || null,
      message: message?.trim() || null,
      enquiryId,
    }).catch(() => {});

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("POST /api/enquiries", err);
    return res.status(500).json({ error: "Failed to submit enquiry" });
  }
});

// PUT /api/enquiries/:id — protected, update status and/or notes
router.put("/enquiries/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  const { status, notes } = req.body as { status?: string; notes?: string };
  if (!status && notes === undefined)
    return res.status(400).json({ error: "status or notes required" });

  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (notes !== undefined) update.notes = notes;

  try {
    const { error } = await supabaseAdmin
      .from("enquiries")
      .update(update)
      .eq("id", id);
    if (error) throw error;

    const { data: row } = await supabaseAdmin
      .from("enquiries")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!row) return res.status(404).json({ error: "not found" });
    return res.json(rowToEnquiry(row as Record<string, unknown>));
  } catch (err) {
    console.error("PUT /api/enquiries/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

// DELETE /api/enquiries/:id — protected
router.delete("/enquiries/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from("enquiries")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/enquiries/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

export default router;
