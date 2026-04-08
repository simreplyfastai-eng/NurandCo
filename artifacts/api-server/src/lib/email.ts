import { Resend } from "resend";

const RESEND_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = "bookings@dermadollaesthetics.co.uk";
const INSTAGRAM = "@dermadollaesthetics";

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
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

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
  const dateStr = params.date ? fmtDateLong(params.date) : "to be confirmed";
  const timeStr = params.time || "to be confirmed";
  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: "Booking Confirmed — Dermadoll Aesthetics",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;color:#111">
          <div style="border-bottom:2px solid #C9A96E;padding-bottom:16px;margin-bottom:24px">
            <h2 style="font-family:Georgia,serif;color:#111;margin:0;font-size:22px">Dermadoll Aesthetics</h2>
          </div>
          <p>Hi ${firstName},</p>
          <p>Your appointment is confirmed. Here are your details:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0" cellpadding="8">
            <tr style="border-bottom:1px solid #eee"><td style="color:#888;width:40%">Treatment</td><td><strong>${params.treatment}</strong></td></tr>
            <tr style="border-bottom:1px solid #eee"><td style="color:#888">Date</td><td><strong>${dateStr}</strong></td></tr>
            <tr style="border-bottom:1px solid #eee"><td style="color:#888">Time</td><td><strong>${timeStr}</strong></td></tr>
            <tr style="border-bottom:1px solid #eee"><td style="color:#888">Duration</td><td>Approximately ${params.durationMinutes} minutes</td></tr>
          </table>
          <div style="background:#FEFDFB;border:1px solid rgba(201,169,110,0.3);border-radius:8px;padding:16px;margin:20px 0">
            <p style="margin:0 0 8px;font-weight:600">Payment</p>
            ${depositPaid
              ? `<p style="margin:4px 0"><strong style="color:#2D6A4F">✓ Deposit paid: £${params.deposit}</strong></p>`
              : `<p style="margin:4px 0;color:#888">Deposit (50%): <strong style="color:#C9A96E">£${params.deposit}</strong></p>`
            }
            <p style="margin:4px 0;color:#888">Balance due on arrival: <strong style="color:#111">£${params.balance}</strong></p>
          </div>
          <p style="margin:16px 0 4px">Please arrive 5 minutes before your appointment time.</p>
          <p style="margin:4px 0">If you need to reschedule, please contact us at least 24 hours in advance:</p>
          <p>Instagram: <strong>${INSTAGRAM}</strong><br/>WhatsApp: <strong>${params.whatsapp || "available on request"}</strong></p>
          <p>See you soon!</p>
          <p style="color:#888;font-size:13px">The Dermadoll Aesthetics Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendClientConfirmationEmail error", err);
  }
}

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
  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: "Your Dermadoll appointment has been cancelled",
      html: `
        <p>Hi ${firstName},</p>
        <p>We're sorry to let you know that your <strong>${params.treatment}</strong> appointment on <strong>${fmtDateUK(params.date)}</strong> at <strong>${params.time}</strong> has been cancelled.</p>
        <p>Please get in touch to rebook at a time that suits you.</p>
        <p>Instagram: ${INSTAGRAM}<br/>WhatsApp: ${params.whatsapp || "available on request"}</p>
        <p>The Dermadoll Team</p>
      `,
    });
  } catch (err) {
    console.error("sendCancellationEmail error", err);
  }
}

export async function sendReminderEmail(params: {
  clientEmail: string;
  clientName: string;
  treatment: string;
  time: string;
  whatsapp: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.clientEmail) return;
  const firstName = params.clientName.split(" ")[0] ?? params.clientName;
  try {
    await resend.emails.send({
      from: FROM,
      to: params.clientEmail,
      subject: "See you tomorrow — Dermadoll Aesthetics",
      html: `
        <p>Hi ${firstName},</p>
        <p>Just a reminder that your <strong>${params.treatment}</strong> appointment is tomorrow at <strong>${params.time}</strong>.</p>
        <p>We look forward to seeing you!</p>
        <p>Dermadoll Aesthetics<br/>Instagram: ${INSTAGRAM}<br/>WhatsApp: ${params.whatsapp || "available on request"}</p>
      `,
    });
  } catch (err) {
    console.error("sendReminderEmail error", err);
  }
}

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
  const depositStatus = params.depositPaid ? "✓ Paid via Stripe" : "Pending";
  const dateDisp = params.date ? fmtDateUK(params.date) : "TBC";
  const timeDisp = params.time || "TBC";
  try {
    await resend.emails.send({
      from: FROM,
      to: params.adminEmail,
      subject: `New booking — ${params.clientName} — ${params.treatment} — ${dateDisp} at ${timeDisp}`,
      html: `
        <p><strong>New booking received:</strong></p>
        <table cellpadding="4">
          <tr><td>Client</td><td>${params.clientName}</td></tr>
          <tr><td>Email</td><td>${params.clientEmail || "—"}</td></tr>
          <tr><td>Phone</td><td>${params.clientPhone || "—"}</td></tr>
          <tr><td>Treatment</td><td>${params.treatment}</td></tr>
          <tr><td>Duration</td><td>${params.durationMinutes} mins</td></tr>
          <tr><td>Date</td><td>${dateDisp}</td></tr>
          <tr><td>Time</td><td>${timeDisp}</td></tr>
          <tr><td>Deposit</td><td>£${params.deposit} — ${depositStatus}</td></tr>
          <tr><td>Status</td><td>${params.depositPaid ? "Confirmed" : "Pending"}</td></tr>
          <tr><td>Booked via</td><td>${params.source}</td></tr>
        </table>
      `,
    });
  } catch (err) {
    console.error("sendAdminNotificationEmail error", err);
  }
}

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
    promises.push(
      resend.emails.send({
        from: FROM,
        to: params.adminEmail,
        subject: `New training enquiry — ${params.name} — ${params.course}`,
        html: `
          <p><strong>New training enquiry received:</strong></p>
          <table cellpadding="4">
            <tr><td>Name</td><td>${params.name}</td></tr>
            <tr><td>Email</td><td>${params.email}</td></tr>
            <tr><td>Phone</td><td>${params.phone}</td></tr>
            <tr><td>Course</td><td>${params.course}</td></tr>
            <tr><td>Message</td><td>${params.message || "—"}</td></tr>
          </table>
        `,
      }).then(() => {}).catch((e) => console.error("sendEnquiryEmails admin error", e)),
    );
  }

  if (params.email) {
    promises.push(
      resend.emails.send({
        from: FROM,
        to: params.email,
        subject: "Thanks for your enquiry — Dermadoll Aesthetics",
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;color:#111">
            <div style="border-bottom:2px solid #C9A96E;padding-bottom:16px;margin-bottom:24px">
              <h2 style="font-family:Georgia,serif;color:#111;margin:0;font-size:22px">Dermadoll Aesthetics</h2>
            </div>
            <p>Hi ${firstName},</p>
            <p>Thank you for your interest in <strong>${params.course}</strong>. We'll be in touch shortly with more details and available dates.</p>
            <p>In the meantime, feel free to message us on Instagram <strong>${INSTAGRAM}</strong>.</p>
            <p style="color:#888;font-size:13px">The Dermadoll Aesthetics Team</p>
          </div>
        `,
      }).then(() => {}).catch((e) => console.error("sendEnquiryEmails client error", e)),
    );
  }

  await Promise.all(promises);
}
