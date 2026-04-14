import { motion } from "framer-motion";

export default function CTABanner() {
  return (
    <section style={{ background: "#1A0F00", padding: "100px 24px", textAlign: "center" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ maxWidth: 700, margin: "0 auto" }}
      >
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: "clamp(2.2rem,6vw,4rem)",
          fontWeight: 300,
          color: "#FAF7F2",
          margin: "0 0 20px",
          lineHeight: 1.15,
        }}>
          Ready for a consultation?
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: "rgba(250,247,242,0.65)",
          margin: "0 0 40px",
        }}>
          Online booking — coming soon. Message @facebyniamh on Instagram to enquire.
        </p>
        <a
          href="https://instagram.com/facebyniamh"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            background: "transparent",
            border: "1px solid #C8860A",
            color: "#C8860A",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            letterSpacing: "2px",
            textTransform: "uppercase",
            padding: "14px 36px",
            borderRadius: 0,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#C8860A";
            e.currentTarget.style.color = "#FAF7F2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#C8860A";
          }}
        >
          Get In Touch
        </a>
      </motion.div>
    </section>
  );
}
