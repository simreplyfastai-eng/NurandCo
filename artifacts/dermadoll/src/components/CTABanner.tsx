import { motion } from "framer-motion";

export default function CTABanner() {
  return (
    <section id="book" style={{ background: "#5C1A1A", padding: "100px 24px", textAlign: "center" }}>
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.4), transparent)", marginBottom: 80 }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ maxWidth: 560, margin: "0 auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.6 }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>Book Now</span>
          <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.6 }} />
        </div>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2.4rem, 7vw, 4rem)", fontWeight: 400, color: "#F5F0EB", margin: "0 0 16px", lineHeight: 1.1 }}>
          Ready to Book?
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "rgba(245,240,235,0.65)", margin: "0 0 40px", lineHeight: 1.6 }}>
          Choose your preferred location and book your appointment
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="https://starrbookingss.as.me/schedule/1b78ff68"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
              border: "1px solid #F5F0EB", background: "transparent", color: "#F5F0EB",
              padding: "14px 28px", cursor: "pointer", transition: "all 0.2s", textDecoration: "none", display: "inline-block",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F0EB"; e.currentTarget.style.color = "#5C1A1A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#F5F0EB"; }}
          >
            BOOK HORNCHURCH
          </a>
          <a
            href="https://starrbookingss.as.me/schedule/1b78ff68"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
              border: "1px solid #C9A96E", background: "transparent", color: "#C9A96E",
              padding: "14px 28px", cursor: "pointer", transition: "all 0.2s", textDecoration: "none", display: "inline-block",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#C9A96E"; e.currentTarget.style.color = "#5C1A1A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C9A96E"; }}
          >
            BOOK MARYLEBONE
          </a>
        </div>
      </motion.div>
    </section>
  );
}
