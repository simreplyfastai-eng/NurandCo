import { motion } from "framer-motion";

export default function CTABanner() {
  return (
    <section id="book" style={{ background: "var(--brand-primary)", padding: "56px 32px" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{
          maxWidth: 860,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        {/* Left: label + heading + subtext */}
        <div style={{ flex: "1 1 280px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ height: 1, width: 22, background: "var(--brand-accent)", opacity: 0.6 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-accent)" }}>Book Now</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 400, color: "var(--brand-bg-alt)", margin: "0 0 8px", lineHeight: 1.15 }}>
            Ready to Book?
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--brand-accent)", margin: 0, lineHeight: 1.6 }}>
            Choose your preferred location and book your appointment
          </p>
        </div>

        {/* Right: buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end", flex: "0 0 auto" }}>
          <a
            href={`${import.meta.env.BASE_URL}book?location=[location-1-slug]`}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
              border: "1px solid var(--brand-bg-alt)", background: "transparent", color: "var(--brand-bg-alt)",
              padding: "12px 22px", cursor: "pointer", transition: "all 0.2s", textDecoration: "none", display: "inline-block", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-bg-alt)"; e.currentTarget.style.color = "var(--brand-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--brand-bg-alt)"; }}
          >
            Book [LOCATION_1]
          </a>
          <a
            href={`${import.meta.env.BASE_URL}book?location=[location-2-slug]`}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
              border: "1px solid var(--brand-accent)", background: "transparent", color: "var(--brand-accent)",
              padding: "12px 22px", cursor: "pointer", transition: "all 0.2s", textDecoration: "none", display: "inline-block", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-accent)"; e.currentTarget.style.color = "var(--brand-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--brand-accent)"; }}
          >
            Book [LOCATION_2]
          </a>
        </div>
      </motion.div>
    </section>
  );
}
