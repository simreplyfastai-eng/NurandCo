import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #E8E5DD",
  borderRadius: 2,
  background: "#E5E4E2",
  fontFamily: "'Inter', sans-serif",
  fontWeight: 300,
  fontSize: "0.9375rem",
  color: "#0E0D0B",
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
    <section id="contact" className="has-texture" style={{ background: "#F8F8F6", padding: "6rem 2.5rem" }}>
      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: start;
          max-width: 1140px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr; gap: 3rem; }
          section#contact { padding: 3rem 1.25rem; }
        }
      `}</style>

      <div className="contact-grid">
        {/* Left — info */}
        <div>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>GET IN TOUCH</p>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#0E0D0B",
              margin: "0 0 1.5rem",
              lineHeight: 1.1,
            }}
          >
            Let's talk.
          </h2>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: "0.9375rem",
              color: "#5A5248",
              lineHeight: 1.8,
              margin: "0 0 2rem",
            }}
          >
            Based in Nottingham. DM on Instagram or use the form and we'll be in touch promptly.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <a
              href="https://instagram.com/nurandcoaesthetics"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: "0.875rem",
                color: "#0E0D0B",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E8E5DD")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#0E0D0B")}
            >
              @nurandcoaesthetics
            </a>

            <a
              href="mailto:nurandcoaesthetics@gmail.com"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: "0.875rem",
                color: "#0E0D0B",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E8E5DD")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#0E0D0B")}
            >
              nurandcoaesthetics@gmail.com
            </a>

            <a
              href="https://wa.me/[PLACEHOLDER]"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: "0.875rem",
                color: "#0E0D0B",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E8E5DD")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#0E0D0B")}
            >
              WhatsApp — [PLACEHOLDER — NUR TO SUPPLY number]
            </a>
          </div>
        </div>

        {/* Right — form */}
        <div>
          {sent ? (
            <div
              style={{
                padding: "3rem 2rem",
                background: "#E5E4E2",
                border: "1px solid #E8E5DD",
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  fontSize: "1.75rem",
                  color: "#0E0D0B",
                  margin: "0 0 0.75rem",
                }}
              >
                Message received
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.875rem",
                  color: "#5A5248",
                  margin: 0,
                }}
              >
                We'll be in touch within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: "0.6875rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#5A5248",
                    marginBottom: "0.5rem",
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0E0D0B")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E8E5DD")}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: "0.6875rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#5A5248",
                    marginBottom: "0.5rem",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0E0D0B")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E8E5DD")}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: "0.6875rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#5A5248",
                    marginBottom: "0.5rem",
                  }}
                >
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0E0D0B")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E8E5DD")}
                  placeholder="How can we help you?"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="btn-primary"
                style={{
                  opacity: sending ? 0.6 : 1,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
