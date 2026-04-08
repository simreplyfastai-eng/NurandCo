import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// GET /api/finance/summary?month=YYYY-MM
router.get("/finance/summary", async (req, res) => {
  const { month } = req.query as Record<string, string>;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "month=YYYY-MM required" });
  }
  try {
    const pattern = `${month}-%`;
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN price ELSE 0 END),0) AS total_revenue,
         COALESCE(SUM(CASE WHEN deposit_paid = true THEN deposit ELSE 0 END),0) AS deposits_collected,
         COALESCE(SUM(CASE WHEN balance_paid = false AND status != 'Cancelled' THEN GREATEST(price - deposit, 0) ELSE 0 END),0) AS balance_outstanding,
         COUNT(CASE WHEN status != 'Cancelled' THEN 1 END) AS booking_count
       FROM bookings WHERE date LIKE $1`,
      [pattern],
    );
    const row = result.rows[0];
    return res.json({
      totalRevenue: Number(row.total_revenue),
      depositsCollected: Number(row.deposits_collected),
      balanceOutstanding: Number(row.balance_outstanding),
      bookingCount: Number(row.booking_count),
    });
  } catch (err) {
    console.error("GET /api/finance/summary", err);
    return res.status(500).json({ error: "db error" });
  }
});

// GET /api/finance/monthly?month=YYYY-MM
// Returns { day: number, revenue: number, cumulative: number }[]
router.get("/finance/monthly", async (req, res) => {
  const { month } = req.query as Record<string, string>;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "month=YYYY-MM required" });
  }
  try {
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const pattern = `${month}-%`;
    const result = await pool.query(
      `SELECT CAST(SPLIT_PART(date,'-',3) AS INT) AS day,
              SUM(CASE WHEN status != 'Cancelled' THEN price ELSE 0 END) AS revenue
       FROM bookings WHERE date LIKE $1
       GROUP BY day ORDER BY day`,
      [pattern],
    );
    const dailyMap: Record<number, number> = {};
    for (const row of result.rows) {
      dailyMap[Number(row.day)] = Number(row.revenue);
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
