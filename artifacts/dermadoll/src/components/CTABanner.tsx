import { motion } from "framer-motion";

export default function CTABanner() {
  return (
    <section style={{
      background: "linear-gradient(160deg, #EDE7DC 0%, #FAF7F2 55%, #EDE7DC 100%)",
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
        color: "rgba(201,169,110,0.1)",
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
        opacity: 0.12,
        pointerEvents: "none",
      }} />

      {/* Top rule */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.4), transparent)" }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        style={{ maxWidth: 680, margin: "0 auto", position: "relative", zIndex: 1 }}
      >
        {/* Glass card */}
        <div style={{
          background: "rgba(255,255,255,0.52)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "1px solid rgba(201,169,110,0.28)",
          boxShadow: "0 8px 48px rgba(201,169,110,0.1), 0 1px 0 rgba(255,255,255,0.9) inset",
          borderRadius: 2,
          padding: "64px 56px",
        }}>
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
              border: "1px solid #C9A96E",
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
              e.currentTarget.style.background = "#C9A96E";
              e.currentTarget.style.color = "#1C1C1E";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#1C1C1E";
            }}
          >
            Get In Touch
          </a>
        </div>
      </motion.div>
    </section>
  );
}
