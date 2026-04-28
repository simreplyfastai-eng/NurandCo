import { motion } from "framer-motion";

const clinics = [
  {
    region: "NOTTINGHAM",
    name: "Nur & Co Aesthetics",
    line1: "Private clinic on Bedale Road, Sherwood.",
    line2: "Bookings receive full address by email.",
    highlight: true,
  },
];

export default function Locations() {

  return (
    <section id="locations" style={{ background: "var(--brand-bg-alt)", padding: "100px 0" }}>
      <style>{`
        .clinics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: stretch;
        }
        .clinic-card {
          background: #FFFFFF;
          padding: 40px 36px;
          display: flex;
          flex-direction: column;
        }
        .clinic-card h3 {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 2rem;
          font-weight: 400;
          color: var(--brand-primary);
          margin: 0 0 20px;
          line-height: 1;
        }
        .clinic-card .desc-line1 {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: var(--brand-accent);
          line-height: 1.6;
          margin: 0 0 8px;
          font-weight: 500;
        }
        .clinic-card .desc-line2 {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #737373;
          line-height: 1.7;
          margin: 0 0 32px;
        }
        .clinic-card .cta-spacer {
          margin-top: auto;
        }
        @media (max-width: 768px) {
          .clinics-grid { gap: 12px !important; }
          .clinic-card {
            padding: 24px 18px !important;
          }
          .clinic-card h3 {
            font-size: 1.4rem !important;
            margin-bottom: 14px !important;
          }
          .clinic-card .desc-line1 {
            font-size: 13px !important;
            margin-bottom: 6px !important;
          }
          .clinic-card .desc-line2 {
            font-size: 12px !important;
            margin-bottom: 24px !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ height: 1, width: 28, background: "var(--brand-accent)" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-accent)" }}>Our Clinics</span>
            <div style={{ height: 1, width: 28, background: "var(--brand-accent)" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 400, color: "var(--brand-primary)", margin: "0 0 12px" }}>
            Two Locations
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "var(--brand-accent)", margin: 0 }}>
            One standard of excellence
          </p>
        </motion.div>

        <div className="clinics-grid">
          {clinics.map((clinic, i) => (
            <motion.div
              key={clinic.name}
              className="clinic-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{ border: clinic.highlight ? "1px solid var(--brand-primary)" : "1px solid #E2DDD5" }}
            >
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-accent)", marginBottom: 10 }}>
                {clinic.region}
              </div>
              <h3>{clinic.name}</h3>
              <p className="desc-line1">{clinic.line1}</p>
              <p className="desc-line2">{clinic.line2}</p>
              <div className="cta-spacer">
                <a
                  href={`${import.meta.env.BASE_URL}book?location=${clinic.name.toLowerCase()}`}
                  style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
                    border: "1px solid var(--brand-primary)", background: "transparent", color: "var(--brand-primary)",
                    padding: "11px 0", cursor: "pointer", transition: "all 0.2s", width: "100%",
                    textDecoration: "none", display: "block", textAlign: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-primary)"; e.currentTarget.style.color = "var(--brand-bg-alt)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--brand-primary)"; }}
                >
                  BOOK HERE
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
