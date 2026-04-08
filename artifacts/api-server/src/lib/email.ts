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
  source: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.adminEmail) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: params.adminEmail,
      subject: `New booking — ${params.clientName} — ${params.treatment} — ${fmtDateUK(params.date)} at ${params.time}`,
      html: `
        <p><strong>New booking received:</strong></p>
        <table cellpadding="4">
          <tr><td>Client</td><td>${params.clientName}</td></tr>
          <tr><td>Email</td><td>${params.clientEmail || "—"}</td></tr>
          <tr><td>Phone</td><td>${params.clientPhone || "—"}</td></tr>
          <tr><td>Treatment</td><td>${params.treatment}</td></tr>
          <tr><td>Duration</td><td>${params.durationMinutes} mins</td></tr>
          <tr><td>Date</td><td>${fmtDateUK(params.date)}</td></tr>
          <tr><td>Time</td><td>${params.time}</td></tr>
          <tr><td>Deposit</td><td>£${params.deposit}</td></tr>
          <tr><td>Status</td><td>Pending</td></tr>
          <tr><td>Booked via</td><td>${params.source}</td></tr>
        </table>
      `,
    });
  } catch (err) {
    console.error("sendAdminNotificationEmail error", err);
  }
}
