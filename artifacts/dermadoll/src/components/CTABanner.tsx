import { motion } from "framer-motion";

export default function CTABanner() {
  return (
    <section style={{
      background: "#FAF7F2",
      padding: "120px 24px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background watermark */}
      <div aria-hidden="true" style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: "clamp(100px, 18vw, 220px)",
        color: "rgba(201,169,110,0.12)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        userSelect: "none",
        lineHeight: 1,
      }}>
        Ready?
      </div>

      {/* Ambient glow */}
      <div aria-hidden="true" style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 600,
        height: 300,
        borderRadius: "50%",
        background: "#C9A96E",
        filter: "blur(120px)",
        opacity: 0.1,
        pointerEvents: "none",
      }} />

      {/* Top rule */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.4), transparent)" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}
      >
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 28 }}>
          <div style={{ height: 1, width: 36, background: "linear-gradient(90deg, transparent, #C9A96E)" }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>Book Your Appointment</span>
          <div style={{ height: 1, width: 36, background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
        </div>

        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: "clamp(2.4rem,6vw,4.2rem)",
          fontWeight: 300,
          color: "#1C1C1E",
          margin: "0 0 20px",
          lineHeight: 1.15,
        }}>
          Ready for a consultation?
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: "#6B6260",
          margin: "0 0 44px",
          lineHeight: 1.7,
        }}>
          Online booking — coming soon.<br />
          Message <span style={{ color: "#C9A96E" }}>@facebyniamh</span> on Instagram to enquire.
        </p>
        <a
          href="https://instagram.com/facebyniamh"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "transparent",
            border: "1px solid #1C1C1E",
            color: "#1C1C1E",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            padding: "15px 40px",
            borderRadius: 0,
            textDecoration: "none",
            transition: "all 0.25s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1C1C1E";
            e.currentTarget.style.color = "#FAF7F2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#1C1C1E";
          }}
        >
          Get In Touch
        </a>
      </motion.div>
    </section>
  );
}
