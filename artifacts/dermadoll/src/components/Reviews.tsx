import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useRef, useState } from "react";

const reviews = [
  {
    quote: "Absolutely love my lips — so natural and exactly what I wanted. Niamh made me feel so comfortable throughout.",
    name: "Chloe",
    treatment: "Lip Filler",
  },
  {
    quote: "Second time coming back and I wouldn't go anywhere else. My skin looks incredible after the skin booster course.",
    name: "Megan",
    treatment: "Skin Boosters",
  },
  {
    quote: "Niamh is so professional and knowledgeable. My anti-wrinkle looked so fresh — not overdone at all.",
    name: "Lauren",
    treatment: "Anti-Wrinkle",
  },
];

function Eyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
      <div style={{ height: 1, width: 28, background: "#C8860A", opacity: 0.5 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C8860A" }}>{label}</span>
      <div style={{ height: 1, width: 28, background: "#C8860A", opacity: 0.5 }} />
    </div>
  );
}

export default function Reviews() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="reviews" style={{ background: "#FAF7F2", padding: "100px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <Eyebrow label="REVIEWS" />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 600, color: "#1A0F00", margin: "0 0 12px" }}>
            What Clients Say
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(1rem,2vw,1.2rem)", color: "#C8860A", margin: 0 }}>
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
                background: "#FAF7F2",
                border: "1px solid #E2DDD5",
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} fill="#C8860A" color="#C8860A" />
                ))}
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "1.1rem",
                color: "#1A0F00",
                lineHeight: 1.7,
                margin: "0 0 24px",
                flexGrow: 1,
              }}>
                "{r.quote}"
              </p>
              <div style={{ borderTop: "1px solid #E2DDD5", paddingTop: 16 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: "#1A0F00" }}>
                  {r.name}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B6260", marginTop: 3 }}>
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
