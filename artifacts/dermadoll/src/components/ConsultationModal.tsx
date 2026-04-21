import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

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

const TREATMENT_OPTIONS = [
  "Botox / Anti-Wrinkle Injections",
  "Lip Filler",
  "Cheek Filler",
  "Jawline & Chin Contouring",
  "Facial Contouring",
  "Skin Boosters",
  "Facials & Skin Treatments",
  "Fat Dissolving (Lemon Bottle)",
  "Teeth Whitening",
  "Not sure yet / General enquiry",
];

// RULE 1: always use UTC methods — Date objects are created with Date.UTC
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

// RULE 2: use UTC-safe dateStr, never date.getDay() which uses local timezone
function getAvailForDate(avail: Availability, date: Date): DayAvail | null {
  const dateStr = fmtDate(date);
  const override = avail.overrides?.[dateStr];
  if (override !== undefined) return override.on ? override : { on: false };
  // Parse dateStr to get UTC day-of-week (avoids local-timezone off-by-one)
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const dayKey = DAY_KEYS[dow];
  return avail.defaults?.[dayKey] ?? { on: false };
}

function isDateDisabled(avail: Availability, date: Date, today: Date): boolean {
  if (date < today) return true;
  const day = getAvailForDate(avail, date);
  return !day || !day.on;
}

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

  // RULE 7: use London timezone for past-slot filtering (with 30-min buffer)
  const londonNow = new Date(new Date().toLocaleString("en-GB", { timeZone: "Europe/London" }));
  const londonDateStr = `${londonNow.getFullYear()}-${String(londonNow.getMonth() + 1).padStart(2, "0")}-${String(londonNow.getDate()).padStart(2, "0")}`;
  const isToday = fmtDate(date) === londonDateStr;
  let nowBuffer = 0;
  if (isToday) {
    nowBuffer = londonNow.getHours() * 60 + londonNow.getMinutes() + 30;
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

  // RULE 1: use Date.UTC for all cell dates to avoid midnight local-timezone off-by-one
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay(); // 0=Sun
  const startOffset = firstDow === 0 ? 6 : firstDow - 1; // Mon=0..Sun=6
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(viewYear, viewMonth, d)));

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
          // Use UTC methods since cells are created with Date.UTC
          const dateStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
          const disabled = isDateDisabled(avail, date, today);
          const selStr = selected ? `${selected.getUTCFullYear()}-${String(selected.getUTCMonth() + 1).padStart(2, "0")}-${String(selected.getUTCDate()).padStart(2, "0")}` : "";
          const isSelected = selStr === dateStr;
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

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [dobError, setDobError] = useState("");

  const [treatmentInterest, setTreatmentInterest] = useState("");
  const [treatmentError, setTreatmentError] = useState("");
  const [skinConcerns, setSkinConcerns] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slotError, setSlotError] = useState("");

  const [avail, setAvail] = useState<Availability>(AVAIL_DEFAULT);
  const [dateBookings, setDateBookings] = useState<DateBooking[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const bookingIdRef = useRef<string>(uid());
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

  const handleTreatmentNext = () => {
    if (!treatmentInterest) { setTreatmentError("Please select a treatment you're interested in"); return; }
    setTreatmentError("");
    setStep(3);
  };

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSlotError("");
    setStep(4);
    await fetchDateBookings(date);
  };

  const handleTimeSelect = async (time: string) => {
    setSelectedTime(time);
    setSlotError("");
    setSubmitError("");
    setSubmitting(true);

    const booking = {
      id: bookingIdRef.current,
      clientName: name.trim(),
      clientEmail: email.trim(),
      clientPhone: phone.replace(/\s/g, ""),
      clientDOB: dob.trim(),
      clientNotes: skinConcerns.trim(),
      treatment: "Consultation",
      category: "Consultation",
      notes: treatmentInterest,
      price: 0,
      deposit: 0,
      depositPaid: true,
      balancePaid: true,
      duration_minutes: 15,
      date: selectedDate ? fmtDate(selectedDate) : "",
      time,
      status: "Confirmed",
      paymentMethod: "None",
      createdAt: Date.now(),
      source: "Website",
    };

    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      if (!r.ok) {
        const d = await r.json() as { error?: string };
        setSubmitError(d.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setStep("success");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
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

  const availableSlots = selectedDate
    ? generateAvailableSlots(avail, selectedDate, dateBookings)
    : [];

  const stepLabels = ["Your Details", "Treatment", "Choose Date", "Choose Time"];
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
            <h2 className="font-serif leading-snug mb-1" style={{ fontSize: "24px" }}>Book Your Free Consultation</h2>
            <span className="font-serif" style={{ fontSize: "18px", color: "#2D6A4F", fontWeight: 600 }}>Completely Free</span>

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

            <button
              onClick={handleDetailsNext}
              className="w-full mt-2"
              style={{
                background: "#C9A96E", color: "#fff", border: "none",
                borderRadius: "8px", padding: "16px", fontSize: "13px",
                fontFamily: "Inter, sans-serif", fontWeight: 700,
                letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* ── Step 2 — Treatment Interest ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setStep(1)} className="text-sm hover:opacity-70" style={{ color: "#C9A96E" }}>← Back</button>
              <h3 className="font-serif" style={{ fontSize: "20px" }}>Your Treatment Interest</h3>
            </div>

            <Field label="What are you interested in?" required error={treatmentError}>
              <select
                value={treatmentInterest}
                onChange={(e) => { setTreatmentInterest(e.target.value); if (treatmentError) setTreatmentError(""); }}
                style={{ ...inputStyle(!!treatmentError), background: "#fff", cursor: "pointer" }}
              >
                <option value="">Select a treatment…</option>
                {TREATMENT_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="Skin concerns or goals (optional)">
              <textarea
                value={skinConcerns}
                onChange={(e) => setSkinConcerns(e.target.value)}
                rows={4}
                placeholder="e.g. fine lines around the eyes, acne scarring, want a more defined jawline…"
                style={{ ...inputStyle(false), resize: "vertical", minHeight: "100px" }}
              />
            </Field>

            <button
              onClick={handleTreatmentNext}
              className="w-full mt-2"
              style={{
                background: "#C9A96E", color: "#fff", border: "none",
                borderRadius: "8px", padding: "16px", fontSize: "13px",
                fontFamily: "Inter, sans-serif", fontWeight: 700,
                letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* ── Step 3 — Calendar ── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setStep(2)} className="text-sm hover:opacity-70" style={{ color: "#C9A96E" }}>← Back</button>
              <h3 className="font-serif" style={{ fontSize: "20px" }}>Select a Date</h3>
            </div>
            <Calendar onSelect={handleDateSelect} selected={selectedDate} avail={avail} />
          </motion.div>
        )}

        {/* ── Step 4 — Time Slots ── */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(3)} className="text-sm hover:opacity-70" style={{ color: "#C9A96E" }}>← Back</button>
              <h3 className="font-serif" style={{ fontSize: "20px" }}>Select a Time</h3>
            </div>
            {selectedDate && <p className="text-sm mb-5" style={{ color: "#999" }}>{formatDate(selectedDate)}</p>}

            {submitError && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#FFF3F3", color: "#C62828", border: "1px solid #FFCDD2" }}>
                {submitError}
              </div>
            )}

            {submitting ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div style={{ width: "28px", height: "28px", border: "3px solid #E8E8E8", borderTopColor: "#C9A96E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <p className="text-sm" style={{ color: "#aaa", fontFamily: "Inter, sans-serif" }}>Confirming your booking…</p>
              </div>
            ) : loadingSlots ? (
              <p className="text-sm text-center py-8" style={{ color: "#aaa" }}>Loading availability…</p>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm mb-4" style={{ color: "#aaa" }}>No available slots for this date. Please select another day.</p>
                <button onClick={() => setStep(3)} style={{ color: "#C9A96E", fontSize: "14px", background: "none", border: "none", cursor: "pointer" }}>← Choose a different date</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleTimeSelect(slot)}
                      style={{
                        padding: "10px 6px", borderRadius: "8px",
                        fontSize: "13px", fontFamily: "Inter, sans-serif",
                        border: "1px solid #E0E0E0",
                        background: "transparent",
                        color: "#111",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#C9A96E"; (e.currentTarget as HTMLButtonElement).style.color = "#C9A96E"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E0E0E0"; (e.currentTarget as HTMLButtonElement).style.color = "#111"; }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-4 text-center" style={{ color: "#bbb", fontFamily: "Inter, sans-serif" }}>
                  Tap a time to confirm your free consultation instantly
                </p>
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
                <div><span style={{ color: "#888" }}>Treatment interest: </span>{treatmentInterest}</div>
                <div className="pt-2 mt-2" style={{ borderTop: "1px solid #E8E8E8" }}>
                  <span style={{ color: "#2D6A4F", fontWeight: 600 }}>✓ Free consultation, no charge</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl mb-4 text-sm" style={{ background: "#FAFAF8", border: "1px solid #E8E8E8", fontFamily: "Inter, sans-serif" }}>
              <p style={{ color: "#C9A96E", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>Find Us</p>
              <p style={{ color: "#111", fontWeight: 600, marginBottom: "2px" }}>StarrBeauty</p>
              <p style={{ color: "#666" }}>Hornchurch, Essex (RM11)</p>
              <p style={{ color: "#666" }}>Marylebone, London (W1G)</p>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 mt-3"
                  style={{ color: "#2D6A4F", fontWeight: 600, textDecoration: "none" }}
                >
                  <span style={{ fontSize: "16px" }}>📱</span>
                  <span>WhatsApp us: {whatsapp.replace("44", "0").replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3")}</span>
                </a>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-2"
              style={{
                background: "#F5F0EB", color: "#fff", border: "none",
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
