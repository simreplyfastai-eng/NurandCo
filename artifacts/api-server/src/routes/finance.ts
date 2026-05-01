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

// GET /api/finance/summary?month=YYYY-MM — requires admin JWT
router.get("/finance/summary", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { month } = req.query as Record<string, string>;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "month=YYYY-MM required" });
  }
  try {
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;

    let query = supabaseAdmin
      .from("bookings")
      .select("booking_date, total_amount, deposit_amount, status, deposit_paid, balance_paid")
      .gte("booking_date", startDate)
      .lte("booking_date", endDate);

    const locationId = getLocationId(req);
    if (locationId) query = query.eq("location_id", locationId);

    const { data, error } = await query;
    if (error) throw error;

    let totalRevenue = 0;
    let depositsCollected = 0;
    let balanceOutstanding = 0;
    let bookingCount = 0;

    for (const b of (data ?? [])) {
      const total = Number(b.total_amount ?? 0);
      const dep = Number(b.deposit_amount ?? 0);
      const balPaid = Boolean(b.balance_paid);
      if (b.status !== "cancelled") {
        totalRevenue += total;
        bookingCount++;
        const bal = b.balance_due != null ? Number(b.balance_due) : Math.max(0, total - dep);
        // outstanding only if balance not yet paid
        if (bal > 0 && !balPaid) balanceOutstanding += bal;
      }
      if (b.deposit_paid) depositsCollected += dep;
      if (balPaid) {
        // when full balance is paid, count remaining (price - deposit) as collected too
        const bal = b.balance_due != null ? Number(b.balance_due) : Math.max(0, total - dep);
        depositsCollected += bal;
      }
    }

    return res.json({
      totalRevenue,
      depositsCollected,
      balanceOutstanding,
      bookingCount,
    });
  } catch (err) {
    console.error("GET /api/finance/summary", err);
    return res.status(500).json({ error: "db error" });
  }
});

// GET /api/finance/monthly?month=YYYY-MM — requires admin JWT
// Returns { day: number, revenue: number, cumulative: number }[]
router.get("/finance/monthly", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const { month } = req.query as Record<string, string>;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "month=YYYY-MM required" });
  }
  try {
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;

    let query = supabaseAdmin
      .from("bookings")
      .select("booking_date, total_amount, status")
      .gte("booking_date", startDate)
      .lte("booking_date", endDate);

    const locationId = getLocationId(req);
    if (locationId) query = query.eq("location_id", locationId);

    const { data, error } = await query;
    if (error) throw error;

    const dailyMap: Record<number, number> = {};
    for (const b of (data ?? [])) {
      if (b.status !== "cancelled") {
        const day = new Date(b.booking_date as string).getUTCDate();
        dailyMap[day] = (dailyMap[day] ?? 0) + Number(b.total_amount ?? 0);
      }
    }

    let cum = 0;
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      cum += dailyMap[d] ?? 0;
      days.push({ day: d, revenue: dailyMap[d] ?? 0, cumulative: cum });
    }
    return res.json(days);
  } catch (err) {
    console.error("GET /api/finance/monthly", err);
    return res.status(500).json({ error: "db error" });
  }
});

export default router;
