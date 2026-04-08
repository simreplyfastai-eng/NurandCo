import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

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

// ── Date helpers (local-timezone safe) ──────────────────────────────────────

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

// ── Availability helpers ─────────────────────────────────────────────────────

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

// ── Slot blocking ────────────────────────────────────────────────────────────

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

// ── Validation ───────────────────────────────────────────────────────────────

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

// ── Calendar ─────────────────────────────────────────────────────────────────

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
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1);
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

  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Fetch availability
  useEffect(() => {
    fetch("/api/availability")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setAvail(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    firstFocusRef.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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

  const handleConfirm = async () => {
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePhone(phone);
    setNameError(nErr);
    setEmailError(eErr);
    setPhoneError(pErr);
    if (nErr || eErr || pErr) return;

    setSubmitting(true);
    setSlotError("");

    const price = parsePrice(treatment?.price ?? "0");
    const deposit = Math.round(price * 0.5);

    const booking = {
      id: uid(),
      clientName: name.trim(),
      clientEmail: email.trim(),
      clientPhone: phone.replace(/\s/g, ""),
      treatment: treatment?.name ?? "",
      category: "",
      price,
      deposit,
      depositPaid: false,
      balancePaid: false,
      date: selectedDate ? fmtDate(selectedDate) : "",
      time: selectedTime ?? "",
      status: "Pending",
      paymentMethod: "Stripe",
      stripePaymentId: null,
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

      if (res.status === 409) {
        const data = await res.json();
        setSlotError(data.error ?? "Sorry, that slot was just taken. Please choose another time.");
        if (selectedDate) await fetchDateBookings(selectedDate);
        setSelectedTime(null);
        setStep(2);
        setSubmitting(false);
        return;
      }

      if (res.status === 429) {
        setSlotError("Too many booking attempts. Please try again in a few minutes.");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        setSlotError("Something went wrong. Please try again or contact us directly.");
        setSubmitting(false);
        return;
      }
    } catch {
      setSlotError("Something went wrong. Please try again or contact us directly.");
      setSubmitting(false);
      return;
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
  const deposit = Math.round(price * 0.5);
  const balance = price - deposit;
  const firstName = name.trim().split(" ")[0] || "there";
  const treatmentRef = (treatment.name.length > 20 ? treatment.name.slice(0, 20) : treatment.name);
  const bankRef = `${firstName} - ${treatmentRef}`;

  // Compute available slots: working hours minus blocked slots
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

        {/* ── Step 3 — Details + Confirm ── */}
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
                  <span style={{ color: "#888" }}>Deposit (50%)</span>
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

            {slotError && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#FFF3F3", color: "#C62828", border: "1px solid #FFCDD2" }}>
                {slotError}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full py-4 text-white font-medium text-sm uppercase tracking-wider transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
              style={{ backgroundColor: "#C9A96E", borderRadius: "12px", fontFamily: "Inter, sans-serif", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Submitting…" : "Confirm Booking Request"}
            </button>

            <p className="text-xs text-center mt-3" style={{ color: "#bbb", fontFamily: "Inter, sans-serif" }}>
              You will receive bank transfer details to secure your appointment.
            </p>
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
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-full" style={{ backgroundColor: "rgba(201,169,110,0.12)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className="font-serif mb-2" style={{ fontSize: "24px" }}>Booking Request Received</h2>
            <p className="text-sm mb-6" style={{ color: "#888", fontFamily: "Inter, sans-serif" }}>
              A confirmation has been sent to <strong style={{ color: "#111" }}>{email}</strong>
            </p>

            {/* Booking summary */}
            <div className="text-left mb-6 p-4 rounded-xl space-y-2" style={{ border: "1px solid rgba(201,169,110,0.25)", backgroundColor: "#FEFDFB" }}>
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
                  <span style={{ color: "#888" }}>Deposit due</span>
                  <span className="font-medium" style={{ color: "#C9A96E" }}>£{deposit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#888" }}>Balance due on arrival</span>
                  <span className="font-medium" style={{ color: "#666" }}>£{balance}</span>
                </div>
              </div>
            </div>

            {/* Bank transfer section */}
            <div className="text-left mb-6 p-4 rounded-xl" style={{ background: "#FFF8F0", border: "1px solid #F5DEB3" }}>
              <p className="font-medium text-sm mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                To secure your appointment, please send your deposit of <strong style={{ color: "#C9A96E" }}>£{deposit}</strong> via bank transfer:
              </p>
              <div className="space-y-1.5 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                <div className="flex justify-between">
                  <span style={{ color: "#888" }}>Account name</span>
                  <span className="font-medium">Simrandeep Sangha</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#888" }}>Sort code</span>
                  <span className="font-medium">60-84-07</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#888" }}>Account number</span>
                  <span className="font-medium">17575567</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: "#888" }}>Reference</span>
                  <span className="font-medium text-right">{bankRef}</span>
                </div>
              </div>
              <p className="text-xs mt-3" style={{ color: "#999", fontFamily: "Inter, sans-serif" }}>
                Your appointment will be confirmed once your deposit is received. If you have any questions contact us on Instagram{" "}
                <strong>@dermadollaesthetics</strong> or WhatsApp.
              </p>
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
