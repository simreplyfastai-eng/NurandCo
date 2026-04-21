import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useRef, useState } from "react";

const reviews = [
  {
    quote: "Absolutely love my lips — so natural and exactly what I wanted. My practitioner made me feel so comfortable throughout.",
    name: "Chloe",
    treatment: "Lip Filler",
  },
  {
    quote: "Second time coming back and I wouldn't go anywhere else. My skin looks incredible after the skin booster course.",
    name: "Megan",
    treatment: "Skin Boosters",
  },
  {
    quote: "So professional and knowledgeable. My anti-wrinkle looked so fresh — not overdone at all.",
    name: "Lauren",
    treatment: "Anti-Wrinkle",
  },
];

function Eyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
      <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.5 }} />
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>{label}</span>
      <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.5 }} />
    </div>
  );
}

export default function Reviews() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="reviews" style={{ background: "#F5F0EB", padding: "100px 0", position: "relative", overflow: "hidden" }}>

      {/* Decorative background layer */}
      {/* Large faint quotation mark — top right */}
      <div aria-hidden="true" style={{
        position: "absolute", top: "-40px", right: "-20px",
        fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 700,
        fontSize: "clamp(180px, 26vw, 320px)", color: "rgba(201,169,110,0.05)",
        lineHeight: 1, pointerEvents: "none", userSelect: "none", letterSpacing: "-0.04em",
      }}>"</div>

      {/* Radial amber glow — bottom right */}
      <div aria-hidden="true" style={{
        position: "absolute", bottom: -60, right: -60,
        width: 360, height: 360,
        background: "radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Radial amber glow — top left */}
      <div aria-hidden="true" style={{
        position: "absolute", top: -40, left: -40,
        width: 280, height: 280,
        background: "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Scattered ✦ ornaments */}
      {[
        { top: "10%", left: "4%",   size: "0.9rem",  opacity: 0.12 },
        { top: "50%", left: "2%",   size: "0.65rem", opacity: 0.09 },
        { top: "80%", left: "6%",   size: "1.1rem",  opacity: 0.08 },
        { top: "15%", right: "5%",  size: "0.75rem", opacity: 0.10 },
        { top: "70%", right: "3%",  size: "0.85rem", opacity: 0.09 },
      ].map((pos, i) => (
        <div key={i} aria-hidden="true" style={{
          position: "absolute", ...(pos as any),
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: pos.size, color: "#C9A96E", opacity: pos.opacity,
          pointerEvents: "none", userSelect: "none",
        }}>✦</div>
      ))}

      {/* Thin horizontal rule lines */}
      <div aria-hidden="true" style={{
        position: "absolute", top: 48, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: 1,
        background: "linear-gradient(to right, transparent, rgba(201,169,110,0.16), transparent)",
        pointerEvents: "none",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: 1,
        background: "linear-gradient(to right, transparent, rgba(201,169,110,0.16), transparent)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <Eyebrow label="REVIEWS" />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 600, color: "#3D3D3D", margin: "0 0 12px" }}>
            What Clients Say
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(1rem,2vw,1.2rem)", color: "#C9A96E", margin: 0 }}>
            5★ on every platform.
          </p>
        </motion.div>

        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: 24,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: 12,
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                minWidth: "clamp(280px,32%,380px)",
                flexShrink: 0,
                scrollSnapAlign: "start",
                background: "#FFFFFF",
                border: "1px solid #E8E2D9",
                boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} fill="#C9A96E" color="#C9A96E" />
                ))}
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "1.1rem",
                color: "#3D3D3D",
                lineHeight: 1.7,
                margin: "0 0 24px",
                flexGrow: 1,
              }}>
                "{r.quote}"
              </p>
              <div style={{ borderTop: "1px solid #E2DDD5", paddingTop: 16 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: "#3D3D3D" }}>
                  {r.name}
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#737373", marginTop: 3 }}>
                  {r.treatment}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
