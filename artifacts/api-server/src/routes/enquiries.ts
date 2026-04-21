import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { sendEnquiryEmails } from "../lib/email";
import { requireAuth } from "../lib/auth";

const router = Router();

function rowToEnquiry(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    course: row.course ?? "",
    message: row.message ?? "",
    status: row.status ?? "New",
    createdAt: Number(row.created_at ?? 0),
  };
}

// GET /api/enquiries  — protected (admin portal only)
router.get("/enquiries", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const { data, error } = await supabaseAdmin
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json({ enquiries: (data ?? []).map(rowToEnquiry) });
  } catch (err) {
    console.error("GET /api/enquiries", err);
    return res.status(500).json({ error: "db error" });
  }
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/enquiries
router.post("/enquiries", async (req, res) => {
  const { name, email, phone, course, message } = req.body as Record<string, string>;
  if (!name || !email || !phone || !course) {
    return res.status(400).json({ error: "name, email, phone, course required" });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  try {
    const { error } = await supabaseAdmin.from("enquiries").insert({
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      course: course.trim(),
      message: (message ?? "").trim(),
      status: "New",
      created_at: Date.now(),
    });
    if (error) throw error;

    const { data: row } = await supabaseAdmin
      .from("enquiries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    const adminEmail = process.env.ADMIN_EMAIL ?? "";
    sendEnquiryEmails({ adminEmail, name, email, phone, course, message: message ?? "" }).catch(() => {});

    return res.status(201).json(rowToEnquiry((row ?? {}) as Record<string, unknown>));
  } catch (err) {
    console.error("POST /api/enquiries", err);
    return res.status(500).json({ error: "db error" });
  }
});

// PUT /api/enquiries/:id  — update status (protected)
router.put("/enquiries/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { id } = req.params;
  const { status } = req.body as { status: string };
  if (!status) return res.status(400).json({ error: "status required" });
  try {
    const { error } = await supabaseAdmin
      .from("enquiries")
      .update({ status })
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

export default router;
