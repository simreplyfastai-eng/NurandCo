import { motion } from "framer-motion";

export default function CTABanner() {
  return (
    <section id="book" style={{ background: "#5C1A1A", padding: "56px 32px" }}>
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
            <div style={{ height: 1, width: 22, background: "#C9A96E", opacity: 0.6 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>Book Now</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 400, color: "#F5F0EB", margin: "0 0 8px", lineHeight: 1.15 }}>
            Ready to Book?
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#C9A96E", margin: 0, lineHeight: 1.6 }}>
            Choose your preferred location and book your appointment
          </p>
        </div>

        {/* Right: buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end", flex: "0 0 auto" }}>
          <a
            href={`${import.meta.env.BASE_URL}book?location=[location-1-slug]`}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
              border: "1px solid #F5F0EB", background: "transparent", color: "#F5F0EB",
              padding: "12px 22px", cursor: "pointer", transition: "all 0.2s", textDecoration: "none", display: "inline-block", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F0EB"; e.currentTarget.style.color = "#5C1A1A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#F5F0EB"; }}
          >
            Book [LOCATION_1]
          </a>
          <a
            href={`${import.meta.env.BASE_URL}book?location=[location-2-slug]`}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
              border: "1px solid #C9A96E", background: "transparent", color: "#C9A96E",
              padding: "12px 22px", cursor: "pointer", transition: "all 0.2s", textDecoration: "none", display: "inline-block", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#C9A96E"; e.currentTarget.style.color = "#5C1A1A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C9A96E"; }}
          >
            Book [LOCATION_2]
          </a>
        </div>
      </motion.div>
    </section>
  );
}
