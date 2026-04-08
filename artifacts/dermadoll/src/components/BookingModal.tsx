import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Stripe, StripeElements } from "@stripe/stripe-js";

interface Treatment {
  name: string;
  price: string;
}

interface BookingModalProps {
  treatment: Treatment | null;
  onClose: () => void;
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

interface DateBooking {
  time: string;
  durationMinutes: number;
  status: string;
}

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AVAIL_DEFAULT: Availability = {
  defaults: {
    Mon: { on: false },
    Tue: { on: true, start: "10:00", end: "19:00" },
    Wed: { on: true, start: "10:00", end: "19:00" },
    Thu: { on: true, start: "10:00", end: "19:00" },
    Fri: { on: true, start: "09:00", end: "16:00" },
    Sat: { on: true, start: "09:00", end: "14:00" },
    Sun: { on: false },
  },
  overrides: {},
};

// ── Date helpers ─────────────────────────────────────────────────────────────

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

// ── Availability helpers ──────────────────────────────────────────────────────

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

function getWorkingSlots(avail: Availability, date: Date): string[] {
  const day = getAvailForDate(avail, date);
  if (!day || !day.on) return [];
  const start = day.start ?? "09:00";
  const end = day.end ?? "18:00";
  const startMins = timeToMins(start);
  const endMins = timeToMins(end);
  const slots: string[] = [];
  for (let m = startMins; m < endMins; m += 30) slots.push(minsToTime(m));
  return slots;
}

// ── Slot blocking ─────────────────────────────────────────────────────────────

function computeBlockedSlots(bookings: DateBooking[]): Set<string> {
  const blocked = new Set<string>();
  for (const { time, durationMinutes } of bookings) {
    if (!time) continue;
    const startMins = timeToMins(time);
    const blockedUntil = startMins + durationMinutes + 15;
    for (let m = startMins; m < blockedUntil; m += 30) blocked.add(minsToTime(m));
  }
  return blocked;
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

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function parsePrice(priceStr: string): number { return parseInt(priceStr.replace(/[^0-9]/g, ""), 10) || 0; }

// ── Main Component ────────────────────────────────────────────────────────────

export default function BookingModal({ treatment, onClose }: BookingModalProps) {
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
  const [dateBookings, setDateBookings] = useState<DateBooking[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Stripe payment state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [stripeElementMounted, setStripeElementMounted] = useState(false);
  const [stripeNotConfigured, setStripeNotConfigured] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [bookingDuration, setBookingDuration] = useState(30);
  const [hasResendKey, setHasResendKey] = useState(false);
  const [depositPercent, setDepositPercent] = useState(50);

  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<HTMLDivElement>(null);
  const clientSecretRef = useRef<string | null>(null);

  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Fetch availability and config on mount
  useEffect(() => {
    fetch("/api/availability")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setAvail(data); })
      .catch(() => {});
    fetch("/api/config")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.whatsapp) setWhatsapp(data.whatsapp);
        if (data?.hasResendKey) setHasResendKey(true);
        if (typeof data?.depositPercent === "number" && data.depositPercent > 0) {
          setDepositPercent(data.depositPercent);
        }
      })
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

  // Fetch bookings for a date (never cached)
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

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSlotError("");
    setStep(2);
    await fetchDateBookings(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setSlotError("");
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

        // Create payment intent
        const price = parsePrice(treatment?.price ?? "0");
        const depositAmount = Math.floor(price * (config.depositPercent ?? depositPercent) / 100);

        const piRes = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: depositAmount * 100, // pence
            treatment: treatment?.name ?? "",
            clientName: name,
            clientEmail: email,
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

        const { clientSecret } = await piRes.json() as { clientSecret: string };
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

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setPaymentError(`Payment failed: ${error.message ?? "Unknown error"}. Please check your card details and try again.`);
      setSubmitting(false);
      return;
    }

    // Payment succeeded — create booking
    const price = parsePrice(treatment?.price ?? "0");
    const depositAmt = Math.floor(price * depositPercent / 100);
    const stripePaymentId = clientSecretRef.current?.split("_secret_")[0] ?? null;

    const booking = {
      id: uid(),
      clientName: name.trim(),
      clientEmail: email.trim(),
      clientPhone: phone.replace(/\s/g, ""),
      treatment: treatment?.name ?? "",
      price,
      deposit: depositAmt,
      depositPaid: true,
      balancePaid: false,
      date: selectedDate ? fmtDate(selectedDate) : "",
      time: selectedTime ?? "",
      status: "Confirmed",
      paymentMethod: "Stripe",
      stripePaymentId,
      notes: "",
      createdAt: Date.now(),
      source: "Website",
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });

      if (res.ok || res.status === 409) {
        // Success or slot conflict — payment taken, webhook will handle edge cases
        const data = res.ok ? await res.json() as { durationMinutes?: number } : null;
        if (data?.durationMinutes) setBookingDuration(data.durationMinutes);
      }
    } catch {
      // Network failure — payment was taken, Stripe webhook will create the booking
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

  if (!treatment) return null;

  const price = parsePrice(treatment.price);
  const deposit = Math.floor(price * depositPercent / 100);
  const balance = price - deposit;

  // Compute available slots
  const workingSlots = selectedDate ? getWorkingSlots(avail, selectedDate) : [];
  const blockedSlots = computeBlockedSlots(dateBookings);
  const availableSlots = workingSlots.filter((s) => !blockedSlots.has(s));

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
            <h3 className="font-serif mb-5" style={{ fontSize: "20px" }}>Select a Date</h3>
            <Calendar onSelect={handleDateSelect} selected={selectedDate} avail={avail} />
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
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#aaa" }}>No available slots for this date. Please select another day.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {workingSlots.map((slot) => {
                  const isBlocked = blockedSlots.has(slot);
                  const isActive = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      disabled={isBlocked}
                      onClick={() => !isBlocked && handleTimeSelect(slot)}
                      style={{
                        border: "1px solid",
                        borderColor: isBlocked ? "#E8E8E8" : "#C9A96E",
                        borderRadius: "20px", padding: "8px 4px", fontSize: "13px",
                        fontFamily: "Inter, sans-serif",
                        color: isBlocked ? "#ccc" : isActive ? "#fff" : "#C9A96E",
                        backgroundColor: isBlocked ? "#F9F9F9" : isActive ? "#C9A96E" : "transparent",
                        cursor: isBlocked ? "default" : "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!isBlocked && !isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(201,169,110,0.08)"; }}
                      onMouseLeave={(e) => { if (!isBlocked && !isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                    >
                      {slot}
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
                <span style={{ color: "#888" }}>Date</span>
                <span className="font-medium text-right">{selectedDate ? formatDate(selectedDate) : "—"}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "#888" }}>Time</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="border-t pt-2 mt-2 space-y-1" style={{ borderColor: "rgba(201,169,110,0.15)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#888" }}>Total price</span>
                  <span className="font-serif" style={{ fontSize: "16px", color: "#111" }}>{treatment.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#888" }}>Deposit to pay now ({depositPercent}%)</span>
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
              <h3 className="font-serif" style={{ fontSize: "20px" }}>{stripeNotConfigured ? "Get in Touch" : "Secure Payment"}</h3>
            </div>

            {/* Booking summary */}
            <div className="mb-5 p-4 rounded-xl space-y-1.5" style={{ border: "1px solid rgba(201,169,110,0.25)", backgroundColor: "#FEFDFB" }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#888" }}>Treatment</span>
                <span className="font-medium text-right">{treatment.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#888" }}>Date</span>
                <span className="font-medium text-right">{selectedDate ? formatDate(selectedDate) : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#888" }}>Time</span>
                <span className="font-medium">{selectedTime}</span>
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="font-serif mb-2" style={{ fontSize: "20px" }}>We're getting ready to take bookings!</h3>
                <p className="text-sm mb-6" style={{ color: "#888", fontFamily: "Inter, sans-serif", lineHeight: "1.65" }}>
                  Online booking will be available very soon. In the meantime, please contact us to book your appointment:
                </p>
                <div className="space-y-3">
                  <a
                    href="https://instagram.com/dermadollaesthetics"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 font-medium text-sm transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: "#C9A96E", color: "#fff", borderRadius: "12px", fontFamily: "Inter, sans-serif", textDecoration: "none" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                    Message on Instagram
                  </a>
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 font-medium text-sm transition-all duration-200 hover:opacity-90"
                      style={{ backgroundColor: "#25D366", color: "#fff", borderRadius: "12px", fontFamily: "Inter, sans-serif", textDecoration: "none" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                      </svg>
                      WhatsApp Us
                    </a>
                  )}
                  {!whatsapp && (
                    <a
                      href="https://instagram.com/dermadollaesthetics"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 font-medium text-sm transition-all duration-200 hover:opacity-90"
                      style={{ border: "1px solid #C9A96E", color: "#C9A96E", borderRadius: "12px", fontFamily: "Inter, sans-serif", textDecoration: "none" }}
                    >
                      @dermadollaesthetics
                    </a>
                  )}
                </div>
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

        {/* ── Success screen ── */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="text-center"
          >
            {/* Gold checkmark */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-full" style={{ backgroundColor: "rgba(201,169,110,0.12)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className="font-serif mb-1" style={{ fontSize: "26px" }}>Booking Confirmed!</h2>
            <p className="text-sm mb-6" style={{ color: "#888", fontFamily: "Inter, sans-serif" }}>
              {hasResendKey
                ? <>A confirmation has been sent to <strong style={{ color: "#111" }}>{email}</strong></>
                : "Please screenshot this page for your records."
              }
            </p>

            {/* Booking details */}
            <div className="text-left mb-5 p-4 rounded-xl space-y-2" style={{ border: "1px solid rgba(201,169,110,0.25)", backgroundColor: "#FEFDFB" }}>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "#888" }}>Treatment</span>
                <span className="font-medium text-right">{treatment.name}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "#888" }}>Date</span>
                <span className="font-medium text-right">{selectedDate ? formatDate(selectedDate) : "—"}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "#888" }}>Time</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "#888" }}>Duration</span>
                <span className="font-medium">Approximately {bookingDuration} minutes</span>
              </div>
              <div className="border-t pt-2 mt-2 space-y-1" style={{ borderColor: "rgba(201,169,110,0.15)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#888" }}>Deposit paid</span>
                  <span className="font-semibold" style={{ color: "#2D6A4F" }}>£{deposit} ✓</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#888" }}>Remaining balance</span>
                  <span className="font-medium" style={{ color: "#111" }}>£{balance} — due on arrival</span>
                </div>
              </div>
            </div>

            <p className="text-sm mb-4" style={{ color: "#666", fontFamily: "Inter, sans-serif" }}>
              See you soon! If you need to reschedule, please contact us:
            </p>
            <div className="text-sm mb-6 space-y-1" style={{ fontFamily: "Inter, sans-serif" }}>
              <div style={{ color: "#888" }}>Instagram: <strong style={{ color: "#111" }}>@dermadollaesthetics</strong></div>
              {whatsapp && <div style={{ color: "#888" }}>WhatsApp: <strong style={{ color: "#111" }}>{whatsapp}</strong></div>}
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 text-white font-medium text-sm uppercase tracking-wider transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: "#C9A96E", borderRadius: "12px", fontFamily: "Inter, sans-serif" }}
            >
              Done
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
