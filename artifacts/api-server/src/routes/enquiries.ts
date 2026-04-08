import { Router, type Request, type Response, type NextFunction } from "express";
import { pool } from "@workspace/db";
import { sendEnquiryEmails } from "../lib/email";
import jwt from "jsonwebtoken";

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.slice(7);
  const secret = process.env.SESSION_SECRET ?? "dev-secret";
  try {
    jwt.verify(token, secret);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

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
router.get("/enquiries", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM enquiries ORDER BY created_at DESC",
    );
    return res.json({ enquiries: result.rows.map(rowToEnquiry) });
  } catch (err) {
    console.error("GET /api/enquiries", err);
    return res.status(500).json({ error: "db error" });
  }
});

// POST /api/enquiries
router.post("/enquiries", async (req, res) => {
  const { name, email, phone, course, message } = req.body as Record<string, string>;
  if (!name || !email || !phone || !course) {
    return res.status(400).json({ error: "name, email, phone, course required" });
  }
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  try {
    await pool.query(
      `INSERT INTO enquiries (id, name, email, phone, course, message, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'New',$7)`,
      [id, name.trim(), email.trim().toLowerCase(), phone.trim(), course.trim(), (message ?? "").trim(), Date.now()],
    );
    const result = await pool.query("SELECT * FROM enquiries WHERE id=$1", [id]);
    const enquiry = rowToEnquiry(result.rows[0]);

    // Send emails (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL ?? "";
    sendEnquiryEmails({ adminEmail, name, email, phone, course, message: message ?? "" }).catch(() => {});

    return res.status(201).json(enquiry);
  } catch (err) {
    console.error("POST /api/enquiries", err);
    return res.status(500).json({ error: "db error" });
  }
});

// PUT /api/enquiries/:id  — update status (protected)
router.put("/enquiries/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  if (!status) return res.status(400).json({ error: "status required" });
  try {
    await pool.query("UPDATE enquiries SET status=$2 WHERE id=$1", [id, status]);
    const result = await pool.query("SELECT * FROM enquiries WHERE id=$1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "not found" });
    return res.json(rowToEnquiry(result.rows[0]));
  } catch (err) {
    console.error("PUT /api/enquiries/:id", err);
    return res.status(500).json({ error: "db error" });
  }
});

export default router;
