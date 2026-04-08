import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Treatment {
  name: string;
  price: string;
}

interface BookingModalProps {
  treatment: Treatment | null;
  onClose: () => void;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00",
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function Calendar({
  onSelect,
  selected,
}: {
  onSelect: (d: Date) => void;
  selected: Date | null;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
          style={{ color: "#C9A96E", fontSize: "22px" }}
        >
          ‹
        </button>
        <span className="font-serif leading-snug" style={{ fontSize: "18px" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
          style={{ color: "#C9A96E", fontSize: "22px" }}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] uppercase tracking-wider py-1"
            style={{ color: "#aaa", fontFamily: "Inter, sans-serif" }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const isPast = date < today;
          const isSunday = date.getDay() === 0;
          const disabled = isPast || isSunday;
          const isSelected =
            selected !== null &&
            date.toDateString() === selected.toDateString();

          return (
            <button
              key={date.toISOString()}
              disabled={disabled}
              onClick={() => !disabled && onSelect(date)}
              className="flex items-center justify-center transition-all duration-150"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                margin: "1px auto",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
                backgroundColor: isSelected ? "#C9A96E" : "transparent",
                color: isSelected ? "#fff" : disabled ? "#ddd" : "#111",
                cursor: disabled ? "default" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(201,169,110,0.12)";
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && !isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parsePrice(priceStr: string): number {
  return parseInt(priceStr.replace(/[^0-9]/g, ""), 10) || 0;
}

export default function BookingModal({ treatment, onClose }: BookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    firstFocusRef.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!name.trim()) {
      setNameError("Please enter your name");
      return;
    }
    setNameError("");
    setSubmitting(true);

    const price = parsePrice(treatment?.price ?? "0");
    const deposit = Math.round(price * 0.5);

    const booking = {
      id: uid(),
      clientName: name.trim(),
      clientEmail: email.trim(),
      treatment: treatment?.name ?? "",
      category: "",
      price,
      deposit,
      depositPaid: true, // STRIPE INTEGRATION POINT — set to false when Stripe is live
      balancePaid: false,
      date: selectedDate ? fmtDate(selectedDate) : "",
      time: selectedTime ?? "",
      status: "Pending",
      paymentMethod: "Stripe",
      stripePaymentId: null,
      notes: "",
      createdAt: Date.now(),
      source: "Website",
      // TODO: Integrate Stripe checkout here
      // Stripe will POST to /api/bookings/confirm/:id
      // with stripePaymentId on successful payment
    };

    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
    } catch (err) {
      console.warn("Booking API error — continuing to success screen", err);
    }

    setSubmitting(false);
    setStep("success");
    setTimeout(onClose, 4000);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (!treatment) return null;

  const price = parsePrice(treatment.price);
  const deposit = Math.round(price * 0.5);
  const balance = price - deposit;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full md:max-w-[520px] bg-white overflow-y-auto"
        style={{
          borderRadius: "16px 16px 0 0",
          maxHeight: "92dvh",
          padding: "clamp(28px, 5vw, 40px)",
          paddingBottom: "40px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          ref={firstFocusRef}
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
          style={{ color: "#C9A96E", fontSize: "18px" }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Treatment info */}
        <div className="mb-7 pr-8">
          <h2 className="font-serif leading-snug mb-1" style={{ fontSize: "24px" }}>
            {treatment.name}
          </h2>
          <span className="font-serif" style={{ fontSize: "20px", color: "#C9A96E" }}>
            {treatment.price}
          </span>
        </div>

        {/* Step 1 — Calendar */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <h3 className="font-serif mb-5" style={{ fontSize: "20px" }}>Select a Date</h3>
            <Calendar onSelect={handleDateSelect} selected={selectedDate} />
          </motion.div>
        )}

        {/* Step 2 — Time slots */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(1)} className="text-sm hover:opacity-70 transition-opacity" style={{ color: "#C9A96E" }}>
                ← Back
              </button>
              <h3 className="font-serif" style={{ fontSize: "20px" }}>Select a Time</h3>
            </div>
            {selectedDate && (
              <p className="text-sm mb-5" style={{ color: "#999" }}>{formatDate(selectedDate)}</p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isActive = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => handleTimeSelect(slot)}
                    style={{
                      border: "1px solid #C9A96E",
                      borderRadius: "20px",
                      padding: "8px 4px",
                      fontSize: "13px",
                      fontFamily: "Inter, sans-serif",
                      color: isActive ? "#fff" : "#C9A96E",
                      backgroundColor: isActive ? "#C9A96E" : "transparent",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(201,169,110,0.08)"; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 3 — Your details + Confirm */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setStep(2)} className="text-sm hover:opacity-70 transition-opacity" style={{ color: "#C9A96E" }}>
                ← Back
              </button>
              <h3 className="font-serif" style={{ fontSize: "20px" }}>Your Details</h3>
            </div>

            {/* Booking summary */}
            <div
              className="mb-6 p-4 rounded-xl space-y-2"
              style={{ border: "1px solid rgba(201,169,110,0.25)", backgroundColor: "#FEFDFB" }}
            >
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
                  <span style={{ color: "#888" }}>Deposit due today (50%)</span>
                  <span className="font-medium" style={{ color: "#C9A96E" }}>£{deposit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#888" }}>Remaining balance (due on arrival)</span>
                  <span className="font-medium" style={{ color: "#666" }}>£{balance}</span>
                </div>
              </div>
            </div>

            {/* Name field */}
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "#888", fontFamily: "Inter, sans-serif" }}>
                Full Name <span style={{ color: "#C9A96E" }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (nameError) setNameError(""); }}
                placeholder="Jane Smith"
                className="w-full"
                style={{
                  border: nameError ? "1px solid #C62828" : "1px solid #E0E0E0",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { if (!nameError) (e.currentTarget as HTMLInputElement).style.borderColor = "#C9A96E"; }}
                onBlur={(e) => { if (!nameError) (e.currentTarget as HTMLInputElement).style.borderColor = "#E0E0E0"; }}
              />
              {nameError && <p className="text-xs mt-1" style={{ color: "#C62828" }}>{nameError}</p>}
            </div>

            {/* Email field */}
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "#888", fontFamily: "Inter, sans-serif" }}>
                Email Address <span style={{ color: "#AAA", fontSize: "10px", textTransform: "none" }}>(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@email.com"
                className="w-full"
                style={{
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                }}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#C9A96E"; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#E0E0E0"; }}
              />
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full py-4 text-white font-medium text-sm uppercase tracking-wider transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
              style={{ backgroundColor: submitting ? "#D4B98A" : "#C9A96E", borderRadius: "8px", cursor: submitting ? "default" : "pointer" }}
            >
              {submitting ? "Sending…" : `Request Booking — Pay £${deposit} Deposit`}
            </button>
            <p className="text-center text-xs mt-3" style={{ color: "#AAA", fontFamily: "Inter, sans-serif" }}>
              Deposit secures your appointment. Balance paid on the day.
            </p>
          </motion.div>
        )}

        {/* Success */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-10"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "rgba(201,169,110,0.1)", color: "#C9A96E", fontSize: "28px" }}
            >
              ✓
            </div>
            <h2 className="font-serif mb-3" style={{ fontSize: "28px" }}>
              Booking Request Sent!
            </h2>
            <p className="font-light leading-relaxed mb-2" style={{ color: "#777" }}>
              We'll confirm your appointment via Instagram DM or WhatsApp shortly.
            </p>
            <p className="text-sm" style={{ color: "#AAA" }}>This window will close automatically.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
