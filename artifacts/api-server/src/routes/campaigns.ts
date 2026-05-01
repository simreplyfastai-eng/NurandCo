import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuth } from "../lib/auth";
import { Resend } from "resend";
import crypto from "crypto";

const router = Router();
const resendKey = process.env.RESEND_API_KEY ?? "";
const _resend: Resend | null = resendKey ? new Resend(resendKey) : null;
const FROM = "Nur & Co Aesthetics <bookings@nurandcoaesthetics.co.uk>";
const TM_USER = process.env.TEXTMAGIC_USERNAME ?? "";
const TM_KEY = process.env.TEXTMAGIC_API_KEY ?? "";
const TM_FROM = process.env.TEXTMAGIC_SENDER ?? "NurAndCo";
const TM_PRICE_PENCE = 5; // ~5p per SMS - rough UK estimate, used for cost preview

function getLocationId(req: import("express").Request): string | null {
  return (
    (req.headers["x-location-id"] as string | undefined) ??
    (req.query.locationId as string | undefined) ??
    null
  );
}

function normalisePhone(p: string): string | null {
  if (!p) return null;
  let v = p.replace(/[^0-9+]/g, "");
  if (v.startsWith("00")) v = "+" + v.slice(2);
  if (v.startsWith("0")) v = "+44" + v.slice(1);
  if (v.startsWith("+") && v.length >= 10) return v;
  return null;
}

// SMS character cost - 1 segment = 160 chars, 2 segments = 153 each (concat overhead)
function smsSegments(text: string): number {
  const len = text.length;
  if (len <= 160) return 1;
  return Math.ceil(len / 153);
}

async function sendSmsViaTextMagic(phone: string, body: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!TM_USER || !TM_KEY) return { ok: false, error: "TextMagic credentials not configured" };
  try {
    const res = await fetch("https://rest.textmagic.com/api/v2/messages", {
      method: "POST",
      headers: {
        "X-TM-Username": TM_USER,
        "X-TM-Key": TM_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ text: body, phones: phone, from: TM_FROM }).toString(),
    });
    const j: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: j?.message ?? `HTTP ${res.status}` };
    return { ok: true, id: String(j.id ?? "") };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "send failed" };
  }
}

async function sendEmail(to: string, subject: string, html: string, text: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!_resend) return { ok: false, error: "Resend not configured" };
  try {
    const r = await _resend.emails.send({ from: FROM, to, subject, html, text });
    if (r.error) return { ok: false, error: String(r.error) };
    return { ok: true, id: r.data?.id ?? "" };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "send failed" };
  }
}

// GET /api/campaigns - list past campaigns for a location
router.get("/campaigns", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// GET /api/campaigns/:id - single campaign + recipient stats
router.get("/campaigns/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  const { data: c } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("id", req.params.id)
    .eq("location_id", locationId)
    .maybeSingle();
  if (!c) return res.status(404).json({ error: "not found" });
  const { data: recipients } = await supabaseAdmin
    .from("campaign_recipients")
    .select("*")
    .eq("campaign_id", req.params.id)
    .order("created_at", { ascending: false });
  return res.json({ campaign: c, recipients: recipients ?? [] });
});

// POST /api/campaigns/audience - preview audience size + cost
router.post("/campaigns/audience", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  const { audience, channel, body } = req.body as { audience: string; channel: string; body: string };
  let q = supabaseAdmin.from("clients").select("id, full_name, email, phone, marketing_consent", { count: "exact" }).eq("location_id", locationId);
  if (audience === "all_consented") q = q.eq("marketing_consent", true);
  const { data, count } = await q;
  const clients = data ?? [];
  let withEmail = 0, withPhone = 0;
  for (const c of clients) {
    if (c.email && (channel === "email" || channel === "both")) withEmail++;
    if (c.phone && normalisePhone(c.phone) && (channel === "sms" || channel === "both")) withPhone++;
  }
  const segments = body ? smsSegments(body) : 1;
  const smsCostPence = withPhone * segments * TM_PRICE_PENCE;
  return res.json({
    totalClients: count ?? 0,
    reachable: { email: withEmail, sms: withPhone },
    smsSegments: segments,
    estimatedCostPence: smsCostPence,
    estimatedCostGbp: (smsCostPence / 100).toFixed(2),
  });
});

// POST /api/campaigns - create + send a campaign
router.post("/campaigns", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  const { channel, audience, subject, body, senderName } = req.body as Record<string, any>;
  if (!channel || !body) return res.status(400).json({ error: "channel + body required" });
  if (!['sms','email','both'].includes(channel)) return res.status(400).json({ error: "invalid channel" });
  if ((channel === 'email' || channel === 'both') && !subject) return res.status(400).json({ error: "subject required for email" });

  // Audience
  let q = supabaseAdmin.from("clients").select("id, full_name, email, phone, marketing_consent, marketing_unsub_token").eq("location_id", locationId);
  if (audience === "all_consented") q = q.eq("marketing_consent", true);
  const { data: clients } = await q;
  const list = clients ?? [];

  // Create campaign row
  const { data: campaign, error: cErr } = await supabaseAdmin
    .from("campaigns")
    .insert({
      location_id: locationId,
      channel,
      audience: audience ?? "all_consented",
      subject: subject ?? null,
      body,
      sender_name: senderName ?? null,
      total_recipients: list.length,
      status: "sending",
    })
    .select()
    .single();
  if (cErr || !campaign) return res.status(500).json({ error: cErr?.message ?? "create failed" });

  // Send loop - fire and respond fast, sends continue in background
  res.json({ campaignId: campaign.id, queued: list.length });

  let sent = 0, failed = 0, costPence = 0;
  const segments = smsSegments(body);

  for (const c of list) {
    // Generate or reuse unsub token
    let token = (c as any).marketing_unsub_token;
    if (!token) {
      token = crypto.randomBytes(16).toString("hex");
      await supabaseAdmin.from("clients").update({ marketing_unsub_token: token }).eq("id", (c as any).id);
    }
    const unsubUrl = `https://nurandcoaesthetics.co.uk/unsubscribe?t=${token}`;

    // EMAIL
    if ((channel === "email" || channel === "both") && (c as any).email) {
      const html = `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#0E0D0B"><div style="background:#F8F8F6;padding:24px;border:1px solid #E8E5DD"><p style="margin:0 0 16px;font-size:14px">Hi ${escapeHtml((c as any).full_name ?? "")},</p><div style="font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(body)}</div><hr style="border:none;border-top:1px solid #E8E5DD;margin:24px 0"><p style="margin:0;font-size:11px;color:#6B6258">Nur &amp; Co Aesthetics · Bedale Road, Sherwood, Nottingham NG5 3GL</p><p style="margin:8px 0 0;font-size:11px;color:#6B6258">You're receiving this because you consented to marketing from Nur &amp; Co. <a href="${unsubUrl}" style="color:#9A7E50">Unsubscribe</a></p></div></div>`;
      const text = `Hi ${(c as any).full_name ?? ""},\n\n${body}\n\n---\nNur & Co Aesthetics · Bedale Road, Sherwood, Nottingham NG5 3GL\nUnsubscribe: ${unsubUrl}`;
      const r = await sendEmail((c as any).email, subject ?? "", html, text);
      await supabaseAdmin.from("campaign_recipients").insert({
        campaign_id: campaign.id,
        client_id: (c as any).id,
        client_name: (c as any).full_name,
        client_email: (c as any).email,
        client_phone: (c as any).phone,
        channel: "email",
        status: r.ok ? "sent" : "failed",
        provider_id: r.ok ? r.id : null,
        error_message: r.ok ? null : r.error,
        sent_at: r.ok ? new Date().toISOString() : null,
      });
      if (r.ok) sent++; else failed++;
    }

    // SMS
    if ((channel === "sms" || channel === "both") && (c as any).phone) {
      const phone = normalisePhone((c as any).phone);
      if (phone) {
        const smsBody = `${body}\n\nReply STOP to opt out`;
        const r = await sendSmsViaTextMagic(phone, smsBody);
        await supabaseAdmin.from("campaign_recipients").insert({
          campaign_id: campaign.id,
          client_id: (c as any).id,
          client_name: (c as any).full_name,
          client_email: (c as any).email,
          client_phone: phone,
          channel: "sms",
          status: r.ok ? "sent" : "failed",
          provider_id: r.ok ? r.id : null,
          error_message: r.ok ? null : r.error,
          sent_at: r.ok ? new Date().toISOString() : null,
        });
        if (r.ok) { sent++; costPence += segments * TM_PRICE_PENCE; } else { failed++; }
      }
    }
  }

  // Final status
  await supabaseAdmin
    .from("campaigns")
    .update({
      total_sent: sent,
      total_failed: failed,
      status: failed === 0 ? "sent" : (sent === 0 ? "failed" : "sent"),
      cost_actual_pence: costPence,
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);
});

// PUT /api/clients/:id/consent - set marketing_consent
router.put("/clients/:id/consent", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const locationId = getLocationId(req);
  if (!locationId) return res.status(400).json({ error: "locationId required" });
  const { consent } = req.body as { consent: boolean };
  const updates: Record<string, any> = { marketing_consent: !!consent };
  if (consent) updates.marketing_consent_at = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("clients")
    .update(updates)
    .eq("id", req.params.id)
    .eq("location_id", locationId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// GET /api/unsubscribe?t=TOKEN - public unsubscribe page handler
router.get("/unsubscribe", async (req, res) => {
  const token = String(req.query.t ?? "");
  if (!token) return res.status(400).send("Missing token");
  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("id, name")
    .eq("marketing_unsub_token", token)
    .maybeSingle();
  if (!client) return res.status(404).send("Invalid or expired link");
  await supabaseAdmin
    .from("clients")
    .update({ marketing_consent: false, marketing_consent_at: null })
    .eq("id", (client as any).id);
  res.set("Content-Type", "text/html");
  return res.send(`<!doctype html><html><head><title>Unsubscribed</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Inter,sans-serif;max-width:480px;margin:80px auto;padding:0 20px;color:#0E0D0B}h1{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:400;font-size:32px;margin-bottom:12px}p{line-height:1.6;color:#6B6258}</style></head><body><h1>You've been unsubscribed</h1><p>Hi ${escapeHtml((client as any).name ?? "")}, you'll no longer receive marketing messages from Nur &amp; Co Aesthetics.</p><p>Booking confirmations and appointment reminders will still be sent as they are essential to your service.</p></body></html>`);
});

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export default router;
