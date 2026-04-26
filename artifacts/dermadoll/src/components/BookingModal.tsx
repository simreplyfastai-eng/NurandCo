import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { getNextAvailableSlot } from "@/lib/nextSlot";

interface Treatment {
  name: string;
  price: string;
  duration?: string;
  durationMins?: number;
}

interface BookingModalProps {
  treatment: Treatment | null;
  onClose: () => void;
  locationId?: string;
  locationSlug?: string;
}

interface DayAvail {
  on: boolean;
  start?: string;
  end?: string;
}

interface Availability {
  defaults: Record<string, DayAvail>;
  overrides: Record<string, { on: boolean; start?: string; end?: string }>;
}

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AVAIL_DEFAULT: Availability = {
  defaults: {
    Mon: { on: false },
    Tue: { on: true, start: "09:00", end: "19:00" },
    Wed: { on: true, start: "09:00", end: "19:00" },
    Thu: { on: true, start: "09:00", end: "19:00" },
    Fri: { on: true, start: "09:00", end: "16:00" },
    Sat: { on: true, start: "09:00", end: "14:00" },
    Sun: { on: false },
  },
  overrides: {},
};

// ── Date helpers ─────────────────────────────────────────────────────────────

// RULE 1: always use UTC methods — Date objects in this component are created with Date.UTC
function fmtDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minsToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// ── Availability helpers ──────────────────────────────────────────────────────

// RULE 2: use UTC-safe date string, never date.getDay() which uses local timezone
function getAvailForDate(avail: Availability, dateStr: string): DayAvail | null {
  const override = avail.overrides?.[dateStr];
  if (override !== undefined) return override.on ? override : { on: false };
  // Parse dateStr safely to get UTC day-of-week
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const dayKey = DAY_KEYS[dow];
  return avail.defaults?.[dayKey] ?? { on: false };
}

function isDateDisabled(avail: Availability, date: Date, today: Date): boolean {
  if (date < today) return true;
  // RULE 1: use Date.UTC to ensure month/day are in UTC — avoids off-by-one at midnight local time
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dateStr = `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, "0")}-${String(utcDate.getUTCDate()).padStart(2, "0")}`;
  const day = getAvailForDate(avail, dateStr);
  return !day || !day.on;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateName(v: string): string {
  if (!v.trim()) return "Please enter your full name";
  if (v.trim().length < 2) return "Please enter your full name";
  if (v.trim().length > 60) return "Name must be under 60 characters";
  return "";
}

function validateEmail(v: string): string {
  if (!v.trim()) return "Please enter a valid email address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Please enter a valid email address";
  return "";
}

function validatePhone(v: string): string {
  const stripped = v.replace(/\s/g, "");
  if (!stripped) return "Please enter a valid UK phone number";
  if (!/^(\+447\d{9}|07\d{9})$/.test(stripped)) return "Please enter a valid UK phone number";
  return "";
}

// ── Calendar ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function Calendar({
  onSelect, selected, avail, onMonthChange,
}: {
  onSelect: (d: Date) => void;
  selected: Date | null;
  avail: Availability;
  onMonthChange?: (year: number, month: number) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // RULE 1: build cells using Date.UTC so months/days are UTC-unambiguous
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  // Day offset: Mon=0 … Sun=6 (start calendar on Monday)
  const firstDow = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay(); // 0=Sun
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(viewYear, viewMonth, d)));

  const prevMonth = () => {
    const ny = viewMonth === 0 ? viewYear - 1 : viewYear;
    const nm = viewMonth === 0 ? 11 : viewMonth - 1;
    setViewYear(ny); setViewMonth(nm);
    onMonthChange?.(ny, nm);
  };
  const nextMonth = () => {
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nm = viewMonth === 11 ? 0 : viewMonth + 1;
    setViewYear(ny); setViewMonth(nm);
    onMonthChange?.(ny, nm);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10" style={{ color: "#C9A96E", fontSize: "22px" }}>‹</button>
        <span className="font-serif" style={{ fontSize: "18px" }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10" style={{ color: "#C9A96E", fontSize: "22px" }}>›</button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] uppercase tracking-wider py-1" style={{ color: "#aaa", fontFamily: "Inter, sans-serif" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          // Use UTC methods since cells are created with Date.UTC
          const dateStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
          const disabled = isDateDisabled(avail, date, today);
          const isSelected = selected !== null && dateStr === `${selected.getUTCFullYear()}-${String(selected.getUTCMonth() + 1).padStart(2, "0")}-${String(selected.getUTCDate()).padStart(2, "0")}`;
          return (
            <button
              key={dateStr}
              disabled={disabled}
              onClick={() => !disabled && onSelect(date)}
              className="flex items-center justify-center transition-all duration-150"
              style={{
                width: "40px", height: "40px", borderRadius: "8px", margin: "1px auto",
                fontSize: "14px", fontFamily: "Inter, sans-serif",
                backgroundColor: isSelected ? "#C9A96E" : "transparent",
                color: isSelected ? "#fff" : disabled ? "#ddd" : "#111",
                cursor: disabled ? "default" : "pointer",
              }}
              onMouseEnter={(e) => { if (!disabled && !isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(201,169,110,0.12)"; }}
              onMouseLeave={(e) => { if (!disabled && !isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
            >
              {date.getUTCDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "#888", fontFamily: "Inter, sans-serif" }}>
        {label} {required && <span style={{ color: "#C9A96E" }}>*</span>}
      </label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: "#C62828" }}>{error}</p>}
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    border: `1px solid ${hasError ? "#C62828" : "#E0E0E0"}`,
    borderRadius: "8px", padding: "12px 14px", fontSize: "14px",
    fontFamily: "Inter, sans-serif", outline: "none", width: "100%",
    transition: "border-color 0.15s",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return crypto.randomUUID(); }
function parsePrice(priceStr: string): number { return parseInt(priceStr.replace(/[^0-9]/g, ""), 10) || 0; }

// ── Main Component ────────────────────────────────────────────────────────────

export default function BookingModal({ treatment, onClose, locationId, locationSlug }: BookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "success">(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [slotError, setSlotError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [avail, setAvail] = useState<Availability>(AVAIL_DEFAULT);
  // API slot data from GET /api/availability/slots — richer than local generation
  const [apiSlots, setApiSlots] = useState<{ time: string; available: boolean; reason?: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Stripe payment state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [stripeElementMounted, setStripeElementMounted] = useState(false);
  const [stripeNotConfigured, setStripeNotConfigured] = useState(false);
  const [testModeLoading, setTestModeLoading] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const bookingDuration = treatment?.durationMins ?? 30;
  const [hasResendKey, setHasResendKey] = useState(false);
  const [depositPercent, setDepositPercent] = useState(50);
  const [serverDepositPence, setServerDepositPence] = useState<number | null>(null);

  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<HTMLDivElement>(null);
  const clientSecretRef = useRef<string | null>(null);
  const pendingBookingIdRef = useRef<string | null>(null);

  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Fetch availability and config on mount
  useEffect(() => {
    const availHeaders: HeadersInit = locationId ? { "x-location-id": locationId } : {};
    fetch("/api/availability", { headers: availHeaders })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setAvail(data); })
      .catch(() => {});
    const configUrl = locationId ? `/api/config?locationId=${locationId}` : "/api/config";
    fetch(configUrl)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.whatsapp) setWhatsapp(data.whatsapp);
        if (data?.hasResendKey) setHasResendKey(true);
        if (typeof data?.depositPercent === "number" && data.depositPercent > 0) {
          setDepositPercent(data.depositPercent);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    firstFocusRef.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Reset server-computed deposit when treatment changes
  useEffect(() => { setServerDepositPence(null); }, [treatment?.name]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && step !== "success") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, step]);

  // Fetch rich slot data from API — no local generation, no timezone bugs
  // RULE 4: server generates slots with string arithmetic; RULE 7: server filters past slots with London time
  const fetchSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = fmtDate(date);
      // Prefer locationSlug for resolution; fall back to locationId UUID
      const locParam = locationSlug
        ? `location=${encodeURIComponent(locationSlug)}`
        : locationId
        ? `location=${encodeURIComponent(locationId)}`
        : "";
      const r = await fetch(`/api/availability/slots?${locParam}&date=${dateStr}`, { cache: "no-store" });
      if (r.ok) {
        const data = await r.json() as { available?: boolean; slots?: { time: string; available: boolean; reason?: string }[] };
        setApiSlots(data.slots ?? []);
      } else {
        setApiSlots([]);
      }
    } catch {
      setApiSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, locationSlug]);

  // Refresh availability data (called on month change to get fresh Supabase data)
  const refreshAvail = useCallback(async () => {
    const availHeaders: HeadersInit = locationId ? { "x-location-id": locationId } : {};
    try {
      const r = await fetch("/api/availability", { headers: availHeaders, cache: "no-store" });
      if (r.ok) { const data = await r.json(); if (data) setAvail(data); }
    } catch { /* stay on cached avail */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSlotError("");
    setStep(2);
    await fetchSlots(date);
  };

  const handleTimeSelect = async (time: string) => {
    setSelectedTime(time);
    setSlotError("");

    // Confirm slot is still available via the check endpoint before proceeding
    const locParam = locationSlug ?? locationId;
    if (locParam && selectedDate) {
      try {
        const dateStr = fmtDate(selectedDate);
        const r = await fetch(
          `/api/availability/check?location=${encodeURIComponent(locParam)}&date=${dateStr}&time=${encodeURIComponent(time)}`,
          { cache: "no-store" },
        );
        if (r.ok) {
          const data = await r.json() as { available: boolean; reason?: string };
          if (!data.available) {
            const msg = data.reason === "SLOT_TAKEN"
              ? "This time slot has just been booked. Please choose another time."
              : data.reason === "CLINIC_CLOSED"
              ? "The clinic is closed on this day. Please select another date."
              : "This time is not available. Please choose another.";
            setSlotError(msg);
            if (selectedDate) await fetchSlots(selectedDate);
            return;
          }
        }
      } catch { /* fail open */ }
    }

    setStep(3);
  };

  // Step 3 → Step 4: validate details then proceed to payment
  const handleContinueToPayment = () => {
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePhone(phone);
    setNameError(nErr);
    setEmailError(eErr);
    setPhoneError(pErr);
    if (nErr || eErr || pErr) return;
    setPaymentError("");
    setStripeElementMounted(false);
    setStep(4);
  };

  // Step 4: initialise Stripe Elements
  useEffect(() => {
    if (step !== 4) return;
    let cancelled = false;

    async function initStripe() {
      setPaymentLoading(true);
      setPaymentError("");

      try {
        // Get publishable key from backend
        const configRes = await fetch("/api/config");
        const config = await configRes.json() as { stripePublishableKey?: string; whatsapp?: string; hasResendKey?: boolean; depositPercent?: number };
        if (config.whatsapp) setWhatsapp(config.whatsapp);
        if (config.hasResendKey) setHasResendKey(true);
        if (typeof config.depositPercent === "number" && config.depositPercent > 0) {
          setDepositPercent(config.depositPercent);
        }

        if (!config.stripePublishableKey) {
          if (!cancelled) {
            setStripeNotConfigured(true);
            setPaymentLoading(false);
          }
          return;
        }

        // Generate a booking ID to pass in Stripe metadata — the booking record
        // is only created by the webhook once payment is confirmed, so no ghost
        // bookings can block slots if a user abandons checkout.
        const pendingBookingId = uid();
        pendingBookingIdRef.current = pendingBookingId;

        // Create payment intent — server computes the authoritative deposit amount
        const piRes = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treatment: treatment?.name ?? "",
            clientName: name,
            clientEmail: email,
            clientPhone: phone,
            bookingDate: selectedDate ? fmtDate(selectedDate) : "",
            bookingTime: selectedTime,
            bookingId: pendingBookingId,
            locationId: locationId ?? null,
          }),
        });

        if (!piRes.ok) {
          const d = await piRes.json() as { error?: string };
          if (!cancelled) {
            setPaymentError(d.error ?? "Failed to set up payment. Please try again.");
            setPaymentLoading(false);
          }
          return;
        }

        const piData = await piRes.json() as { clientSecret: string; depositAmountPence?: number };
        const { clientSecret } = piData;
        // Sync displayed deposit to the server-authoritative value
        if (piData.depositAmountPence && !cancelled) {
          setServerDepositPence(piData.depositAmountPence);
        }
        if (cancelled || !clientSecret) return;
        clientSecretRef.current = clientSecret;

        // Load Stripe
        const { loadStripe } = await import("@stripe/stripe-js");
        const stripe = await loadStripe(config.stripePublishableKey);
        if (!stripe || cancelled) return;
        stripeRef.current = stripe;

        // Create and mount Elements
        const elements = stripe.elements({
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#C9A96E",
              colorText: "#111111",
              fontFamily: "Inter, sans-serif",
              borderRadius: "8px",
            },
          },
        });
        elementsRef.current = elements;

        const paymentEl = elements.create("payment");
        if (paymentElementRef.current) {
          paymentEl.mount(paymentElementRef.current);
        }

        paymentEl.on("ready", () => {
          if (!cancelled) {
            setStripeElementMounted(true);
            setPaymentLoading(false);
          }
        });
      } catch {
        if (!cancelled) {
          setPaymentError("Failed to load payment form. Please refresh and try again.");
          setPaymentLoading(false);
        }
      }
    }

    initStripe();
    return () => {
      cancelled = true;
      // Unmount payment element on cleanup
      try { elementsRef.current?.getElement("payment")?.unmount(); } catch { /* ignore */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Handle Stripe payment confirmation
  const handlePayment = async () => {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) return;

    setSubmitting(true);
    setPaymentError("");

    const bookingId = pendingBookingIdRef.current ?? "";
    const base = import.meta.env.BASE_URL ?? "/";
    const confirmedPath = base.endsWith("/") ? `${base}confirmed.html` : `${base}/confirmed.html`;
    const returnUrl = `${window.location.origin}${confirmedPath}?booking=${encodeURIComponent(bookingId)}`;

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      setPaymentError(`Payment failed: ${error.message ?? "Unknown error"}. Please check your card details and try again.`);
      setSubmitting(false);
      return;
    }

    // Payment succeeded — booking was already saved before payment was taken.
    // Stripe webhook will update status from "awaiting_payment" to "Confirmed".
    // Redirect to confirmation page.
    setSubmitting(false);
    window.location.href = `${confirmedPath}?booking=${encodeURIComponent(bookingId)}`;
  };

  // Test mode handler — creates a confirmed booking without Stripe payment
  const handleTestModeBooking = async () => {
    setTestModeLoading(true);
    try {
      const bookingId = crypto.randomUUID();
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          clientName: name,
          clientEmail: email,
          clientPhone: phone,
          treatment: treatment?.name ?? "",
          date: selectedDate ? fmtDate(selectedDate) : "",
          time: selectedTime ?? "",
          locationId: locationId ?? null,
          depositPaid: false,
          status: "confirmed",
          source: "Portal",
          notes: "[TEST MODE — no payment taken]",
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setPaymentError(d.error ?? "Failed to create test booking.");
        setTestModeLoading(false);
        return;
      }
      const base = import.meta.env.BASE_URL ?? "/";
      const confirmedPath = base.endsWith("/") ? `${base}confirmed.html` : `${base}/confirmed.html`;
      window.location.href = `${confirmedPath}?booking=${encodeURIComponent(bookingId)}`;
    } catch {
      setPaymentError("Network error. Please try again.");
      setTestModeLoading(false);
    }
  };

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);

  if (!treatment) return null;

  const price = parsePrice(treatment.price);
  // Client-side injectable keyword detection — mirrors server logic in treatments.ts
  const INJECTABLE_KEYWORDS = [
    'filler', 'lips', 'rhinoplasty', 'jaw', 'cheek', 'smile line',
    'tear trough', 'polynucleotides', 'dissolve', 'hydration',
    'naturale', 'hd sculpt', 'contouring', 'consultation', 'refill',
  ];
  const isInjectable = INJECTABLE_KEYWORDS.some(kw =>
    (treatment.name ?? "").toLowerCase().includes(kw)
  );
  const estimatedDeposit = isInjectable ? 20 : 10;
  const deposit = serverDepositPence !== null ? Math.round(serverDepositPence / 100) : estimatedDeposit;
  const balance = price - deposit;

  // Use API-provided slots (server handles all timezone + availability logic)
  // apiSlots = [{ time, available, reason }] from GET /api/availability/slots

  // ── Full-page success overlay ─────────────────────────────────────────────
  if (step === "success") {
    const CLINIC_ADDRESS = "[CLIENT_NAME], Hornchurch / Marylebone";
    const waMsg = encodeURIComponent(`Hi, I've just booked ${treatment.name} — I had a quick question about my appointment 😊`);
    const waUrl = `https://wa.me/${whatsapp || "447701298985"}?text=${waMsg}`;

    const handleCopyAddress = (btn: HTMLButtonElement) => {
      navigator.clipboard.writeText(CLINIC_ADDRESS.replace(/\n/g, ", "));
      const orig = btn.textContent;
      btn.textContent = "✓ Copied!";
      setTimeout(() => { btn.textContent = orig; }, 2000);
    };

    const handleICSDownload = () => {
      if (!selectedDate || !selectedTime) return;
      const [h, m] = selectedTime.split(":").map(Number);
      const start = new Date(selectedDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + bookingDuration * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      const fmt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//[CLIENT_NAME]//EN",
        "X-WR-CALNAME:[CLIENT_NAME]",
        "X-WR-TIMEZONE:Europe/London",
        "BEGIN:VEVENT",
        `DTSTART;TZID=Europe/London:${fmt(start)}`,
        `DTEND;TZID=Europe/London:${fmt(end)}`,
        `SUMMARY:${treatment.name} at [CLIENT_NAME]`,
        "LOCATION:[CLIENT_NAME]\\, Hornchurch / Marylebone",
        `DESCRIPTION:Deposit paid £${deposit}\\, balance £${balance} due on arrival`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "[CLIENT_NAME]-appointment.ics"; a.click();
      URL.revokeObjectURL(url);
    };

    const glassCard: React.CSSProperties = {
      background: "rgba(255,255,255,0.25)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.4)",
      borderRadius: 20,
      boxShadow: "0 8px 32px rgba(180,140,60,0.15)",
      padding: "clamp(16px,4vw,24px)",
      marginBottom: 16,
    };
    const goldLabel: React.CSSProperties = {
      fontFamily: "Inter, sans-serif", fontSize: 11,
      color: "#C9A96E", letterSpacing: "2px",
      textTransform: "uppercase", marginBottom: 16,
    };
    const glassBtn: React.CSSProperties = {
      background: "rgba(255,255,255,0.3)",
      border: "1px solid rgba(201,169,110,0.5)",
      color: "#2a1f0e", borderRadius: 30,
      padding: "12px 8px", fontFamily: "Inter, sans-serif",
      fontSize: 13, fontWeight: 500, cursor: "pointer",
      transition: "all 0.15s",
    };

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "linear-gradient(135deg, #f5e6c8, #fdf6ec, #e8d5b0)",
        overflowY: "auto", animation: "ddFadeIn 0.4s ease",
      }}>
        <style>{`
          @keyframes ddFadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes ddBlobDrift { from { transform:translate(0,0) } to { transform:translate(20px,20px) } }
          @keyframes ddScaleBounce {
            from { transform:scale(0); opacity:0 }
            to   { transform:scale(1); opacity:1 }
          }
          @keyframes ddCheckDraw {
            from { stroke-dashoffset:60 }
            to   { stroke-dashoffset:0 }
          }
          @keyframes ddFadeUp {
            from { opacity:0; transform:translateY(20px) }
            to   { opacity:1; transform:translateY(0) }
          }
          .dd-gbtn { transition:all 0.15s; cursor:pointer; }
          .dd-gbtn:active { transform:scale(0.97); }
        `}</style>

        {/* Background blobs */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div style={{ position:"absolute", top:"-10%", left:"-10%", width:400, height:400, borderRadius:"50%", background:"#C9A96E", filter:"blur(80px)", opacity:0.3, animation:"ddBlobDrift 8s ease-in-out infinite alternate" }} />
          <div style={{ position:"absolute", top:"40%", right:"-5%", width:320, height:320, borderRadius:"50%", background:"#f0d898", filter:"blur(80px)", opacity:0.35, animation:"ddBlobDrift 10s ease-in-out infinite alternate-reverse" }} />
          <div style={{ position:"absolute", bottom:"-10%", left:"30%", width:360, height:360, borderRadius:"50%", background:"#C9A96E", filter:"blur(80px)", opacity:0.25, animation:"ddBlobDrift 12s ease-in-out infinite alternate" }} />
        </div>

        {/* Centred content */}
        <div style={{ position:"relative", zIndex:1, maxWidth:560, margin:"0 auto", padding:"clamp(32px,5vw,56px) 24px" }}>

          {/* Top — checkmark + heading */}
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{
              width:80, height:80, borderRadius:"50%", margin:"0 auto 24px",
              background:"rgba(255,255,255,0.25)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
              border:"2px solid #C9A96E",
              display:"flex", alignItems:"center", justifyContent:"center",
              animation:"ddScaleBounce 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            }}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ overflow:"visible" }}>
                <polyline
                  points="7,18 15,26 29,10"
                  stroke="#C9A96E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  strokeDasharray="60" strokeDashoffset="60"
                  style={{ animation:"ddCheckDraw 0.7s ease 0.4s forwards" }}
                />
              </svg>
            </div>
            <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(32px,7vw,40px)", fontWeight:600, color:"#2a1f0e", margin:"0 0 12px" }}>
              You're All Booked!
            </h1>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:15, color:"#7a6a50", margin:0 }}>
              Thank you for booking with [CLIENT_NAME]. We will be in touch shortly to confirm your appointment. ✨
            </p>
          </div>

          {/* Card 1 — Booking summary */}
          <div style={{ ...glassCard, animation:"ddFadeUp 0.4s ease 0.3s both" }}>
            <div style={goldLabel}>Your Appointment</div>
            <div style={{ fontFamily:"Inter, sans-serif", fontSize:20, fontWeight:700, color:"#2a1f0e", marginBottom:6 }}>
              {treatment.name}
            </div>
            <div style={{ fontFamily:"Inter, sans-serif", fontSize:15, color:"#2a1f0e", marginBottom:18 }}>
              {selectedDate ? formatDate(selectedDate) : ""}
              {selectedTime ? ` · ${selectedTime} — ${minsToTime(timeToMins(selectedTime) + bookingDuration)}` : ""}
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <div style={{ background:"rgba(201,169,110,0.15)", border:"1px solid rgba(201,169,110,0.3)", borderRadius:20, padding:"6px 14px", fontFamily:"Inter, sans-serif", fontSize:13, color:"#C9A96E" }}>
                Deposit Paid: £{deposit}
              </div>
              <div style={{ background:"rgba(201,169,110,0.15)", border:"1px solid rgba(201,169,110,0.3)", borderRadius:20, padding:"6px 14px", fontFamily:"Inter, sans-serif", fontSize:13, color:"#C9A96E" }}>
                Balance Due on Arrival: £{balance}
              </div>
            </div>
          </div>

          {/* Card 2 — Clinic details */}
          <div style={{ ...glassCard, animation:"ddFadeUp 0.4s ease 0.5s both" }}>
            <div style={goldLabel}>Find Us</div>
            <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:"#2a1f0e", marginBottom:4 }}>
              [CLIENT_NAME]
            </div>
            <div style={{ fontFamily:"'Inter', sans-serif", fontSize:14, color:"#7a6a50", marginBottom:12 }}>Advanced Aesthetics Practitioner · Student Nurse</div>
            <div style={{ fontFamily:"'Inter', sans-serif", fontSize:15, color:"#2a1f0e", marginBottom:20, lineHeight:1.6 }}>
              Hornchurch, Essex (RM11)<br />
              Marylebone, London (W1G)<br />
              <span style={{ fontSize:13, color:"#7a6a50" }}>Exact location sent with confirmation</span>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button
                className="dd-gbtn"
                onClick={(e) => handleCopyAddress(e.currentTarget)}
                style={{ ...glassBtn, flex:1 }}
              >
                📋 Copy Address
              </button>
              <button
                className="dd-gbtn"
                onClick={handleICSDownload}
                style={{ ...glassBtn, flex:1 }}
              >
                📅 Save to Calendar
              </button>
            </div>
          </div>

          {/* Card 3 — Contact */}
          <div style={{ ...glassCard, animation:"ddFadeUp 0.4s ease 0.7s both", marginBottom:24 }}>
            <div style={goldLabel}>Need Anything?</div>
            <div style={{ fontFamily:"Inter, sans-serif", fontSize:14, color:"#7a6a50", marginBottom:20 }}>
              Have a question or need to make changes?
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <a
                href={waUrl} target="_blank" rel="noopener noreferrer"
                className="dd-gbtn"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"rgba(37,211,102,0.15)", border:"1px solid rgba(37,211,102,0.4)", color:"#1a7a3a", borderRadius:30, padding:"13px 20px", fontFamily:"Inter, sans-serif", fontSize:14, fontWeight:500, textDecoration:"none" }}
              >
                <svg viewBox="0 0 24 24" fill="#25D366" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.117 1.523 5.845L.057 23.704a.5.5 0 0 0 .614.632l6.054-1.572A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.724.967.998-3.613-.236-.373A9.818 9.818 0 1 1 12 21.818z"/></svg>
                Message us on WhatsApp
              </a>
              <a
                href="https://instagram.com/StarrAestheticss" target="_blank" rel="noopener noreferrer"
                className="dd-gbtn"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"rgba(201,169,110,0.10)", border:"1px solid rgba(201,169,110,0.35)", color:"#C9A96E", borderRadius:30, padding:"13px 20px", fontFamily:"'Inter', sans-serif", fontSize:14, fontWeight:500, textDecoration:"none" }}
              >
                <svg viewBox="0 0 24 24" fill="#C9A96E" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                @StarrAestheticss
              </a>
              <button
                className="dd-gbtn"
                onClick={onClose}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.4)", color:"#2a1f0e", borderRadius:30, padding:"13px 20px", fontFamily:"Inter, sans-serif", fontSize:14, fontWeight:500, width:"100%" }}
              >
                ← Back to Home
              </button>
            </div>
          </div>

          {/* Small print */}
          <p style={{ fontFamily:"Inter, sans-serif", fontSize:12, color:"#a09070", fontStyle:"italic", textAlign:"center", margin:"0 0 48px" }}>
            Please arrive 5 minutes before your appointment. Full aftercare advice will be provided on the day 🤍
          </p>
        </div>
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={step === "success" ? undefined : onClose}
      />

      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full md:max-w-[520px] bg-white overflow-y-auto"
        style={{ borderRadius: "16px 16px 0 0", maxHeight: "92dvh", padding: "clamp(28px, 5vw, 40px)", paddingBottom: "40px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {step !== "success" && (
          <button
            ref={firstFocusRef}
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10"
            style={{ color: "#C9A96E", fontSize: "18px" }}
            aria-label="Close"
          >✕</button>
        )}

        {step !== "success" && (
          <div className="mb-7 pr-8">
            <h2 className="font-serif leading-snug mb-1" style={{ fontSize: "24px" }}>{treatment.name}</h2>
            <span className="font-serif" style={{ fontSize: "20px", color: "#C9A96E" }}>{treatment.price}</span>
          </div>
        )}

        {/* ── Step 1 — Calendar ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <h3 className="font-serif mb-1" style={{ fontSize: "20px" }}>Select a Date</h3>
            <p className="mb-5" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#C9A96E", fontStyle: "italic" }}>
              Next available: {getNextAvailableSlot()}
            </p>
            <Calendar
              onSelect={handleDateSelect}
              selected={selectedDate}
              avail={avail}
              onMonthChange={refreshAvail}
            />
          </motion.div>
        )}

        {/* ── Step 2 — Time slots ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(1)} className="text-sm hover:opacity-70" style={{ color: "#C9A96E" }}>← Back</button>
              <h3 className="font-serif" style={{ fontSize: "20px" }}>Select a Time</h3>
            </div>
            {selectedDate && <p className="text-sm mb-5" style={{ color: "#999" }}>{formatDate(selectedDate)}</p>}

            {slotError && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#FFF3F3", color: "#C62828", border: "1px solid #FFCDD2" }}>
                {slotError}
              </div>
            )}

            {loadingSlots ? (
              <p className="text-sm text-center py-8" style={{ color: "#aaa" }}>Loading availability…</p>
            ) : apiSlots.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#aaa" }}>No slots available for this date. Please select another day.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {apiSlots.map((slot) => {
                  const isActive = selectedTime === slot.time;
                  const unavailable = !slot.available;
                  const label = unavailable ? (slot.reason === "PAST" ? "passed" : "taken") : undefined;
                  return (
                    <button
                      key={slot.time}
                      disabled={unavailable}
                      onClick={() => !unavailable && handleTimeSelect(slot.time)}
                      title={unavailable ? (label === "passed" ? "This time has passed" : "This slot is taken") : undefined}
                      style={{
                        border: `1px solid ${unavailable ? "#ddd" : isActive ? "#C9A96E" : "#C9A96E"}`,
                        borderRadius: "20px", padding: "8px 4px", fontSize: "13px",
                        fontFamily: "Inter, sans-serif",
                        color: isActive ? "#fff" : unavailable ? "#ccc" : "#C9A96E",
                        backgroundColor: isActive ? "#C9A96E" : unavailable ? "#f8f8f8" : "transparent",
                        cursor: unavailable ? "not-allowed" : "pointer",
                        transition: "all 0.15s",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => { if (!unavailable && !isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(201,169,110,0.08)"; }}
                      onMouseLeave={(e) => { if (!unavailable && !isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                    >
                      <span style={{ display: "block" }}>{slot.time}</span>
                      {unavailable && (
                        <span style={{ display: "block", fontSize: "9px", letterSpacing: "0.5px", textTransform: "uppercase", color: "#ccc", marginTop: 1 }}>
                          {label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 3 — Your Details ── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setStep(2)} className="text-sm hover:opacity-70" style={{ color: "#C9A96E" }}>← Back</button>
              <h3 className="font-serif" style={{ fontSize: "20px" }}>Your Details</h3>
            </div>

            {/* Booking summary */}
            <div className="mb-6 p-4 rounded-xl space-y-2" style={{ border: "1px solid rgba(201,169,110,0.25)", backgroundColor: "#FEFDFB" }}>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "#888" }}>Treatment</span>
                <span className="font-medium text-right">{treatment.name}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "#888" }}>Duration</span>
                <span className="font-medium">{treatment.duration ?? `${bookingDuration} mins`}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "#888" }}>Date</span>
                <span className="font-medium text-right">{selectedDate ? formatDate(selectedDate) : "—"}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "#888" }}>Time</span>
                <span className="font-medium">
                  {selectedTime ? (() => {
                    const endMins = timeToMins(selectedTime) + bookingDuration;
                    return `${selectedTime} — ${minsToTime(endMins)}`;
                  })() : "—"}
                </span>
              </div>
              <div className="border-t pt-2 mt-2 space-y-1" style={{ borderColor: "rgba(201,169,110,0.15)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#888" }}>Total price</span>
                  <span className="font-serif" style={{ fontSize: "16px", color: "#111" }}>{treatment.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#888" }}>Deposit to pay now</span>
                  <span className="font-medium" style={{ color: "#C9A96E" }}>£{deposit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#888" }}>Balance due on arrival</span>
                  <span className="font-medium" style={{ color: "#666" }}>£{balance}</span>
                </div>
              </div>
            </div>

            <Field label="Full Name" required error={nameError}>
              <input
                type="text" value={name}
                onChange={(e) => { setName(e.target.value); if (nameError) setNameError(""); }}
                placeholder="Jane Smith"
                style={inputStyle(!!nameError)}
                onFocus={(e) => { if (!nameError) (e.currentTarget as HTMLInputElement).style.borderColor = "#C9A96E"; }}
                onBlur={(e) => { if (!nameError) (e.currentTarget as HTMLInputElement).style.borderColor = "#E0E0E0"; }}
              />
            </Field>

            <Field label="Email Address" required error={emailError}>
              <input
                type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                placeholder="jane@email.com"
                style={inputStyle(!!emailError)}
                onFocus={(e) => { if (!emailError) (e.currentTarget as HTMLInputElement).style.borderColor = "#C9A96E"; }}
                onBlur={(e) => { if (!emailError) (e.currentTarget as HTMLInputElement).style.borderColor = "#E0E0E0"; }}
              />
            </Field>

            <Field label="Phone Number" required error={phoneError}>
              <input
                type="tel" value={phone}
                onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(""); }}
                placeholder="07700 900000"
                style={inputStyle(!!phoneError)}
                onFocus={(e) => { if (!phoneError) (e.currentTarget as HTMLInputElement).style.borderColor = "#C9A96E"; }}
                onBlur={(e) => { if (!phoneError) (e.currentTarget as HTMLInputElement).style.borderColor = "#E0E0E0"; }}
              />
            </Field>

            <button
              onClick={handleContinueToPayment}
              className="w-full py-4 text-white font-medium text-sm uppercase tracking-wider transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
              style={{ backgroundColor: "#C9A96E", borderRadius: "12px", fontFamily: "Inter, sans-serif" }}
            >
              Continue to Payment →
            </button>

            <p className="text-xs text-center mt-3" style={{ color: "#bbb", fontFamily: "Inter, sans-serif" }}>
              You'll pay the £{deposit} deposit securely by card on the next screen.
            </p>
          </motion.div>
        )}

        {/* ── Step 4 — Payment ── */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => { setStep(3); setPaymentError(""); setStripeNotConfigured(false); }}
                className="text-sm hover:opacity-70"
                style={{ color: "#C9A96E" }}
                disabled={submitting}
              >← Back</button>
              <h3 className="font-serif" style={{ fontSize: "20px" }}>{stripeNotConfigured ? "Test Mode" : "Secure Payment"}</h3>
            </div>

            {/* Booking summary */}
            <div className="mb-5 p-4 rounded-xl space-y-1.5" style={{ border: "1px solid rgba(201,169,110,0.25)", backgroundColor: "#FEFDFB" }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#888" }}>Treatment</span>
                <span className="font-medium text-right">{treatment.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#888" }}>Duration</span>
                <span className="font-medium">{treatment.duration ?? `${bookingDuration} mins`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#888" }}>Date</span>
                <span className="font-medium text-right">{selectedDate ? formatDate(selectedDate) : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#888" }}>Time</span>
                <span className="font-medium">
                  {selectedTime ? (() => {
                    const endMins = timeToMins(selectedTime) + bookingDuration;
                    return `${selectedTime} — ${minsToTime(endMins)}`;
                  })() : "—"}
                </span>
              </div>
              <div className="border-t pt-2 mt-1 flex justify-between" style={{ borderColor: "rgba(201,169,110,0.15)" }}>
                <span className="text-sm font-semibold">Deposit to pay now</span>
                <span className="font-serif font-semibold" style={{ color: "#C9A96E", fontSize: "17px" }}>£{deposit}</span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: "#aaa" }}>
                <span>Balance due on arrival</span>
                <span>£{balance}</span>
              </div>
            </div>

            {/* Stripe not configured — "Coming soon" contact screen */}
            {stripeNotConfigured && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full" style={{ backgroundColor: "rgba(201,169,110,0.1)" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </div>
                <h3 className="font-serif mb-2" style={{ fontSize: "20px" }}>Test Mode</h3>
                <p className="text-sm mb-2" style={{ color: "#888", fontFamily: "Inter, sans-serif", lineHeight: "1.65" }}>
                  Stripe is not yet configured. Add <code style={{ fontSize: "12px", background: "#f5f0eb", padding: "1px 5px", borderRadius: "4px" }}>STRIPE_SECRET_KEY</code> in the portal to enable live payments.
                </p>
                <p className="text-sm mb-6" style={{ color: "#aaa", fontFamily: "Inter, sans-serif", lineHeight: "1.65" }}>
                  Click below to create a test booking and go through the forms flow without payment.
                </p>
                {paymentError && (
                  <div className="mb-4 p-3 rounded-lg text-sm text-left" style={{ background: "#FFF3F3", color: "#C62828", border: "1px solid #FFCDD2" }}>
                    {paymentError}
                  </div>
                )}
                <button
                  onClick={handleTestModeBooking}
                  disabled={testModeLoading}
                  className="flex items-center justify-center gap-2 w-full py-3.5 font-medium text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#5C1A1A", color: "#fff", borderRadius: "12px", fontFamily: "Inter, sans-serif", border: "none", cursor: testModeLoading ? "not-allowed" : "pointer" }}
                >
                  {testModeLoading ? (
                    <>
                      <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Creating test booking…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Create Test Booking &amp; Open Forms
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Payment error */}
            {!stripeNotConfigured && paymentError && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#FFF3F3", color: "#C62828", border: "1px solid #FFCDD2" }}>
                {paymentError}
              </div>
            )}

            {/* Stripe Elements mount point */}
            {!stripeNotConfigured && !paymentError && (
              <>
                {paymentLoading && (
                  <div className="flex items-center justify-center py-10">
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      border: "2px solid rgba(201,169,110,0.2)",
                      borderTopColor: "#C9A96E",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}
                <div
                  ref={paymentElementRef}
                  style={{ display: stripeElementMounted ? "block" : "none", marginBottom: "20px" }}
                />
                {stripeElementMounted && (
                  <button
                    onClick={handlePayment}
                    disabled={submitting}
                    className="w-full py-4 text-white font-medium text-sm uppercase tracking-wider transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
                    style={{ backgroundColor: "#C9A96E", borderRadius: "12px", fontFamily: "Inter, sans-serif", opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? "Processing…" : `Pay £${deposit} Securely`}
                  </button>
                )}
              </>
            )}

            {!stripeNotConfigured && (
              <p className="text-xs text-center mt-4" style={{ color: "#bbb", fontFamily: "Inter, sans-serif" }}>
                🔒 Payments are processed securely by Stripe. Your card details are never stored.
              </p>
            )}
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
