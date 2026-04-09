import { Resend } from "resend";

const RESEND_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = "bookings@dermadoll-aesthetics.co.uk";
const INSTAGRAM = "@dermadollaesthetics";
const CLINIC_ADDRESS = "1500 Stratford Road, Lumi Salon, Hall Green, Birmingham B28 9ET";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!RESEND_KEY) return null;
  if (!_resend) _resend = new Resend(RESEND_KEY);
  return _resend;
}

function fmtDateUK(dateStr: string): string {
  if (!dateStr) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function fmtDateLong(dateStr: string): string {
  if (!dateStr) return dateStr;
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

// ─── Shared layout wrapper ────────────────────────────────────────────────────
function emailShell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dermadoll Aesthetics</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="text-align:center;padding-bottom:28px;">
          <p style="margin:0;font-size:11px;letter-spacing:3px;color:#C9A96E;font-family:Arial,sans-serif;text-transform:uppercase;">Premium Face Clinic</p>
          <h1 style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#ffffff;letter-spacing:1px;">Dermadoll Aesthetics</h1>
          <div style="width:50px;height:1px;background:#C9A96E;margin:16px auto 0;"></div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#1a1a1a;border:1px solid rgba(201,169,110,0.3);border-radius:16px;padding:36px 32px;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="text-align:center;padding-top:28px;">
          <p style="margin:0 0 6px;font-size:12px;color:#555;font-family:Arial,sans-serif;">${CLINIC_ADDRESS}</p>
          <p style="margin:0 0 6px;font-size:12px;color:#555;font-family:Arial,sans-serif;">Instagram: <a href="https://instagram.com/dermadollaesthetics" style="color:#C9A96E;text-decoration:none;">${INSTAGRAM}</a></p>
          <p style="margin:16px 0 0;font-size:11px;color:#333;font-family:Arial,sans-serif;">© 2026 Dermadoll Aesthetics. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function pill(text: string): string {
  return `<div style="display:inline-block;background:rgba(201,169,110,0.12);border:1px solid rgba(201,169,110,0.4);color:#C9A96E;font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;border-radius:20px;padding:5px 14px;text-transform:uppercase;margin-bottom:20px;">${text}</div>`;
}

function divider(): string {
  return `<div style="width:40px;height:1px;background:#C9A96E;margin:20px auto;"></div>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#ffffff;line-height:1.25;text-align:center;">${text}</h2>`;
}

function bodyText(text: string): string {
  return `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.7;text-align:center;">${text}</p>`;
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 12px;font-family:Arial,sans-serif;font-size:12px;color:#888;border-bottom:1px solid rgba(255,255,255,0.06);width:40%;">${label}</td>
      <td style="padding:10px 12px;font-family:Arial,sans-serif;font-size:13px;color:#ffffff;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.06);">${value}</td>
    </tr>`;
}

function detailTable(rows: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid rgba(201,169,110,0.2);border-radius:10px;overflow:hidden;">
      ${rows}
    </table>`;
}

function goldBox(content: string): string {
  return `<div style="background:rgba(201,169,110,0.08);border:1px solid rgba(201,169,110,0.25);border-radius:10px;padding:16px 20px;margin:20px 0;text-align:center;">${content}</div>`;
}

function ctaButton(href: string, text: string): string {
  return `<div style="text-align:center;margin-top:24px;"><a href="${href}" style="display:inline-block;background:#C9A96E;color:#000000;font-family:Arial,sans-serif;font-size:14px;font-weight:700;padding:14px 36px;border-radius:30px;text-decoration:none;letter-spacing:0.5px;">${text}</a></div>`;
}

function smallPrint(text: string): string {
  return `<p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.3);text-align:center;font-style:italic;line-height:1.6;">${text}</p>`;
}

// ─── Client booking confirmation ──────────────────────────────────────────────
export async function sendClientConfirmationEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  durationMinutes: number;
  deposit: number;
  balance: number;
  depositPaid?: boolean;
  whatsapp: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.clientEmail) return;
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const depositPaid = params.depositPaid ?? true;
  const dateStr = params.date ? fmtDateLong(params.date) : "To be confirmed";
  const timeStr = params.time || "To be confirmed";
  const wa = params.whatsapp || "available on request";

  const body = `
    <div style="text-align:center;">
      ${pill("Booking Confirmed")}
      ${heading(`You're booked in, ${firstName}`)}
      ${bodyText("Your appointment is confirmed and we can't wait to see you. Here are your details:")}
      ${divider()}
    </div>
    ${detailTable(
      detailRow("Treatment", params.treatment) +
      detailRow("Date", dateStr) +
      detailRow("Time", timeStr) +
      detailRow("Duration", `Approx. ${params.durationMinutes} minutes`) +
      detailRow("Location", CLINIC_ADDRESS)
    )}
    ${goldBox(
      depositPaid
        ? `<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;color:#C9A96E;font-weight:700;">✓ Deposit paid — £${params.deposit}</p>
           <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);">Balance due on arrival: <strong style="color:#ffffff;">£${params.balance}</strong></p>`
        : `<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);">Balance due on arrival: <strong style="color:#ffffff;">£${params.balance}</strong></p>`
    )}
    <p style="margin:20px 0 6px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.5);text-align:center;">Please arrive 5 minutes early. To reschedule, contact us at least 24 hours in advance.</p>
    <p style="margin:6px 0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.5);text-align:center;">WhatsApp: <a href="https://wa.me/${wa.replace(/\s/g,"")}" style="color:#C9A96E;text-decoration:none;">${wa}</a></p>
    ${smallPrint("Free cancellation 48 hours before your appointment.")}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: "Your appointment is confirmed — Dermadoll Aesthetics",
      html: emailShell(body),
    });
  } catch (err) {
    console.error("sendClientConfirmationEmail error", err);
  }
}

// ─── Cancellation ─────────────────────────────────────────────────────────────
export async function sendCancellationEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  whatsapp: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.clientEmail) return;
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const wa = params.whatsapp || "available on request";

  const body = `
    <div style="text-align:center;">
      ${pill("Appointment Cancelled")}
      ${heading(`Sorry to see you go, ${firstName}`)}
      ${bodyText("Your appointment has been cancelled. We'd love to rebook you at a time that works.")}
      ${divider()}
    </div>
    ${detailTable(
      detailRow("Treatment", params.treatment) +
      detailRow("Date", fmtDateUK(params.date)) +
      detailRow("Time", params.time)
    )}
    ${ctaButton(`https://wa.me/${wa.replace(/\s/g,"")}`, "Rebook via WhatsApp")}
    ${smallPrint("If you have any questions, message us on Instagram @dermadollaesthetics")}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: "Your Dermadoll appointment has been cancelled",
      html: emailShell(body),
    });
  } catch (err) {
    console.error("sendCancellationEmail error", err);
  }
}

// ─── Reminder ─────────────────────────────────────────────────────────────────
export async function sendReminderEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  date: string;
  time: string;
  whatsapp: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.clientEmail) return;
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const dateStr = params.date ? fmtDateLong(params.date) : "To be confirmed";
  const wa = params.whatsapp || "available on request";

  const body = `
    <div style="text-align:center;">
      ${pill("See You Tomorrow")}
      ${heading(`We're looking forward to it, ${firstName}`)}
      ${bodyText("Just a reminder that your appointment is tomorrow. We can't wait to see you!")}
      ${divider()}
    </div>
    ${detailTable(
      detailRow("Treatment", params.treatment) +
      detailRow("Date", dateStr) +
      detailRow("Time", params.time) +
      detailRow("Location", CLINIC_ADDRESS)
    )}
    ${goldBox(`<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.65);">Please arrive <strong style="color:#ffffff;">5 minutes early</strong> and come with a clean face — no makeup on the treatment area.</p>`)}
    <p style="margin:16px 0 4px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.5);text-align:center;">Need to reschedule? Message us ASAP:</p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.5);text-align:center;">WhatsApp: <a href="https://wa.me/${wa.replace(/\s/g,"")}" style="color:#C9A96E;text-decoration:none;">${wa}</a></p>
    ${smallPrint(`Dermadoll Aesthetics — ${CLINIC_ADDRESS}`)}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: "See you tomorrow — Dermadoll Aesthetics",
      html: emailShell(body),
    });
  } catch (err) {
    console.error("sendReminderEmail error", err);
  }
}

// ─── Admin notification ───────────────────────────────────────────────────────
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
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.adminEmail) return;
  const dateDisp = params.date ? fmtDateUK(params.date) : "TBC";
  const timeDisp = params.time || "TBC";
  const depositStatus = params.depositPaid ? `<span style="color:#4CAF50;">✓ Paid via Stripe — £${params.deposit}</span>` : `<span style="color:#C9A96E;">Pending — £${params.deposit}</span>`;

  const body = `
    <div style="text-align:center;">
      ${pill("New Booking")}
      ${heading("New booking received")}
      ${divider()}
    </div>
    ${detailTable(
      detailRow("Client", params.clientName) +
      detailRow("Email", params.clientEmail || "—") +
      detailRow("Phone", params.clientPhone || "—") +
      detailRow("Treatment", params.treatment) +
      detailRow("Duration", `${params.durationMinutes} mins`) +
      detailRow("Date", dateDisp) +
      detailRow("Time", timeDisp) +
      detailRow("Deposit", depositStatus) +
      detailRow("Booked via", params.source)
    )}
    ${smallPrint("This is an automated notification from Dermadoll Aesthetics booking system.")}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.adminEmail,
      subject: `New booking — ${params.clientName} — ${params.treatment} — ${dateDisp} at ${timeDisp}`,
      html: emailShell(body),
    });
  } catch (err) {
    console.error("sendAdminNotificationEmail error", err);
  }
}

// ─── Consultation confirmation (client) ───────────────────────────────────────
export async function sendConsultationConfirmationEmail(params: {
  clientEmail: string;
  clientName: string;
  date: string;
  time: string;
  whatsapp: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.clientEmail) return;
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const dateStr = params.date ? fmtDateLong(params.date) : "To be confirmed";
  const wa = params.whatsapp || "available on request";

  const body = `
    <div style="text-align:center;">
      ${pill("Consultation Confirmed")}
      ${heading(`We're excited to meet you, ${firstName}`)}
      ${bodyText("Your consultation is booked. This is your first step towards your skin goals.")}
      ${divider()}
    </div>
    ${detailTable(
      detailRow("Type", "Skin Consultation") +
      detailRow("Date", dateStr) +
      detailRow("Time", params.time) +
      detailRow("Duration", "15 minutes") +
      detailRow("Location", CLINIC_ADDRESS)
    )}
    ${goldBox(`
      <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;color:#C9A96E;font-weight:700;">✓ Paid in full — £25</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.5);font-style:italic;">Your £25 is redeemable against any treatment booked on the day.</p>
    `)}
    <p style="margin:16px 0 4px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.5);text-align:center;">Questions before your visit?</p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.5);text-align:center;">WhatsApp: <a href="https://wa.me/${wa.replace(/\s/g,"")}" style="color:#C9A96E;text-decoration:none;">${wa}</a></p>
    ${smallPrint("Please arrive 5 minutes early. We look forward to seeing you.")}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: "Consultation confirmed — Dermadoll Aesthetics",
      html: emailShell(body),
    });
  } catch (err) {
    console.error("sendConsultationConfirmationEmail error", err);
  }
}

// ─── Consultation admin notification ─────────────────────────────────────────
export async function sendConsultationAdminEmail(params: {
  adminEmail: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientDOB: string;
  clientNotes: string;
  date: string;
  time: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.adminEmail) return;
  const dateDisp = params.date ? fmtDateUK(params.date) : "TBC";
  const timeDisp = params.time || "TBC";

  const body = `
    <div style="text-align:center;">
      ${pill("New Consultation")}
      ${heading("New consultation booked")}
      ${divider()}
    </div>
    ${detailTable(
      detailRow("Name", params.clientName) +
      detailRow("Email", params.clientEmail || "—") +
      detailRow("Phone", params.clientPhone || "—") +
      detailRow("DOB", params.clientDOB || "—") +
      detailRow("Skin concerns", params.clientNotes || "—") +
      detailRow("Date", dateDisp) +
      detailRow("Time", timeDisp) +
      detailRow("Paid", `<span style="color:#4CAF50;">£25 ✓</span>`)
    )}
    ${smallPrint("This is an automated notification from Dermadoll Aesthetics booking system.")}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.adminEmail,
      subject: `New Consultation — ${params.clientName} — ${dateDisp} at ${timeDisp}`,
      html: emailShell(body),
    });
  } catch (err) {
    console.error("sendConsultationAdminEmail error", err);
  }
}

// ─── Training enquiry ─────────────────────────────────────────────────────────
export async function sendEnquiryEmails(params: {
  adminEmail: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  message: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  const firstName = params.name.split(" ")[0] ?? params.name;
  const promises: Promise<void>[] = [];

  if (params.adminEmail) {
    const adminBody = `
      <div style="text-align:center;">
        ${pill("Training Enquiry")}
        ${heading("New training enquiry")}
        ${divider()}
      </div>
      ${detailTable(
        detailRow("Name", params.name) +
        detailRow("Email", params.email) +
        detailRow("Phone", params.phone) +
        detailRow("Course", params.course) +
        detailRow("Message", params.message || "—")
      )}
      ${smallPrint("This is an automated notification from Dermadoll Aesthetics.")}
    `;
    promises.push(
      resend.emails.send({
        from: FROM,
        to: params.adminEmail,
        subject: `New training enquiry — ${params.name} — ${params.course}`,
        html: emailShell(adminBody),
      }).then(() => {}).catch((e) => console.error("sendEnquiryEmails admin error", e)),
    );
  }

  if (params.email) {
    const clientBody = `
      <div style="text-align:center;">
        ${pill("Enquiry Received")}
        ${heading(`Thank you, ${firstName}`)}
        ${bodyText(`We've received your enquiry about <strong style="color:#C9A96E;">${params.course}</strong> and will be in touch shortly with available dates and next steps.`)}
        ${divider()}
      </div>
      ${goldBox(`<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.65);">In the meantime, feel free to browse our training pathways or message us on Instagram.</p>`)}
      ${ctaButton("https://instagram.com/dermadollaesthetics", "Follow us on Instagram")}
      ${smallPrint("We typically respond within 24 hours.")}
    `;
    promises.push(
      resend.emails.send({
        from: FROM,
        to: params.email,
        subject: "Thanks for your enquiry — Dermadoll Aesthetics",
        html: emailShell(clientBody),
      }).then(() => {}).catch((e) => console.error("sendEnquiryEmails client error", e)),
    );
  }

  await Promise.all(promises);
}
