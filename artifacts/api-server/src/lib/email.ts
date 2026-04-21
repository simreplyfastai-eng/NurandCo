import { Resend } from "resend";

const RESEND_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = "StarrBeauty <info@starrbeautyy.co.uk>";
const SITE_URL = (process.env.PUBLIC_URL ?? "").replace(/\/$/, "");

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!RESEND_KEY) return null;
  if (!_resend) _resend = new Resend(RESEND_KEY);
  return _resend;
}

// ── Date / time helpers ───────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function fmtDateUK(dateStr: string): string {
  if (!dateStr) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function addMinutesToTime(time: string, mins: number): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

type CalBooking = {
  treatment_name: string;
  booking_date: string;
  time_slot: string;
  duration_minutes?: number;
  id?: string;
  deposit_amount?: number;
  total_price?: number;
};
type CalLocation = { name: string; address_full: string };

export function buildGoogleCalendarUrl(booking: CalBooking, location: CalLocation): string {
  const start = booking.time_slot.slice(0, 5);
  const end = addMinutesToTime(start, booking.duration_minutes ?? 60);
  const fmt = (d: string, t: string) => d.replace(/-/g, "") + "T" + t.replace(":", "") + "00";
  const title = encodeURIComponent(`${booking.treatment_name} @ StarrBeauty`);
  const details = encodeURIComponent(
    `StarrBeauty appointment\nTreatment: ${booking.treatment_name}\nLocation: ${location.address_full}\nContact: wa.me/447701298985`,
  );
  const loc = encodeURIComponent(location.address_full);
  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${title}&dates=${fmt(booking.booking_date, start)}/${fmt(booking.booking_date, end)}` +
    `&details=${details}&location=${loc}`
  );
}

export function buildICSContent(booking: CalBooking, location: CalLocation): string {
  const start = booking.time_slot.slice(0, 5);
  const end = addMinutesToTime(start, booking.duration_minutes ?? 60);
  const dtFmt = (d: string, t: string) => `${d.replace(/-/g, "")}T${t.replace(":", "")}00`;
  const stamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const uid = `${booking.id ?? Date.now()}@starrbeautyy.co.uk`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StarrBeauty//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/London:${dtFmt(booking.booking_date, start)}`,
    `DTEND;TZID=Europe/London:${dtFmt(booking.booking_date, end)}`,
    `SUMMARY:${booking.treatment_name} @ StarrBeauty`,
    `DESCRIPTION:Treatment: ${booking.treatment_name}\\nContact: +44 7701 298985`,
    `LOCATION:${location.address_full}`,
    `ORGANIZER;CN=StarrBeauty:mailto:info@starrbeautyy.co.uk`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// ── Base email template ───────────────────────────────────────────────────────

function buildEmail(content: string, subject: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:-apple-system,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
  <tr><td align="center">

  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:12px;border:1px solid #E8DDD3;box-shadow:0 2px 12px rgba(92,30,30,0.06);">
  <tr><td>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="background:#5C1E1E;padding:28px 40px;border-radius:12px 12px 0 0;text-align:center;">
        <div style="font-family:Georgia,serif;font-size:26px;color:#FFFFFF;letter-spacing:0.12em;font-weight:normal;">STARR</div>
        <div style="font-family:-apple-system,Arial,sans-serif;font-size:10px;color:#C9A96E;letter-spacing:0.28em;margin-top:2px;">BEAUTY</div>
      </td>
    </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="height:3px;background:#C9A96E;"></td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:36px 40px;">${content}</td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:24px 40px;border-top:1px solid #E8DDD3;text-align:center;">
        <p style="margin:0 0 8px;font-size:11px;color:#8C7B6B;letter-spacing:0.08em;">STARR BEAUTY &middot; ESSEX &amp; LONDON</p>
        <p style="margin:0 0 4px;font-size:11px;color:#8C7B6B;">
          <a href="mailto:info@starrbeautyy.co.uk" style="color:#C9A96E;text-decoration:none;">info@starrbeautyy.co.uk</a>
          &nbsp;&middot;&nbsp;
          <a href="https://wa.me/447701298985" style="color:#C9A96E;text-decoration:none;">WhatsApp Us</a>
        </p>
        <p style="margin:8px 0 0;font-size:10px;color:#B5A89A;">&copy; 2026 StarrBeauty. All rights reserved.</p>
      </td>
    </tr>
    </table>

  </td></tr>
  </table>

  </td></tr>
  </table>
</body>
</html>`;
}

// ── Booking details box ───────────────────────────────────────────────────────

function buildBookingBox(booking: CalBooking, location: CalLocation): string {
  const deposit = booking.deposit_amount ?? 0;
  const balance = Math.max(0, (booking.total_price ?? 0) - deposit);
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:20px 0;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:6px 0;border-bottom:1px solid #E8DDD3;">
      <span style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;">Treatment</span><br>
      <span style="font-size:16px;color:#5C1E1E;font-family:Georgia,serif;">${booking.treatment_name}</span>
    </td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #E8DDD3;">
      <span style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;">Date &amp; Time</span><br>
      <span style="font-size:15px;color:#2C2420;font-weight:600;">${formatDate(booking.booking_date)} at ${booking.time_slot}</span>
    </td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #E8DDD3;">
      <span style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;">Location</span><br>
      <span style="font-size:14px;color:#2C2420;">${location.name}</span><br>
      <span style="font-size:12px;color:#8C7B6B;">${location.address_full}</span>
    </td></tr>
    <tr><td style="padding:10px 0 6px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <span style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;">Deposit Paid</span><br>
          <span style="font-size:15px;color:#5C1E1E;font-weight:600;">&pound;${deposit}</span>
        </td>
        <td align="right">
          <span style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;">Balance Due on Day</span><br>
          <span style="font-size:15px;color:#2C2420;font-weight:600;">&pound;${balance}</span>
        </td>
      </tr></table>
    </td></tr>
    </table>
  </td></tr>
  </table>`;
}

// Helper: log HTML to console when Resend is not configured
function logEmailPreview(subject: string, to: string, html: string): void {
  console.log(`\n[EMAIL PREVIEW — no RESEND_API_KEY]\nTo: ${to}\nSubject: ${subject}\n${"─".repeat(60)}\n${html}\n${"─".repeat(60)}\n`);
}

// ── Email 1 — Client booking confirmation (trigger: after consent submitted) ──

export async function sendClientConfirmationEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  durationMinutes: number;
  deposit: number;
  balance: number;
  bookingId?: string;
  depositPaid?: boolean;
  whatsapp: string;
  locationName?: string;
  locationAddress?: string;
  formsUrl?: string;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const loc: CalLocation = {
    name: params.locationName ?? "StarrBeauty",
    address_full: params.locationAddress ?? "StarrBeauty Clinic",
  };
  const bk: CalBooking = {
    treatment_name: params.treatment,
    booking_date: params.date,
    time_slot: params.time,
    deposit_amount: params.deposit,
    total_price: params.deposit + params.balance,
    duration_minutes: params.durationMinutes,
    id: params.bookingId,
  };
  const googleUrl = buildGoogleCalendarUrl(bk, loc);
  const icsUrl = params.bookingId
    ? `${SITE_URL}/api/calendar/ics?booking=${params.bookingId}`
    : "#";

  const content = `
    <p style="font-size:24px;font-family:Georgia,serif;color:#5C1E1E;margin:0 0 6px;">You're booked in! &#10024;</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Hi ${firstName}, your appointment is confirmed. We can't wait to see you.</p>

    ${buildBookingBox(bk, loc)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="text-align:center;">
      <p style="font-size:12px;color:#8C7B6B;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em;">Add to your calendar</p>
      <a href="${googleUrl}" target="_blank" style="display:inline-block;margin:4px;padding:10px 18px;background:#C9A96E;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:12px;letter-spacing:0.08em;">+ GOOGLE CALENDAR</a>
      <a href="${icsUrl}" style="display:inline-block;margin:4px;padding:10px 18px;background:#5C1E1E;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:12px;letter-spacing:0.08em;">+ APPLE CALENDAR</a>
    </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border-left:3px solid #C9A96E;margin:0 0 20px;">
    <tr><td style="padding:16px 20px;">
      <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 10px;">Before your appointment</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;line-height:1.6;">&#10022; Arrive 5 minutes before your slot</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;line-height:1.6;">&#10022; Come with a clean face &mdash; no makeup on the treatment area</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;line-height:1.6;">&#10022; Avoid alcohol for 24 hours beforehand</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;line-height:1.6;">&#10022; Avoid blood thinners (aspirin, fish oil) 24hrs before injectables</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;line-height:1.6;">&#10022; Contact us if any medical details change</p>
    </td></tr>
    </table>

    <p style="font-size:12px;color:#8C7B6B;line-height:1.6;margin:0 0 20px;border-top:1px solid #E8DDD3;padding-top:16px;">
      <strong style="color:#5C1E1E;">Cancellation policy:</strong> Please give at least 48 hours notice to cancel or reschedule. Deposits are non-refundable for cancellations under 48 hours or no-shows. To reschedule, WhatsApp us at <a href="https://wa.me/447701298985" style="color:#C9A96E;">+44 7701 298985</a>
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <a href="https://instagram.com/StarrAestheticss" style="display:inline-block;margin:0 6px;font-size:11px;color:#C9A96E;text-decoration:none;letter-spacing:0.08em;">@StarrAestheticss</a>
      <a href="https://instagram.com/StarrFacess" style="display:inline-block;margin:0 6px;font-size:11px;color:#C9A96E;text-decoration:none;letter-spacing:0.08em;">@StarrFacess</a>
      <a href="https://instagram.com/StarrNailedd" style="display:inline-block;margin:0 6px;font-size:11px;color:#C9A96E;text-decoration:none;letter-spacing:0.08em;">@StarrNailedd</a>
    </td></tr>
    </table>`;

  const subject = `✨ Confirmed: ${params.treatment} at StarrBeauty`;
  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html });
  } catch (err) {
    console.error("sendClientConfirmationEmail error", err);
  }
}

// ── Email 2 — Admin new booking alert (trigger: after Stripe payment) ─────────

export async function sendAdminNotificationEmail(params: {
  adminEmail: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  treatment: string;
  durationMinutes: number;
  date: string;
  time: string;
  deposit: number;
  depositPaid?: boolean;
  source: string;
  locationName?: string;
  locationAddress?: string;
  bookingId?: string;
}): Promise<void> {
  const dateDisp = params.date ? fmtDateUK(params.date) : "TBC";
  const loc: CalLocation = {
    name: params.locationName ?? "StarrBeauty",
    address_full: params.locationAddress ?? params.locationName ?? "StarrBeauty Clinic",
  };
  const bk: CalBooking = {
    treatment_name: params.treatment,
    booking_date: params.date,
    time_slot: params.time,
    deposit_amount: params.deposit,
    total_price: params.deposit,
    duration_minutes: params.durationMinutes,
    id: params.bookingId,
  };
  const portalUrl = `${SITE_URL}/portal.html`;

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1E1E;margin:0 0 6px;">New Booking Received</p>
    <p style="font-size:13px;color:#8C7B6B;margin:0 0 24px;">A new appointment has been booked and deposit payment received.</p>

    ${buildBookingBox(bk, loc)}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 20px;">
    <tr><td style="padding:16px 24px;">
      <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 12px;">Client Details</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Name:</strong> ${params.clientName}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Email:</strong> <a href="mailto:${params.clientEmail}" style="color:#C9A96E;">${params.clientEmail || "—"}</a></p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Phone:</strong> <a href="tel:${params.clientPhone}" style="color:#C9A96E;">${params.clientPhone || "—"}</a></p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Deposit:</strong> <span style="color:#5C1E1E;font-weight:600;">&pound;${params.deposit} ${params.depositPaid ? "&#x2713; paid" : "pending"}</span></p>
      <p style="font-size:14px;color:#2C2420;margin:8px 0 4px;"><strong>Forms:</strong> <span style="background:#FFF3CD;color:#856404;padding:2px 8px;border-radius:4px;font-size:12px;">Pending</span></p>
      <p style="font-size:12px;color:#8C7B6B;margin:4px 0;">Booked via ${params.source} &middot; ${dateDisp} at ${params.time}</p>
    </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <a href="${portalUrl}" style="display:inline-block;padding:12px 28px;background:#5C1E1E;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;letter-spacing:0.1em;">VIEW IN ADMIN PORTAL &rarr;</a>
    </td></tr>
    </table>`;

  const subject = `💅 New Booking: ${params.clientName} — ${params.treatment}`;
  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.adminEmail) {
    logEmailPreview(subject, params.adminEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.adminEmail, subject, html });
  } catch (err) {
    console.error("sendAdminNotificationEmail error", err);
  }
}

// ── Email 3 — 24hr reminder (trigger: hourly cron) ───────────────────────────

export async function sendReminderEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  whatsapp: string;
  locationName?: string;
  locationAddress?: string;
  durationMinutes?: number;
  bookingId?: string;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const loc: CalLocation = {
    name: params.locationName ?? "StarrBeauty",
    address_full: params.locationAddress ?? params.locationName ?? "StarrBeauty Clinic",
  };
  const bk: CalBooking = {
    treatment_name: params.treatment,
    booking_date: params.date,
    time_slot: params.time,
    duration_minutes: params.durationMinutes ?? 60,
    id: params.bookingId,
  };

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1E1E;margin:0 0 6px;">Your appointment is tomorrow &#10024;</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Hi ${firstName}, just a friendly reminder about your upcoming appointment.</p>

    ${buildBookingBox(bk, loc)}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border-left:3px solid #C9A96E;margin:0 0 20px;">
    <tr><td style="padding:16px 20px;">
      <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 10px;">Your pre-appointment checklist</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;">&#10022; Clean face, no makeup on treatment area</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;">&#10022; Avoid alcohol tonight</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;">&#10022; Arrive 5 minutes early</p>
      <p style="font-size:13px;color:#2C2420;margin:4px 0;">&#10022; Bring a valid ID</p>
    </td></tr>
    </table>

    <p style="font-size:13px;color:#8C7B6B;margin:0 0 16px;line-height:1.6;">Need to cancel or reschedule? Please let us know as soon as possible. <a href="https://wa.me/447701298985" style="color:#C9A96E;text-decoration:none;">WhatsApp us here &rarr;</a></p>`;

  const subject = `⏰ Tomorrow: ${params.treatment} at ${params.time}`;
  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html });
  } catch (err) {
    console.error("sendReminderEmail error", err);
  }
}

// ── Email 4 — Cancellation (trigger: admin sets status → cancelled) ───────────

export async function sendCancellationEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  whatsapp: string;
  locationName?: string;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const locationName = params.locationName ?? "StarrBeauty";

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1E1E;margin:0 0 6px;">Appointment Cancelled</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Hi ${firstName}, your appointment has been cancelled. We hope to see you again soon.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 20px;">
    <tr><td style="padding:16px 24px;">
      <p style="font-size:12px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Cancelled Appointment</p>
      <p style="font-size:15px;color:#5C1E1E;font-family:Georgia,serif;margin:0 0 4px;text-decoration:line-through;">${params.treatment}</p>
      <p style="font-size:13px;color:#8C7B6B;margin:0;">${formatDate(params.date)} at ${params.time} &middot; ${locationName}</p>
    </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr><td align="center">
      <a href="https://wa.me/447701298985" style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;letter-spacing:0.1em;">REBOOK VIA WHATSAPP &rarr;</a>
    </td></tr>
    </table>`;

  const subject = `Your StarrBeauty appointment has been cancelled`;
  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html });
  } catch (err) {
    console.error("sendCancellationEmail error", err);
  }
}

// ── Email 5 — Forms reminder (trigger: cron — forms pending + appt within 48h) ─

export async function sendFormsReminderEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  bookingId: string;
  locationName?: string;
  locationAddress?: string;
  durationMinutes?: number;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const loc: CalLocation = {
    name: params.locationName ?? "StarrBeauty",
    address_full: params.locationAddress ?? params.locationName ?? "StarrBeauty Clinic",
  };
  const bk: CalBooking = {
    treatment_name: params.treatment,
    booking_date: params.date,
    time_slot: params.time,
    duration_minutes: params.durationMinutes ?? 60,
    id: params.bookingId,
  };
  const formsUrl = `${SITE_URL}/forms.html?booking=${params.bookingId}`;

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1E1E;margin:0 0 6px;">Please complete your forms</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Hi ${firstName}, your appointment is coming up but we still need your forms. It only takes 2 minutes.</p>

    ${buildBookingBox(bk, loc)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr><td align="center">
      <a href="${formsUrl}" style="display:inline-block;padding:14px 32px;background:#5C1E1E;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:14px;letter-spacing:0.1em;">COMPLETE YOUR FORMS &rarr;</a>
      <p style="font-size:11px;color:#8C7B6B;margin:8px 0 0;">Medical intake + consent form</p>
    </td></tr>
    </table>`;

  const subject = `⚡ Action needed before your appointment`;
  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html });
  } catch (err) {
    console.error("sendFormsReminderEmail error", err);
  }
}

// ── Consultation confirmation (kept for backwards compat) ─────────────────────

export async function sendConsultationConfirmationEmail(params: {
  clientEmail: string;
  clientName: string;
  date: string;
  time: string;
  whatsapp: string;
  locationName?: string;
  locationAddress?: string;
}): Promise<void> {
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const dateStr = params.date ? formatDate(params.date) : "To be confirmed";
  const wa = params.whatsapp || "available on request";
  const locationName = params.locationName ?? "StarrBeauty";
  const locationAddress = params.locationAddress ?? "StarrBeauty Clinic";

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1E1E;margin:0 0 6px;">We're excited to meet you, ${firstName}</p>
    <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Your consultation is booked. This is your first step towards your aesthetic goals.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:20px 0;">
    <tr><td style="padding:20px 24px;">
      <p style="font-size:11px;color:#8C7B6B;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Aesthetic Consultation</p>
      <p style="font-size:16px;color:#5C1E1E;font-family:Georgia,serif;margin:0 0 8px;">${dateStr} at ${params.time}</p>
      <p style="font-size:13px;color:#8C7B6B;margin:0;">${locationName}, ${locationAddress}</p>
      <p style="font-size:13px;color:#5C1E1E;font-weight:600;margin:12px 0 0;">&pound;25 consultation fee</p>
    </td></tr>
    </table>
    <p style="font-size:13px;color:#8C7B6B;margin:0 0 8px;">Questions before your visit? <a href="https://wa.me/${wa.replace(/\s/g, "")}" style="color:#C9A96E;text-decoration:none;">WhatsApp us</a></p>
    <p style="font-size:12px;color:#8C7B6B;margin:0;font-style:italic;">Please arrive 5 minutes early. We look forward to seeing you.</p>`;

  const subject = `Consultation confirmed — StarrBeauty ${locationName}`;
  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.clientEmail) {
    logEmailPreview(subject, params.clientEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.clientEmail, subject, html });
  } catch (err) {
    console.error("sendConsultationConfirmationEmail error", err);
  }
}

// ── Consultation admin notification (kept for backwards compat) ───────────────

export async function sendConsultationAdminEmail(params: {
  adminEmail: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientDOB: string;
  clientNotes: string;
  treatmentInterest: string;
  date: string;
  time: string;
  locationName?: string;
}): Promise<void> {
  const dateDisp = params.date ? fmtDateUK(params.date) : "TBC";
  const locationName = params.locationName ?? "StarrBeauty";

  const content = `
    <p style="font-size:22px;font-family:Georgia,serif;color:#5C1E1E;margin:0 0 6px;">New consultation booked</p>
    <p style="font-size:13px;color:#8C7B6B;margin:0 0 24px;">A new aesthetic consultation has been scheduled.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 20px;">
    <tr><td style="padding:16px 24px;">
      <p style="font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 12px;">Client Details</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Name:</strong> ${params.clientName}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Email:</strong> <a href="mailto:${params.clientEmail}" style="color:#C9A96E;">${params.clientEmail || "—"}</a></p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Phone:</strong> <a href="tel:${params.clientPhone}" style="color:#C9A96E;">${params.clientPhone || "—"}</a></p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>DOB:</strong> ${params.clientDOB || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Treatment interest:</strong> ${params.treatmentInterest || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Skin concerns:</strong> ${params.clientNotes || "—"}</p>
      <p style="font-size:14px;color:#2C2420;margin:8px 0 0;"><strong>Date:</strong> ${dateDisp} at ${params.time} &middot; ${locationName}</p>
      <p style="font-size:14px;color:#2C2420;margin:4px 0;"><strong>Fee:</strong> <span style="color:#5C1E1E;font-weight:600;">&pound;25 &#x2713;</span></p>
    </td></tr>
    </table>`;

  const subject = `New Consultation — ${params.clientName} — ${dateDisp} at ${params.time} [${locationName}]`;
  const html = buildEmail(content, subject);
  const resend = getResend();
  if (!resend || !params.adminEmail) {
    logEmailPreview(subject, params.adminEmail, html);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: params.adminEmail, subject, html });
  } catch (err) {
    console.error("sendConsultationAdminEmail error", err);
  }
}

// ── Training enquiry emails ────────────────────────────────────────────────────

export async function sendEnquiryEmails(params: {
  adminEmail: string;
  name: string;
  email: string;
  phone: string;
  courseName: string;
  locationLabel: string;
  experienceLevel?: string | null;
  message?: string | null;
  enquiryId?: string;
}): Promise<void> {
  const firstName = params.name.split(" ")[0] ?? params.name;
  const refCode = `ENQ-${(params.enquiryId ?? "").slice(0, 8).toUpperCase()}`;
  const resend = getResend();
  const submittedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });

  const promises: Promise<unknown>[] = [];

  // EMAIL A — Admin alert
  if (params.adminEmail) {
    const adminSubject = `📚 New Training Enquiry: ${params.name} — ${params.courseName}`;
    const adminContent = `
      <p style="font-size:22px;font-family:Georgia,serif;color:#5C1E1E;margin:0 0 16px;">New Training Enquiry Received</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 24px;">
        <tr><td style="padding:20px 24px;">
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Name:</strong> ${params.name}</p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Email:</strong> <a href="mailto:${params.email}" style="color:#C9A96E;">${params.email}</a></p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Phone:</strong> <a href="tel:${params.phone}" style="color:#C9A96E;">${params.phone}</a></p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Course:</strong> ${params.courseName}</p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Experience:</strong> ${params.experienceLevel || "—"}</p>
          ${params.message ? `<p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Message:</strong> ${params.message}</p>` : ""}
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Submitted:</strong> ${submittedAt}</p>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
        <tr>
          <td style="padding-right:8px;">
            <a href="https://wa.me/${params.phone.replace(/\D/g, "")}" style="display:inline-block;background:#C9A96E;color:#FFFFFF;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;padding:12px 24px;text-decoration:none;border-radius:4px;">Reply via WhatsApp</a>
          </td>
          <td>
            <a href="/portal.html" style="display:inline-block;background:#5C1E1E;color:#FFFFFF;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;padding:12px 24px;text-decoration:none;border-radius:4px;">View in Portal</a>
          </td>
        </tr>
      </table>`;
    const adminHtml = buildEmail(adminContent, adminSubject);
    if (!resend) {
      logEmailPreview(adminSubject, params.adminEmail, adminHtml);
    } else {
      promises.push(
        resend.emails
          .send({ from: FROM, to: params.adminEmail, subject: adminSubject, html: adminHtml })
          .catch((e: unknown) => console.error("sendEnquiryEmails admin error", e)),
      );
    }
  }

  // EMAIL B — Auto-reply to enquirer
  if (params.email) {
    const clientSubject = `Thanks for your enquiry — Starr Academy`;
    const clientContent = `
      <p style="font-size:22px;font-family:Georgia,serif;color:#5C1E1E;margin:0 0 16px;">We've received your enquiry ✨</p>
      <p style="font-size:15px;color:#2C2420;margin:0 0 8px;">Hi ${firstName},</p>
      <p style="font-size:14px;color:#8C7B6B;margin:0 0 24px;">Thank you for your interest in the <strong style="color:#5C1E1E;">${params.courseName}</strong>. Eva will be in touch within 24 hours.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE8;border-radius:8px;border:1px solid #E8DDD3;margin:0 0 24px;">
        <tr><td style="padding:20px 24px;">
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Course:</strong> ${params.courseName}</p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Location:</strong> ${params.locationLabel}</p>
          <p style="font-size:14px;color:#2C2420;margin:5px 0;"><strong>Reference:</strong> ${refCode}</p>
        </td></tr>
      </table>
      <p style="font-size:14px;color:#8C7B6B;margin:0 0 16px;">In the meantime, feel free to reach out:</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td>
            <a href="https://wa.me/447701298985" style="display:inline-block;background:#C9A96E;color:#FFFFFF;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;padding:12px 28px;text-decoration:none;border-radius:4px;">WhatsApp Us</a>
          </td>
        </tr>
      </table>
      <p style="font-size:13px;color:#8C7B6B;margin:0;">
        Instagram: <a href="https://instagram.com/StarrAestheticss" style="color:#C9A96E;">@StarrAestheticss</a> &nbsp;·&nbsp; <a href="https://instagram.com/StarrFacess" style="color:#C9A96E;">@StarrFacess</a>
      </p>`;
    const clientHtml = buildEmail(clientContent, clientSubject);
    if (!resend) {
      logEmailPreview(clientSubject, params.email, clientHtml);
    } else {
      promises.push(
        resend.emails
          .send({ from: FROM, to: params.email, subject: clientSubject, html: clientHtml })
          .catch((e: unknown) => console.error("sendEnquiryEmails client error", e)),
      );
    }
  }

  await Promise.all(promises);
}
