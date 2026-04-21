import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";

const masterclasses = [
  {
    title: "Essex Masterclass",
    location: "Hornchurch Clinic",
    locationShort: "Hornchurch",
    badge: "CPD ACCREDITED",
  },
  {
    title: "London Masterclass",
    location: "Marylebone Clinic",
    locationShort: "Marylebone",
    badge: "CPD ACCREDITED",
  },
];

const EXPERIENCE_OPTIONS = [
  "No prior experience",
  "Beauty therapist",
  "Nurse / Medical professional",
  "Already practising aesthetics",
  "Other",
];

function SuccessTick() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
      style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
    >
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <motion.circle
          cx="32" cy="32" r="30"
          stroke="#C9A96E" strokeWidth="2.5" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.path
          d="M18 33 L28 43 L46 23"
          stroke="#C9A96E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
        />
      </svg>
    </motion.div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "'Inter', sans-serif",
  fontSize: 13,
  fontWeight: 300,
  color: "#2C2420",
  background: "#FAF7F4",
  border: "1px solid #E2DDD5",
  padding: "11px 14px",
  outline: "none",
  boxSizing: "border-box",
  borderRadius: 0,
};

export default function Training() {
  const [enquireOpen, setEnquireOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState({ title: "", location: "", locationShort: "" });
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedName, setSubmittedName] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const expRef = useRef<HTMLSelectElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);

  const handleEnquire = (mc: typeof masterclasses[number]) => {
    setSelectedClass({ title: mc.title, location: mc.location, locationShort: mc.locationShort });
    setFormState("idle");
    setErrorMsg("");
    setEnquireOpen(true);
    setTimeout(() => nameRef.current?.focus(), 80);
  };

  const closeModal = () => {
    setEnquireOpen(false);
    setFormState("idle");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameRef.current?.value.trim() ?? "";
    const email = emailRef.current?.value.trim() ?? "";
    const phone = phoneRef.current?.value.trim() ?? "";
    const experience_level = expRef.current?.value ?? "";
    const message = msgRef.current?.value.trim() ?? "";

    if (!name || !email || !phone) return;

    setFormState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          course_name: selectedClass.title,
          experience_level: experience_level || undefined,
          message: message || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to submit enquiry");
      }

      setSubmittedName(name);
      setFormState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setFormState("error");
    }
  };

  return (
    <section id="training" style={{ background: "#FFFFFF", padding: "100px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        <div className="training-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <style>{`@media (max-width: 768px) { .training-grid { grid-template-columns: 1fr !important; gap: 40px !important; } }`}</style>

          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ height: 1, width: 24, background: "#C9A96E" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>
                Starr Academy
              </span>
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 400, color: "#5C1A1A", margin: "0 0 8px" }}>
              Train With Eva
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#C9A96E", margin: "0 0 28px" }}>
              CPD accredited aesthetics training
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#737373", lineHeight: 1.8, margin: "0 0 18px" }}>
              Eva's background in education meets her clinical expertise, delivering world-class aesthetics training through Starr Academy.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#737373", lineHeight: 1.8, margin: "0 0 18px" }}>
              All courses are CPD accredited and open to candidates with no prior background required.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#5C1A1A", lineHeight: 1.8, margin: 0 }}>
              Small groups. Real models. Real confidence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {masterclasses.map((mc) => (
              <div
                key={mc.title}
                style={{ background: "#F5F0EB", border: "1px solid #E2DDD5", padding: "28px 28px 24px" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.3rem", fontWeight: 400, color: "#5C1A1A", margin: 0 }}>
                    {mc.title}
                  </h3>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase",
                    border: "1px solid #C9A96E", color: "#C9A96E", padding: "4px 8px", flexShrink: 0, marginLeft: 12,
                  }}>
                    {mc.badge}
                  </span>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#C9A96E", margin: "0 0 20px" }}>
                  {mc.location}
                </p>
                <button
                  onClick={() => handleEnquire(mc)}
                  style={{
                    width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
                    border: "1px solid #5C1A1A", background: "transparent", color: "#5C1A1A",
                    padding: "12px 0", cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#5C1A1A"; e.currentTarget.style.color = "#F5F0EB"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5C1A1A"; }}
                >
                  ENQUIRE NOW
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {enquireOpen && (
          <motion.div
            key="enquiry-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
            onClick={closeModal}
          >
            <motion.div
              key="enquiry-card"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                background: "#FFFFFF", borderRadius: 16,
                padding: "40px 40px 36px", maxWidth: 480, width: "100%",
                position: "relative", maxHeight: "92vh", overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                style={{
                  position: "absolute", top: 16, right: 20, background: "none", border: "none",
                  cursor: "pointer", fontSize: 22, color: "#737373", lineHeight: 1,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#C9A96E"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#737373"; }}
              >×</button>

              {formState === "success" ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <SuccessTick />
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.8rem", color: "#5C1A1A", margin: "0 0 10px" }}>
                    Enquiry received!
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#737373", lineHeight: 1.7, margin: "0 0 24px" }}>
                    Thanks {submittedName.split(" ")[0]}, Eva will be in touch within 24 hours.
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#737373", margin: "0 0 12px" }}>
                    WhatsApp us in the meantime:
                  </p>
                  <a
                    href="https://wa.me/447701298985"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block", background: "#C9A96E", color: "#FFFFFF",
                      fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.12em",
                      textTransform: "uppercase", padding: "13px 28px", textDecoration: "none",
                      borderRadius: 4, marginBottom: 20,
                    }}
                  >
                    WhatsApp Eva
                  </a>
                  <br />
                  <button
                    onClick={closeModal}
                    style={{
                      background: "none", border: "1px solid #E2DDD5", fontFamily: "'Inter', sans-serif",
                      fontSize: 12, color: "#737373", padding: "10px 24px", cursor: "pointer", borderRadius: 4,
                    }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ height: 1, width: 20, background: "#C9A96E" }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>
                      Starr Academy
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.8rem", color: "#5C1A1A", margin: "0 0 10px" }}>
                    Course Enquiry
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#737373" }}>
                      {selectedClass.title} — {selectedClass.locationShort}
                    </span>
                    <span style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "1.5px",
                      textTransform: "uppercase", background: "#C9A96E", color: "#FFFFFF",
                      padding: "4px 9px", borderRadius: 99, flexShrink: 0,
                    }}>
                      {selectedClass.title}
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} noValidate>
                    {/* Full Name */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "#5C1A1A", marginBottom: 6 }}>
                        Full Name <span style={{ color: "#C9A96E" }}>*</span>
                      </label>
                      <input ref={nameRef} type="text" placeholder="Your full name" required style={inputStyle} />
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "#5C1A1A", marginBottom: 6 }}>
                        Email Address <span style={{ color: "#C9A96E" }}>*</span>
                      </label>
                      <input ref={emailRef} type="email" placeholder="your@email.com" required style={inputStyle} />
                    </div>

                    {/* Phone */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "#5C1A1A", marginBottom: 6 }}>
                        Phone Number <span style={{ color: "#C9A96E" }}>*</span>
                      </label>
                      <input ref={phoneRef} type="tel" placeholder="+44 7700 000000" required style={inputStyle} />
                    </div>

                    {/* Experience Level */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "#5C1A1A", marginBottom: 6 }}>
                        Experience Level
                      </label>
                      <select ref={expRef} style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none" }}>
                        <option value="">Select your background...</option>
                        {EXPERIENCE_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "#5C1A1A", marginBottom: 6 }}>
                        Message <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                      </label>
                      <textarea
                        ref={msgRef}
                        rows={3}
                        placeholder="Any questions or anything you'd like us to know..."
                        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                      />
                    </div>

                    {/* Error */}
                    {formState === "error" && errorMsg && (
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#C62828", margin: "0 0 16px" }}>
                        {errorMsg}
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={formState === "loading"}
                      style={{
                        width: "100%",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 11,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        background: formState === "loading" ? "#888" : "#5C1E1E",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "14px 0",
                        cursor: formState === "loading" ? "not-allowed" : "pointer",
                        transition: "background 0.2s",
                        marginBottom: 14,
                      }}
                      onMouseEnter={(e) => {
                        if (formState !== "loading") e.currentTarget.style.background = "#C9A96E";
                      }}
                      onMouseLeave={(e) => {
                        if (formState !== "loading") e.currentTarget.style.background = "#5C1E1E";
                      }}
                    >
                      {formState === "loading" ? "Sending…" : "SEND ENQUIRY"}
                    </button>

                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#9E9E9E", textAlign: "center", margin: 0 }}>
                      We'll be in touch within 24 hours 🤍
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
