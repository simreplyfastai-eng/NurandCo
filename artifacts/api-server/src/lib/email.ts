import { Resend } from "resend";

const RESEND_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = "Starr Aesthetics <info@starrbeautyy.co.uk>";
const INSTAGRAM = "@starraestheticss";
const WEBSITE = "www.starrbeautyy.co.uk";
const FALLBACK_ADDRESS = "Starr Aesthetics Clinic";

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
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Starr Aesthetics</title></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="text-align:center;padding-bottom:28px;">
          <p style="margin:0;font-size:10px;letter-spacing:4px;color:#C9A96E;font-family:Arial,sans-serif;text-transform:uppercase;">Luxury Aesthetics</p>
          <h1 style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;color:#5C1A1A;letter-spacing:1px;font-style:italic;">Starr Aesthetics</h1>
          <div style="width:50px;height:1px;background:#C9A96E;margin:16px auto 0;"></div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border:1px solid rgba(92,26,26,0.15);padding:36px 32px;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="text-align:center;padding-top:28px;">
          <p style="margin:0 0 6px;font-size:12px;color:#888;font-family:Arial,sans-serif;">${WEBSITE}</p>
          <p style="margin:0 0 6px;font-size:12px;color:#888;font-family:Arial,sans-serif;">Instagram: <a href="https://instagram.com/starraestheticss" style="color:#C9A96E;text-decoration:none;">${INSTAGRAM}</a></p>
          <p style="margin:16px 0 0;font-size:11px;color:#aaa;font-family:Arial,sans-serif;">© 2026 Starr Aesthetics. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function pill(text: string): string {
  return `<div style="display:inline-block;background:rgba(92,26,26,0.08);border:1px solid rgba(92,26,26,0.25);color:#5C1A1A;font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;padding:5px 14px;text-transform:uppercase;margin-bottom:20px;">${text}</div>`;
}

function divider(): string {
  return `<div style="width:40px;height:1px;background:#C9A96E;margin:20px auto;"></div>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#5C1A1A;line-height:1.25;text-align:center;font-style:italic;">${text}</h2>`;
}

function bodyText(text: string): string {
  return `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.7;text-align:center;">${text}</p>`;
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 12px;font-family:Arial,sans-serif;font-size:12px;color:#888;border-bottom:1px solid rgba(92,26,26,0.08);width:40%;">${label}</td>
      <td style="padding:10px 12px;font-family:Arial,sans-serif;font-size:13px;color:#3D3D3D;font-weight:600;border-bottom:1px solid rgba(92,26,26,0.08);">${value}</td>
    </tr>`;
}

function detailTable(rows: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid rgba(92,26,26,0.12);overflow:hidden;">
      ${rows}
    </table>`;
}

function goldBox(content: string): string {
  return `<div style="background:rgba(201,169,110,0.1);border:1px solid rgba(201,169,110,0.35);padding:16px 20px;margin:20px 0;text-align:center;">${content}</div>`;
}

function ctaButton(href: string, text: string): string {
  return `<div style="text-align:center;margin-top:24px;"><a href="${href}" style="display:inline-block;background:#5C1A1A;color:#F5F0EB;font-family:Arial,sans-serif;font-size:13px;font-weight:600;padding:14px 36px;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">${text}</a></div>`;
}

function smallPrint(text: string): string {
  return `<p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#aaa;text-align:center;font-style:italic;line-height:1.6;">${text}</p>`;
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
  locationName?: string;
  locationAddress?: string;
  formsUrl?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.clientEmail) return;
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const depositPaid = params.depositPaid ?? true;
  const dateStr = params.date ? fmtDateLong(params.date) : "To be confirmed";
  const timeStr = params.time || "To be confirmed";
  const wa = params.whatsapp || "available on request";
  const locationName = params.locationName ?? "Starr Aesthetics";
  const locationAddress = params.locationAddress ?? FALLBACK_ADDRESS;

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
      detailRow("Location", `${locationName}, ${locationAddress}`)
    )}
    ${goldBox(
      depositPaid
        ? `<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;color:#5C1A1A;font-weight:700;">✓ Deposit paid — £${params.deposit}</p>
           <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555;">Balance due on arrival: <strong style="color:#3D3D3D;">£${params.balance}</strong></p>`
        : `<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555;">Balance due on arrival: <strong style="color:#3D3D3D;">£${params.balance}</strong></p>`
    )}
    ${params.formsUrl ? `<div style="margin:24px 0;text-align:center;background:#FDF8F3;border-radius:8px;padding:20px 24px;border:1px solid #e8d9c4;">
      <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;color:#5C1A1A;font-weight:700;">Action Required — Complete Your Pre-Appointment Forms</p>
      <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:13px;color:#666;">Please complete your medical questionnaire and consent form before your appointment. This only takes 2–3 minutes.</p>
      <a href="${params.formsUrl}" style="display:inline-block;background:#5C1A1A;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:700;padding:12px 28px;border-radius:6px;letter-spacing:0.03em;">Complete Forms &rarr;</a>
    </div>` : ""}
    <p style="margin:20px 0 6px;font-family:Arial,sans-serif;font-size:13px;color:#888;text-align:center;">Please arrive 5 minutes early. To reschedule, contact us at least 24 hours in advance.</p>
    <p style="margin:6px 0;font-family:Arial,sans-serif;font-size:13px;color:#888;text-align:center;">WhatsApp: <a href="https://wa.me/${wa.replace(/\s/g,"")}" style="color:#C9A96E;text-decoration:none;">${wa}</a></p>
    ${smallPrint("Free cancellation 48 hours before your appointment.")}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: `Your appointment is confirmed — Starr Aesthetics ${locationName}`,
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
  locationName?: string;
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
    ${smallPrint("If you have any questions, message us on Instagram @starraestheticss")}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: "Your Starr Aesthetics appointment has been cancelled",
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
  locationName?: string;
  locationAddress?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.clientEmail) return;
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const dateStr = params.date ? fmtDateLong(params.date) : "To be confirmed";
  const wa = params.whatsapp || "available on request";
  const locationName = params.locationName ?? "Starr Aesthetics";
  const locationAddress = params.locationAddress ?? FALLBACK_ADDRESS;

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
      detailRow("Location", `${locationName}, ${locationAddress}`)
    )}
    ${goldBox(`<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555;">Please arrive <strong style="color:#3D3D3D;">5 minutes early</strong> and come with a clean face — no makeup on the treatment area.</p>`)}
    <p style="margin:16px 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#888;text-align:center;">Need to reschedule? Message us ASAP:</p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#888;text-align:center;">WhatsApp: <a href="https://wa.me/${wa.replace(/\s/g,"")}" style="color:#C9A96E;text-decoration:none;">${wa}</a></p>
    ${smallPrint(`Starr Aesthetics — ${locationName}`)}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: "See you tomorrow — Starr Aesthetics",
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
  locationName?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.adminEmail) return;
  const dateDisp = params.date ? fmtDateUK(params.date) : "TBC";
  const timeDisp = params.time || "TBC";
  const locationName = params.locationName ?? "Starr Aesthetics";
  const depositStatus = params.depositPaid
    ? `<span style="color:#2D6A4F;">✓ Paid via Stripe — £${params.deposit}</span>`
    : `<span style="color:#C9A96E;">Pending — £${params.deposit}</span>`;

  const body = `
    <div style="text-align:center;">
      ${pill("New Booking")}
      ${heading("New booking received")}
      ${divider()}
    </div>
    ${detailTable(
      detailRow("Location", locationName) +
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
    ${smallPrint("This is an automated notification from Starr Aesthetics booking system.")}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.adminEmail,
      subject: `New booking — ${params.clientName} — ${params.treatment} — ${dateDisp} at ${timeDisp} [${locationName}]`,
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
  locationName?: string;
  locationAddress?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.clientEmail) return;
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  const dateStr = params.date ? fmtDateLong(params.date) : "To be confirmed";
  const wa = params.whatsapp || "available on request";
  const locationName = params.locationName ?? "Starr Aesthetics";
  const locationAddress = params.locationAddress ?? FALLBACK_ADDRESS;

  const body = `
    <div style="text-align:center;">
      ${pill("Consultation Confirmed")}
      ${heading(`We're excited to meet you, ${firstName}`)}
      ${bodyText("Your consultation is booked. This is your first step towards your aesthetic goals.")}
      ${divider()}
    </div>
    ${detailTable(
      detailRow("Type", "Aesthetic Consultation") +
      detailRow("Date", dateStr) +
      detailRow("Time", params.time) +
      detailRow("Duration", "30 minutes") +
      detailRow("Location", `${locationName}, ${locationAddress}`)
    )}
    ${goldBox(`
      <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;color:#5C1A1A;font-weight:700;">✓ Consultation fee: £25</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#888;font-style:italic;">We look forward to discussing your treatment goals with you.</p>
    `)}
    <p style="margin:16px 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#888;text-align:center;">Questions before your visit?</p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#888;text-align:center;">WhatsApp: <a href="https://wa.me/${wa.replace(/\s/g,"")}" style="color:#C9A96E;text-decoration:none;">${wa}</a></p>
    ${smallPrint("Please arrive 5 minutes early. We look forward to seeing you.")}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: `Consultation confirmed — Starr Aesthetics ${locationName}`,
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
  treatmentInterest: string;
  date: string;
  time: string;
  locationName?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.adminEmail) return;
  const dateDisp = params.date ? fmtDateUK(params.date) : "TBC";
  const timeDisp = params.time || "TBC";
  const locationName = params.locationName ?? "Starr Aesthetics";

  const body = `
    <div style="text-align:center;">
      ${pill("New Consultation")}
      ${heading("New consultation booked")}
      ${divider()}
    </div>
    ${detailTable(
      detailRow("Location", locationName) +
      detailRow("Name", params.clientName) +
      detailRow("Email", params.clientEmail || "—") +
      detailRow("Phone", params.clientPhone || "—") +
      detailRow("DOB", params.clientDOB || "—") +
      detailRow("Treatment interest", params.treatmentInterest || "—") +
      detailRow("Skin concerns", params.clientNotes || "—") +
      detailRow("Date", dateDisp) +
      detailRow("Time", timeDisp) +
      detailRow("Fee", `<span style="color:#2D6A4F;">£25 ✓</span>`)
    )}
    ${smallPrint("This is an automated notification from Starr Aesthetics booking system.")}
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: params.adminEmail,
      subject: `New Consultation — ${params.clientName} — ${dateDisp} at ${timeDisp} [${locationName}]`,
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
      ${smallPrint("This is an automated notification from Starr Aesthetics.")}
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
        ${bodyText(`We've received your enquiry about <strong style="color:#5C1A1A;">${params.course}</strong> and will be in touch shortly with available dates and next steps.`)}
        ${divider()}
      </div>
      ${goldBox(`<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555;">In the meantime, feel free to browse our training pathways or message us on Instagram.</p>`)}
      ${ctaButton("https://instagram.com/starraestheticss", "Follow us on Instagram")}
      ${smallPrint("We typically respond within 24 hours.")}
    `;
    promises.push(
      resend.emails.send({
        from: FROM,
        to: params.email,
        subject: "Thanks for your enquiry — Starr Aesthetics",
        html: emailShell(clientBody),
      }).then(() => {}).catch((e) => console.error("sendEnquiryEmails client error", e)),
    );
  }

  await Promise.all(promises);
}
