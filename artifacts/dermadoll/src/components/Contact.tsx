import { motion } from "framer-motion";
import { useState } from "react";

function Eyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.5 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>{label}</span>
      <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.5 }} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #E2DDD5",
  borderRadius: 0,
  background: "#FAF7F2",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: "#1C1C1E",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setSent(true);
  };

  return (
    <section id="contact" style={{ background: "#FAF7F2", padding: "100px 0", position: "relative", overflow: "hidden" }}>

      {/* Decorative background layer */}
      {/* Large faint "@" watermark — right side */}
      <div aria-hidden="true" style={{
        position: "absolute", top: "50%", right: "-40px", transform: "translateY(-50%)",
        fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 700,
        fontSize: "clamp(180px, 26vw, 300px)", color: "rgba(201,169,110,0.05)",
        lineHeight: 1, pointerEvents: "none", userSelect: "none", letterSpacing: "-0.04em",
      }}>@</div>

      {/* Radial amber glow — top left */}
      <div aria-hidden="true" style={{
        position: "absolute", top: -60, left: -60,
        width: 380, height: 380,
        background: "radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Radial amber glow — bottom right */}
      <div aria-hidden="true" style={{
        position: "absolute", bottom: -60, right: 80,
        width: 300, height: 300,
        background: "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Scattered ✦ ornaments */}
      {[
        { top: "8%",  left: "3%",   size: "1rem",   opacity: 0.13 },
        { top: "40%", left: "1%",   size: "0.7rem",  opacity: 0.09 },
        { top: "78%", left: "5%",   size: "0.85rem", opacity: 0.10 },
        { top: "12%", right: "6%",  size: "0.75rem", opacity: 0.09 },
        { top: "65%", right: "4%",  size: "1.1rem",  opacity: 0.08 },
      ].map((pos, i) => (
        <div key={i} aria-hidden="true" style={{
          position: "absolute", ...(pos as any),
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: pos.size, color: "#C9A96E", opacity: pos.opacity,
          pointerEvents: "none", userSelect: "none",
        }}>✦</div>
      ))}

      {/* Thin horizontal rule lines */}
      <div aria-hidden="true" style={{
        position: "absolute", top: 48, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: 1,
        background: "linear-gradient(to right, transparent, rgba(201,169,110,0.16), transparent)",
        pointerEvents: "none",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: 1,
        background: "linear-gradient(to right, transparent, rgba(201,169,110,0.16), transparent)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }} className="contact-grid">
          <style>{`
            @media (max-width: 768px) {
              .contact-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
            }
          `}</style>

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Eyebrow label="CONTACT" />
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 600, color: "#1C1C1E", margin: "0 0 20px" }}>
              Get In Touch
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#6B6260", lineHeight: 1.8, margin: "0 0 40px" }}>
              Based in Leeds and Wakefield. DM on Instagram or send an email — Niamh will get back to you promptly.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { icon: "📍", text: "Leeds / Wakefield" },
                { icon: "📸", text: "@facebyniamh", href: "https://instagram.com/facebyniamh" },
                { icon: "✉", text: "hello@facebyniamh.co.uk", href: "mailto:hello@facebyniamh.co.uk" },
              ].map((item) => (
                <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#C9A96E", textDecoration: "none" }}
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B6260" }}>{item.text}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {sent ? (
              <div style={{
                padding: "48px 32px",
                background: "#F0EBE1",
                border: "1px solid #E2DDD5",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "#1C1C1E", margin: "0 0 10px" }}>
                  Message Received
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B6260", margin: 0 }}>
                  Niamh will be in touch within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#6B6260", marginBottom: 8 }}>
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#C9A96E"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E2DDD5"}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#6B6260", marginBottom: 8 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#C9A96E"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E2DDD5"}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#6B6260", marginBottom: 8 }}>
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    style={{ ...inputStyle, resize: "none" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#C9A96E"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E2DDD5"}
                    placeholder="How can Niamh help you?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    background: "#1C1C1E",
                    border: "1px solid #1C1C1E",
                    color: "#FAF7F2",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    padding: "15px 24px",
                    borderRadius: 0,
                    cursor: sending ? "not-allowed" : "pointer",
                    opacity: sending ? 0.7 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
