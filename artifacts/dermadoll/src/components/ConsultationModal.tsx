import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Stripe, StripeElements } from "@stripe/stripe-js";

interface DayAvail {
  on: boolean;
  start?: string;
  end?: string;
}

interface Availability {
  defaults: Record<string, DayAvail>;
  overrides: Record<string, { on: boolean; start?: string; end?: string }>;
}

interface DateBooking {
  time: string;
  durationMinutes: number;
  status: string;
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

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minsToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function getAvailForDate(avail: Availability, date: Date): DayAvail | null {
  const dateStr = fmtDate(date);
  const override = avail.overrides?.[dateStr];
  if (override !== undefined) return override.on ? override : { on: false };
  const dayKey = DAY_KEYS[date.getDay()];
  return avail.defaults?.[dayKey] ?? { on: false };
}

function isDateDisabled(avail: Availability, date: Date, today: Date): boolean {
  if (date < today) return true;
  const day = getAvailForDate(avail, date);
  return !day || !day.on;
}

// Consultations are 15 minutes — 15-min grid, back-to-back, no buffer
const CONSULTATION_DURATION = 15;

function generateAvailableSlots(
  avail: Availability,
  date: Date,
  existingBookings: DateBooking[],
): string[] {
  const day = getAvailForDate(avail, date);
  if (!day || !day.on) return [];
  const openMins = timeToMins(day.start ?? "09:00");
  const closeMins = timeToMins(day.end ?? "18:00");

  const todayStr = fmtDate(new Date());
  const isToday = fmtDate(date) === todayStr;
  let nowBuffer = 0;
  if (isToday) {
    const now = new Date();
    nowBuffer = now.getHours() * 60 + now.getMinutes() + 15;
  }

  const slots: string[] = [];
  for (let t = openMins; t + CONSULTATION_DURATION <= closeMins; t += 15) {
    if (isToday && t < nowBuffer) continue;
    const conflict = existingBookings.some((b) => {
      if (!b.time || b.status === "Cancelled") return false;
      const bStart = timeToMins(b.time);
      const bEnd = bStart + b.durationMinutes;
      return t < bEnd && t + CONSULTATION_DURATION > bStart;
    });
    if (!conflict) slots.push(minsToTime(t));
  }
  return slots;
}

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

function validateDOB(v: string): string {
  if (!v.trim()) return "Please enter your date of birth";
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v.trim())) return "Please use DD/MM/YYYY format";
  const [d, mo, y] = v.split("/").map(Number);
  if (mo < 1 || mo > 12) return "Invalid month";
  if (d < 1 || d > 31) return "Invalid day";
  if (y < 1900 || y > new Date().getFullYear()) return "Invalid year";
  return "";
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function Calendar({
  onSelect, selected, avail,
}: {
  onSelect: (d: Date) => void;
  selected: Date | null;
  avail: Availability;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(viewYear, viewMonth, d));

  const prevMonth = () => { if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else setViewMonth((m) => m + 1); };

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
          const disabled = isDateDisabled(avail, date, today);
          const isSelected = selected !== null && fmtDate(date) === fmtDate(selected);
          return (
            <button
              key={fmtDate(date)}
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
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, required, error, children, hint }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "#888", fontFamily: "Inter, sans-serif" }}>
        {label} {required && <span style={{ color: "#C9A96E" }}>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs mt-1" style={{ color: "#aaa" }}>{hint}</p>}
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

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function ConsultationModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "success">(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [notes, setNotes] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [dobError, setDobError] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slotError, setSlotError] = useState("");

  const [avail, setAvail] = useState<Availability>(AVAIL_DEFAULT);
  const [dateBookings, setDateBookings] = useState<DateBooking[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [stripeElementMounted, setStripeElementMounted] = useState(false);
  const [stripeNotConfigured, setStripeNotConfigured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");

  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<HTMLDivElement>(null);
  const clientSecretRef = useRef<string | null>(null);
  const depositPoundsRef = useRef<number>(0.10);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch("/api/availability")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setAvail(data); })
      .catch(() => {});
    fetch("/api/config")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.whatsapp) setWhatsapp(data.whatsapp); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    firstFocusRef.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && step !== "success") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, step]);

  const fetchDateBookings = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    try {
      const r = await fetch(`/api/bookings/date/${fmtDate(date)}`, { cache: "no-store" });
      if (r.ok) setDateBookings(await r.json());
      else setDateBookings([]);
    } catch {
      setDateBookings([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const handleDetailsNext = () => {
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePhone(phone);
    const dErr = validateDOB(dob);
    setNameError(nErr);
    setEmailError(eErr);
    setPhoneError(pErr);
    setDobError(dErr);
    if (nErr || eErr || pErr || dErr) return;
    setStep(2);
  };

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSlotError("");
    setStep(3);
    await fetchDateBookings(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setSlotError("");
    setPaymentError("");
    setStripeElementMounted(false);
    setStep(4);
  };

  useEffect(() => {
    if (step !== 4) return;
    let cancelled = false;

    async function initStripe() {
      setPaymentLoading(true);
      setPaymentError("");

      try {
        const configRes = await fetch("/api/config");
        const config = await configRes.json() as { stripePublishableKey?: string; whatsapp?: string };
        if (config.whatsapp) setWhatsapp(config.whatsapp);

        if (!config.stripePublishableKey) {
          if (!cancelled) { setStripeNotConfigured(true); setPaymentLoading(false); }
          return;
        }

        const piRes = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 10,
            treatment: "Consultation",
            clientName: name,
            clientEmail: email,
          }),
        });

        if (!piRes.ok) {
          const d = await piRes.json() as { error?: string };
          if (!cancelled) { setPaymentError(d.error ?? "Failed to set up payment. Please try again."); setPaymentLoading(false); }
          return;
        }

        const piData = await piRes.json() as { clientSecret: string; depositAmountPence?: number };
        const { clientSecret } = piData;
        if (piData.depositAmountPence) depositPoundsRef.current = piData.depositAmountPence / 100;
        if (cancelled || !clientSecret) return;
        clientSecretRef.current = clientSecret;

        const { loadStripe } = await import("@stripe/stripe-js");
        const stripe = await loadStripe(config.stripePublishableKey);
        if (!stripe || cancelled) return;
        stripeRef.current = stripe;

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
        if (paymentElementRef.current) paymentEl.mount(paymentElementRef.current);

        paymentEl.on("ready", () => {
          if (!cancelled) { setStripeElementMounted(true); setPaymentLoading(false); }
        });
      } catch {
        if (!cancelled) { setPaymentError("Failed to load payment form. Please refresh and try again."); setPaymentLoading(false); }
      }
    }

    initStripe();
    return () => {
      cancelled = true;
      try { elementsRef.current?.getElement("payment")?.unmount(); } catch { /* ignore */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handlePayment = async () => {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) return;

    setSubmitting(true);
    setPaymentError("");

    const { error } = await stripe.confirmPayment({ elements, redirect: "if_required" });

    if (error) {
      setPaymentError(`Payment failed: ${error.message ?? "Unknown error"}. Please check your card details and try again.`);
      setSubmitting(false);
      return;
    }

    const stripePaymentId = clientSecretRef.current?.split("_secret_")[0] ?? null;

    const depositPounds = depositPoundsRef.current;
    const booking = {
      id: uid(),
      clientName: name.trim(),
      clientEmail: email.trim(),
      clientPhone: phone.replace(/\s/g, ""),
      clientDOB: dob.trim(),
      clientNotes: notes.trim(),
      treatment: "Consultation",
      price: depositPounds,
      deposit: depositPounds,
      depositPaid: true,
      balancePaid: true,
      duration_minutes: 15,
      category: "Consultation",
      date: selectedDate ? fmtDate(selectedDate) : "",
      time: selectedTime ?? "",
      status: "Confirmed",
      paymentMethod: "Stripe",
      stripePaymentId,
      notes: notes.trim(),
      createdAt: Date.now(),
      source: "Website",
    };

    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
    } catch {
      // Network failure — payment taken, webhook will handle
    }

    setSubmitting(false);
    setStep("success");
  };

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);

  const availableSlots = selectedDate
    ? generateAvailableSlots(avail, selectedDate, dateBookings)
    : [];

  const stepLabels = ["Your Details", "Choose Date", "Choose Time", "Payment"];
  const currentStepIndex = step === "success" ? 4 : (step as number) - 1;

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
        className="relative w-full md:max-w-[540px] bg-white overflow-y-auto"
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
          <div className="mb-6 pr-8">
            <h2 className="font-serif leading-snug mb-1" style={{ fontSize: "24px" }}>Book a Consultation</h2>
            <span className="font-serif" style={{ fontSize: "20px", color: "#C9A96E" }}>£0.10</span>

            {/* Step progress */}
            <div className="flex items-center gap-1 mt-4">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-1 flex-1">
                  <div style={{
                    width: "100%", height: "3px", borderRadius: "2px",
                    background: i <= currentStepIndex ? "#C9A96E" : "#E8E8E8",
                    transition: "background 0.3s",
                  }} />
                </div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: "#aaa", fontFamily: "Inter, sans-serif" }}>
              Step {step as number} of 4 — {stepLabels[currentStepIndex]}
            </p>
          </div>
        )}

        {/* ── Step 1 — Client Details ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <h3 className="font-serif mb-5" style={{ fontSize: "20px" }}>Your Details</h3>

            <Field label="Full Name" required error={nameError}>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (nameError) setNameError(""); }}
                placeholder="Your full name"
                style={inputStyle(!!nameError)}
              />
            </Field>

            <Field label="Email Address" required error={emailError}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                placeholder="your@email.com"
                style={inputStyle(!!emailError)}
              />
            </Field>

            <Field label="Phone Number" required error={phoneError}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(""); }}
                placeholder="07XXXXXXXXX"
                style={inputStyle(!!phoneError)}
              />
            </Field>

            <Field label="Date of Birth" required error={dobError} hint="Required for treatment records">
              <input
                type="text"
                value={dob}
                onChange={(e) => { setDob(e.target.value); if (dobError) setDobError(""); }}
                placeholder="DD/MM/YYYY"
                style={inputStyle(!!dobError)}
              />
            </Field>

            <Field label="What would you like to discuss? (optional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. fine lines, acne scarring, lip enhancement…"
                style={{ ...inputStyle(false), resize: "vertical", minHeight: "80px" }}
              />
            </Field>

            <button
              onClick={handleDetailsNext}
              className="w-full mt-2"
              style={{
                background: "#C9A96E", color: "#fff", border: "none",
                borderRadius: "8px", padding: "16px", fontSize: "13px",
                fontFamily: "Inter, sans-serif", fontWeight: 700,
                letterSpacing: "2px", textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* ── Step 2 — Calendar ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setStep(1)} className="text-sm hover:opacity-70" style={{ color: "#C9A96E" }}>← Back</button>
              <h3 className="font-serif" style={{ fontSize: "20px" }}>Select a Date</h3>
            </div>
            <Calendar onSelect={handleDateSelect} selected={selectedDate} avail={avail} />
          </motion.div>
        )}

        {/* ── Step 3 — Time Slots ── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(2)} className="text-sm hover:opacity-70" style={{ color: "#C9A96E" }}>← Back</button>
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
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#aaa" }}>No available slots for this date. Please select another day.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => {
                  const isActive = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => handleTimeSelect(slot)}
                      style={{
                        padding: "10px 6px", borderRadius: "8px",
                        fontSize: "13px", fontFamily: "Inter, sans-serif",
                        border: isActive ? "2px solid #C9A96E" : "1px solid #E0E0E0",
                        background: isActive ? "#C9A96E" : "transparent",
                        color: isActive ? "#fff" : "#111",
                        cursor: "pointer",
                        fontWeight: isActive ? 700 : 400,
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 4 — Payment ── */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setStep(3)} className="text-sm hover:opacity-70" style={{ color: "#C9A96E" }}>← Back</button>
              <h3 className="font-serif" style={{ fontSize: "20px" }}>Payment</h3>
            </div>

            {/* Summary */}
            <div className="mb-5 p-4 rounded-xl" style={{ background: "#FAFAF8", border: "1px solid #E8E8E8" }}>
              <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "#aaa", fontFamily: "Inter, sans-serif" }}>Booking Summary</p>
              <div className="text-sm space-y-1" style={{ fontFamily: "Inter, sans-serif", color: "#111" }}>
                <div><span style={{ color: "#888" }}>Name: </span>{name}</div>
                <div><span style={{ color: "#888" }}>Email: </span>{email}</div>
                <div><span style={{ color: "#888" }}>Phone: </span>{phone}</div>
                <div className="mt-2 pt-2" style={{ borderTop: "1px solid #E8E8E8" }}>
                  <div><span style={{ color: "#888" }}>Treatment: </span><strong>Consultation</strong></div>
                  <div><span style={{ color: "#888" }}>Date: </span>{selectedDate ? formatDate(selectedDate) : "—"}</div>
                  <div><span style={{ color: "#888" }}>Time: </span>{selectedTime ?? "—"}</div>
                  <div><span style={{ color: "#888" }}>Duration: </span>15 minutes</div>
                </div>
                <div className="mt-2 pt-2" style={{ borderTop: "1px solid #E8E8E8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#888" }}>Payment (paid in full):</span>
                    <strong style={{ color: "#C9A96E", fontSize: "18px", fontFamily: "Cormorant Garamond, Georgia, serif" }}>£0.10</strong>
                  </div>
                  <p className="mt-1" style={{ color: "#888", fontSize: "11px", fontStyle: "italic" }}>Your £0.10 is redeemable against any treatment booked on the day</p>
                </div>
              </div>
            </div>

            {stripeNotConfigured ? (
              <div className="p-4 rounded-xl text-sm" style={{ background: "#FFF8F0", border: "1px solid #FFE0B2", color: "#E65100" }}>
                Online payments aren't set up yet. Please contact us directly to complete your booking.
              </div>
            ) : (
              <>
                {paymentLoading && (
                  <div className="flex items-center justify-center py-10">
                    <div style={{ width: "24px", height: "24px", border: "3px solid #E8E8E8", borderTopColor: "#C9A96E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}
                <div ref={paymentElementRef} style={{ display: stripeElementMounted ? "block" : "none" }} />
                {paymentError && (
                  <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: "#FFF3F3", color: "#C62828", border: "1px solid #FFCDD2" }}>
                    {paymentError}
                  </div>
                )}
                {stripeElementMounted && (
                  <button
                    onClick={handlePayment}
                    disabled={submitting}
                    className="w-full mt-4"
                    style={{
                      background: submitting ? "#E0C99A" : "#C9A96E", color: "#fff",
                      border: "none", borderRadius: "8px", padding: "16px",
                      fontSize: "13px", fontFamily: "Inter, sans-serif",
                      fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase",
                      cursor: submitting ? "default" : "pointer",
                    }}
                  >
                    {submitting ? "Processing…" : "Pay £0.10 — Confirm Consultation"}
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(45,106,79,0.1)" }}>
                <span style={{ fontSize: "28px" }}>✓</span>
              </div>
              <h2 className="font-serif mb-2" style={{ fontSize: "28px" }}>Consultation Confirmed!</h2>
              <p className="text-sm" style={{ color: "#888", fontFamily: "Inter, sans-serif" }}>A confirmation has been sent to {email}</p>
            </div>

            <div className="p-5 rounded-xl mb-5" style={{ background: "#FAFAF8", border: "1px solid #E8E8E8" }}>
              <div className="space-y-2 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                <div><span style={{ color: "#888" }}>Name: </span>{name}</div>
                <div><span style={{ color: "#888" }}>Date: </span>{selectedDate ? formatDate(selectedDate) : "—"}</div>
                <div><span style={{ color: "#888" }}>Time: </span>{selectedTime}</div>
                <div><span style={{ color: "#888" }}>Duration: </span>15 minutes</div>
                <div className="pt-2 mt-2" style={{ borderTop: "1px solid #E8E8E8" }}>
                  <span style={{ color: "#2D6A4F", fontWeight: 600 }}>✓ Paid in full: £0.10</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl mb-6 text-sm" style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.25)", fontFamily: "Inter, sans-serif" }}>
              <p style={{ color: "#C9A96E", fontWeight: 600, marginBottom: "4px" }}>Your £0.10 is redeemable</p>
              <p style={{ color: "#888" }}>Your consultation fee can be used against any treatment you book on the day.</p>
            </div>

            <div className="text-center text-sm" style={{ fontFamily: "Inter, sans-serif", color: "#888" }}>
              <p className="mb-1">See you soon!</p>
              {whatsapp && <p>WhatsApp: <strong style={{ color: "#111" }}>{whatsapp}</strong></p>}
              <p>Instagram: <strong style={{ color: "#111" }}>@dermadollaesthetics</strong></p>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-6"
              style={{
                background: "#111", color: "#fff", border: "none",
                borderRadius: "8px", padding: "16px", fontSize: "13px",
                fontFamily: "Inter, sans-serif", fontWeight: 700,
                letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Close
            </button>
          </motion.div>
        )}
      </motion.div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
