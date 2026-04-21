import { motion } from "framer-motion";

export default function CTABanner() {
  const scrollToBook = () => document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="book" style={{ background: "#F5F0EB", padding: "100px 24px", textAlign: "center" }}>
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #E2DDD5, transparent)", marginBottom: 80 }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ maxWidth: 560, margin: "0 auto" }}
      >
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2.4rem, 7vw, 4rem)", fontWeight: 400, color: "#5C1A1A", margin: "0 0 16px", lineHeight: 1.1 }}>
          Ready to Book?
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#737373", margin: "0 0 40px", lineHeight: 1.6 }}>
          Choose your preferred location and book your appointment
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={scrollToBook}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
              border: "1px solid #5C1A1A", background: "transparent", color: "#5C1A1A",
              padding: "14px 28px", cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#5C1A1A"; e.currentTarget.style.color = "#F5F0EB"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5C1A1A"; }}
          >
            BOOK HORNCHURCH
          </button>
          <button
            onClick={scrollToBook}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
              border: "1px solid #C9A96E", background: "transparent", color: "#3D3D3D",
              padding: "14px 28px", cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#C9A96E"; e.currentTarget.style.color = "#3D3D3D"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3D3D3D"; }}
          >
            BOOK MARYLEBONE
          </button>
        </div>
      </motion.div>
    </section>
  );
}
