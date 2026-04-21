import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { buildICSContent } from "../lib/email";

const router = Router();

// GET /api/calendar/ics?booking=[id]
router.get("/calendar/ics", async (req, res) => {
  const bookingId = req.query.booking as string | undefined;
  if (!bookingId) return res.status(400).send("booking id required");

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(bookingId)) return res.status(404).send("Booking not found");

  try {
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("id, treatment_name, booking_date, time_slot, duration_minutes, location_id, deposit_amount, total_amount")
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !booking) return res.status(404).send("Booking not found");

    // Fetch location info
    const locRes = await supabaseAdmin
      .from("locations")
      .select("name, address")
      .eq("id", booking.location_id)
      .maybeSingle();

    const location = {
      name: String(locRes.data?.name ?? "StarrBeauty"),
      address_full: String(locRes.data?.address ?? locRes.data?.name ?? "StarrBeauty Clinic"),
    };

    const bk = {
      id: String(booking.id),
      treatment_name: String(booking.treatment_name ?? "Appointment"),
      booking_date: String(booking.booking_date ?? ""),
      time_slot: String(booking.time_slot ?? "09:00"),
      duration_minutes: Number(booking.duration_minutes ?? 60),
      deposit_amount: Number(booking.deposit_amount ?? 0),
      total_price: Number(booking.total_amount ?? 0),
    };

    const ics = buildICSContent(bk, location);

    res.set({
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="starrbeauty-appointment.ics"',
      "Cache-Control": "no-cache",
    });
    return res.send(ics);
  } catch (err) {
    console.error("GET /api/calendar/ics", err);
    return res.status(500).send("Server error");
  }
});

export default router;
