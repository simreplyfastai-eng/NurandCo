import { motion } from "framer-motion";

export default function CTABanner() {
  return (
    <section style={{
      background: "#F5F0EB",
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

      {/* Botanical corner ornaments */}
      <svg aria-hidden="true" viewBox="0 0 200 200" style={{ position: "absolute", top: 0, left: 0, width: 200, height: 200, opacity: 0.14, pointerEvents: "none" }}>
        <g stroke="#C9A96E" strokeWidth="1" fill="none">
          <path d="M0,200 Q30,130 90,105 Q55,145 0,200Z" />
          <path d="M0,200 Q60,155 110,125 Q70,160 0,200Z" />
          <path d="M0,200 Q45,110 80,75" strokeLinecap="round" />
          <circle cx="90" cy="105" r="3" fill="#C9A96E" />
          <circle cx="110" cy="125" r="2" fill="#C9A96E" />
          <circle cx="55" cy="150" r="1.5" fill="#C9A96E" />
          <path d="M68,92 Q74,80 85,83 Q76,90 68,92Z" />
          <path d="M55,115 Q61,103 72,107 Q64,114 55,115Z" />
          <path d="M38,138 Q44,126 55,130 Q47,137 38,138Z" />
        </g>
      </svg>
      <svg aria-hidden="true" viewBox="0 0 200 200" style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, opacity: 0.14, pointerEvents: "none", transform: "scaleX(-1)" }}>
        <g stroke="#C9A96E" strokeWidth="1" fill="none">
          <path d="M0,200 Q30,130 90,105 Q55,145 0,200Z" />
          <path d="M0,200 Q60,155 110,125 Q70,160 0,200Z" />
          <path d="M0,200 Q45,110 80,75" strokeLinecap="round" />
          <circle cx="90" cy="105" r="3" fill="#C9A96E" />
          <circle cx="110" cy="125" r="2" fill="#C9A96E" />
          <circle cx="55" cy="150" r="1.5" fill="#C9A96E" />
          <path d="M68,92 Q74,80 85,83 Q76,90 68,92Z" />
          <path d="M55,115 Q61,103 72,107 Q64,114 55,115Z" />
        </g>
      </svg>
      <svg aria-hidden="true" viewBox="0 0 200 200" style={{ position: "absolute", bottom: 0, left: 0, width: 160, height: 160, opacity: 0.1, pointerEvents: "none", transform: "rotate(90deg)" }}>
        <g stroke="#C9A96E" strokeWidth="1" fill="none">
          <path d="M0,200 Q30,130 90,105 Q55,145 0,200Z" />
          <path d="M0,200 Q60,155 110,125 Q70,160 0,200Z" />
          <circle cx="90" cy="105" r="2.5" fill="#C9A96E" />
        </g>
      </svg>
      <svg aria-hidden="true" viewBox="0 0 200 200" style={{ position: "absolute", bottom: 0, right: 0, width: 160, height: 160, opacity: 0.1, pointerEvents: "none", transform: "rotate(90deg) scaleX(-1)" }}>
        <g stroke="#C9A96E" strokeWidth="1" fill="none">
          <path d="M0,200 Q30,130 90,105 Q55,145 0,200Z" />
          <path d="M0,200 Q60,155 110,125 Q70,160 0,200Z" />
          <circle cx="90" cy="105" r="2.5" fill="#C9A96E" />
        </g>
      </svg>

      {/* Scattered sparkles */}
      {[
        { top: "15%", left: "8%", size: 10, opacity: 0.22 },
        { top: "60%", left: "5%", size: 7, opacity: 0.16 },
        { top: "80%", left: "18%", size: 9, opacity: 0.18 },
        { top: "20%", right: "7%", size: 8, opacity: 0.2 },
        { top: "55%", right: "6%", size: 11, opacity: 0.16 },
        { top: "75%", right: "20%", size: 6, opacity: 0.14 },
      ].map((s, i) => (
        <div key={i} aria-hidden="true" style={{
          position: "absolute",
          top: s.top,
          left: (s as any).left,
          right: (s as any).right,
          opacity: s.opacity,
          pointerEvents: "none",
          fontFamily: "'Cormorant Garamond', serif",
          color: "#C9A96E",
          fontSize: s.size * 1.5,
          lineHeight: 1,
          userSelect: "none",
        }}>✦</div>
      ))}

      {/* Delicate ring ornaments on sides */}
      <svg aria-hidden="true" viewBox="0 0 60 60" style={{ position: "absolute", top: "35%", left: "3%", width: 44, height: 44, opacity: 0.13, pointerEvents: "none" }}>
        <circle cx="30" cy="30" r="26" stroke="#C9A96E" strokeWidth="0.8" fill="none" />
        <circle cx="30" cy="30" r="18" stroke="#C9A96E" strokeWidth="0.5" fill="none" />
        <circle cx="30" cy="30" r="2" fill="#C9A96E" />
        <line x1="30" y1="4" x2="30" y2="12" stroke="#C9A96E" strokeWidth="0.8" />
        <line x1="30" y1="48" x2="30" y2="56" stroke="#C9A96E" strokeWidth="0.8" />
        <line x1="4" y1="30" x2="12" y2="30" stroke="#C9A96E" strokeWidth="0.8" />
        <line x1="48" y1="30" x2="56" y2="30" stroke="#C9A96E" strokeWidth="0.8" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 60 60" style={{ position: "absolute", top: "35%", right: "3%", width: 44, height: 44, opacity: 0.13, pointerEvents: "none" }}>
        <circle cx="30" cy="30" r="26" stroke="#C9A96E" strokeWidth="0.8" fill="none" />
        <circle cx="30" cy="30" r="18" stroke="#C9A96E" strokeWidth="0.5" fill="none" />
        <circle cx="30" cy="30" r="2" fill="#C9A96E" />
        <line x1="30" y1="4" x2="30" y2="12" stroke="#C9A96E" strokeWidth="0.8" />
        <line x1="30" y1="48" x2="30" y2="56" stroke="#C9A96E" strokeWidth="0.8" />
        <line x1="4" y1="30" x2="12" y2="30" stroke="#C9A96E" strokeWidth="0.8" />
        <line x1="48" y1="30" x2="56" y2="30" stroke="#C9A96E" strokeWidth="0.8" />
      </svg>

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
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>Book Your Appointment</span>
            <div style={{ height: 1, width: 36, background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
          </div>

          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "clamp(2.4rem,6vw,4.2rem)",
            fontWeight: 300,
            color: "#3D3D3D",
            margin: "0 0 20px",
            lineHeight: 1.15,
          }}>
            Ready for a consultation?
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            color: "#737373",
            margin: "0 0 44px",
            lineHeight: 1.7,
          }}>
            Online booking — coming soon.<br />
            Message <span style={{ color: "#C9A96E" }}>@starr.aesthetics</span> on Instagram to enquire.
          </p>
          <a
            href="https://instagram.com/starr.aesthetics"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "transparent",
              border: "1px solid #C9A96E",
              color: "#3D3D3D",
              fontFamily: "'Inter', sans-serif",
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
              e.currentTarget.style.color = "#3D3D3D";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#3D3D3D";
            }}
          >
            Get In Touch
          </a>
        </div>
      </motion.div>
    </section>
  );
}
