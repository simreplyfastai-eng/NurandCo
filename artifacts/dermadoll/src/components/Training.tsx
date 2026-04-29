import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";

const courses = [
  {
    name: "Lash Extensions",
    course: "Lash Mission Course",
  },
  {
    name: "Acrylic Nails",
    course: "Nail Mission Course",
  },
  {
    name: "LVL & Brow Lamination",
    course: "Ultimate LVL & Brow Lami Course",
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
          stroke="var(--brand-accent)" strokeWidth="2.5" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.path
          d="M18 33 L28 43 L46 23"
          stroke="var(--brand-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
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
  background: "var(--brand-bg)",
  border: "1px solid #E2DDD5",
  padding: "11px 14px",
  outline: "none",
  boxSizing: "border-box",
  borderRadius: 0,
};

export default function Training() {
  const [enquireOpen, setEnquireOpen] = useState(false);
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedName, setSubmittedName] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const expRef = useRef<HTMLSelectElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);

  const handleEnquire = () => {
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
          course_name: "Training Enquiry",
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

          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ height: 1, width: 24, background: "var(--brand-accent)" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-accent)" }}>
                Nur &amp; Co Academy
              </span>
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 400, color: "var(--brand-primary)", margin: "0 0 8px" }}>
              Train With Eva
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "var(--brand-accent)", margin: "0 0 28px" }}>
              Training based in Nottingham
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#5A5248", lineHeight: 1.8, margin: "0 0 18px" }}>
              Eva's background in education meets her clinical expertise, delivering world-class training through Nur &amp; Co Academy.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#5A5248", lineHeight: 1.8, margin: "0 0 18px" }}>
              All courses are open to candidates with no prior background required.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "var(--brand-primary)", lineHeight: 1.8, margin: 0 }}>
              Small groups. Real models. Real confidence.
            </p>
          </motion.div>

          {/* Right: course list + enquiry */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {/* Individual course rows */}
            {courses.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                style={{
                  background: "var(--brand-bg-alt)",
                  border: "1px solid #E2DDD5",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.15rem", fontWeight: 400, color: "var(--brand-primary)", margin: "0 0 4px" }}>
                    {c.name}
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#5A5248", margin: 0 }}>
                    {c.course}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* CPD coming soon */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 + courses.length * 0.08 }}
              style={{
                background: "var(--brand-bg)",
                border: "1px dashed var(--brand-accent)",
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase",
                border: "1px solid var(--brand-accent)", color: "var(--brand-accent)", padding: "4px 8px", flexShrink: 0,
              }}>
                COMING SOON
              </span>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#5A5248", margin: 0, lineHeight: 1.5 }}>
                CPD Accredited Aesthetic Courses
              </p>
            </motion.div>

            {/* Single enquiry box */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 + (courses.length + 1) * 0.08 }}
              style={{
                background: "var(--brand-bg-alt)",
                border: "1px solid #E2DDD5",
                padding: "28px 28px 24px",
                marginTop: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.3rem", fontWeight: 400, color: "var(--brand-primary)", margin: 0 }}>
                  Training Enquiries
                </h3>
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase",
                  border: "1px solid var(--brand-accent)", color: "var(--brand-accent)", padding: "4px 8px", flexShrink: 0, marginLeft: 12,
                }}>
                  Nottingham
                </span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--brand-accent)", margin: "0 0 20px" }}>
                Nur & Co Clinic, Nottingham
              </p>
              <button
                onClick={handleEnquire}
                style={{
                  width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
                  border: "1px solid var(--brand-primary)", background: "transparent", color: "var(--brand-primary)",
                  padding: "12px 0", cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-primary)"; e.currentTarget.style.color = "var(--brand-bg-alt)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--brand-primary)"; }}
              >
                ENQUIRE NOW
              </button>
            </motion.div>
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
              <button
                onClick={closeModal}
                style={{
                  position: "absolute", top: 16, right: 20, background: "none", border: "none",
                  cursor: "pointer", fontSize: 22, color: "#5A5248", lineHeight: 1,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--brand-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#5A5248"; }}
              >×</button>

              {formState === "success" ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <SuccessTick />
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.8rem", color: "var(--brand-primary)", margin: "0 0 10px" }}>
                    Enquiry received!
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#5A5248", lineHeight: 1.7, margin: "0 0 24px" }}>
                    Thanks {submittedName.split(" ")[0]}, Eva will be in touch within 24 hours.
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#5A5248", margin: "0 0 12px" }}>
                    WhatsApp us in the meantime:
                  </p>
                  <a
                    href="https://wa.me/447701298985"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block", background: "var(--brand-accent)", color: "#FFFFFF",
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
                      fontSize: 12, color: "#5A5248", padding: "10px 24px", cursor: "pointer", borderRadius: 4,
                    }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ height: 1, width: 20, background: "var(--brand-accent)" }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-accent)" }}>
                      Nur &amp; Co Academy
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.8rem", color: "var(--brand-primary)", margin: "0 0 6px" }}>
                    Training Enquiry
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#5A5248", margin: "0 0 28px" }}>
                    Nur & Co Clinic, Nottingham
                  </p>

                  <form onSubmit={handleSubmit} noValidate>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--brand-primary)", marginBottom: 6 }}>
                        Full Name <span style={{ color: "var(--brand-accent)" }}>*</span>
                      </label>
                      <input ref={nameRef} type="text" placeholder="Your full name" required style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--brand-primary)", marginBottom: 6 }}>
                        Email Address <span style={{ color: "var(--brand-accent)" }}>*</span>
                      </label>
                      <input ref={emailRef} type="email" placeholder="your@email.com" required style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--brand-primary)", marginBottom: 6 }}>
                        Phone Number <span style={{ color: "var(--brand-accent)" }}>*</span>
                      </label>
                      <input ref={phoneRef} type="tel" placeholder="+44 7700 000000" required style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--brand-primary)", marginBottom: 6 }}>
                        Course of Interest
                      </label>
                      <select ref={expRef} style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none" }}>
                        <option value="">Select a course...</option>
                        <option value="Lash Extensions — Lash Mission Course">Lash Extensions — Lash Mission Course</option>
                        <option value="Acrylic Nails — Nail Mission Course">Acrylic Nails — Nail Mission Course</option>
                        <option value="LVL & Brow Lamination — Ultimate LVL & Brow Lami Course">LVL & Brow Lamination — Ultimate LVL & Brow Lami Course</option>
                        <option value="CPD Aesthetic Courses (coming soon)">CPD Aesthetic Courses (coming soon)</option>
                        <option value="General enquiry">General enquiry</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--brand-primary)", marginBottom: 6 }}>
                        Message <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                      </label>
                      <textarea
                        ref={msgRef}
                        rows={3}
                        placeholder="Any questions or anything you'd like us to know..."
                        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                      />
                    </div>

                    {formState === "error" && errorMsg && (
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#C62828", margin: "0 0 16px" }}>
                        {errorMsg}
                      </p>
                    )}

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
                        if (formState !== "loading") e.currentTarget.style.background = "var(--brand-accent)";
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
