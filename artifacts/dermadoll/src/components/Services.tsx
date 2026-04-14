import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ConsultationModal from "./ConsultationModal";

interface ServiceCard {
  name: string;
  description: string;
  from: string;
}

const services: ServiceCard[] = [
  {
    name: "Dermal Fillers",
    description: "Lip, cheek, jaw, chin, tear trough and nose filler using premium hyaluronic acid.",
    from: "From £100",
  },
  {
    name: "Anti-Wrinkle",
    description: "Smooth expression lines and lift the brow with precision toxin placement.",
    from: "From £140",
  },
  {
    name: "Skin Boosters",
    description: "Profhilo, Seventy Hyal, Jalupro and Lumi Eyes for deep skin hydration.",
    from: "From £100",
  },
  {
    name: "Polynucleotides",
    description: "PDRN treatments for skin regeneration and quality improvement.",
    from: "From £120",
  },
  {
    name: "Medical Facials",
    description: "Dermaplaning and microneedling with Salmon DNA for glowing skin.",
    from: "From £30",
  },
  {
    name: "Vitamin Injections",
    description: "B12 injections for an energy and wellness boost.",
    from: "From £25",
  },
];

function Eyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
      <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.5 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>{label}</span>
      <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.5 }} />
    </div>
  );
}

export default function Services() {
  const [consultOpen, setConsultOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section id="services" style={{ background: "#FAF7F2", padding: "100px 0", position: "relative", overflow: "hidden" }}>

      {/* Background decorative layer */}
      {/* Large "N" watermark — top right */}
      <div style={{
        position: "absolute", top: "-60px", right: "-40px",
        fontFamily: "'Cormorant Garamond', serif", fontSize: "28rem", fontWeight: 700,
        color: "#C9A96E", opacity: 0.04, lineHeight: 1, userSelect: "none", pointerEvents: "none",
        letterSpacing: "-0.05em",
      }}>N</div>

      {/* Soft radial amber glow — bottom left */}
      <div style={{
        position: "absolute", bottom: "-80px", left: "-80px",
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Scattered ✦ ornaments */}
      {[
        { top: "12%", left: "6%", size: "1.1rem", opacity: 0.13 },
        { top: "70%", left: "3%", size: "0.7rem", opacity: 0.09 },
        { top: "30%", right: "5%", size: "0.85rem", opacity: 0.11 },
        { top: "80%", right: "8%", size: "1.3rem", opacity: 0.08 },
        { top: "55%", left: "50%", size: "0.6rem", opacity: 0.07 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos as any,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: pos.size, color: "#C9A96E", opacity: pos.opacity,
          pointerEvents: "none", userSelect: "none",
        }}>✦</div>
      ))}

      {/* Thin horizontal rule lines — decorative */}
      <div style={{
        position: "absolute", top: 48, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: 1, background: "linear-gradient(to right, transparent, rgba(201,169,110,0.15), transparent)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: 1, background: "linear-gradient(to right, transparent, rgba(201,169,110,0.15), transparent)",
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
          <Eyebrow label="TREATMENTS" />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 600, color: "#1C1C1E", margin: "0 0 12px" }}>
            What I Offer
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(1rem,2vw,1.2rem)", color: "#C9A96E", margin: 0 }}>
            Every treatment is tailored to you.
          </p>
        </motion.div>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: 20,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: 16,
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <style>{`.services-scroll::-webkit-scrollbar { display: none; }`}</style>
          {services.map((svc, i) => (
            <motion.div
              key={svc.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              style={{
                minWidth: "clamp(260px, 31%, 320px)",
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
              <div style={{ fontSize: 20, color: "#C9A96E", marginBottom: 16 }}>✦</div>
              <h3 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.4rem",
                fontWeight: 600,
                color: "#1C1C1E",
                margin: "0 0 12px",
              }}>
                {svc.name}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#6B6260",
                lineHeight: 1.7,
                margin: "0 0 24px",
                flexGrow: 1,
              }}>
                {svc.description}
              </p>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "1.2rem",
                color: "#C9A96E",
                marginBottom: 20,
              }}>
                {svc.from}
              </div>
              <button
                onClick={() => setConsultOpen(true)}
                style={{
                  background: "transparent",
                  border: "1px solid #C9A96E",
                  color: "#1C1C1E",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  padding: "12px 20px",
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  alignSelf: "flex-start",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#C9A96E"; e.currentTarget.style.color = "#1C1C1E"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1C1C1E"; }}
              >
                Book
              </button>
            </motion.div>
          ))}
        </div>

        {/* Carousel controls — centred below cards */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 32 }}>
          {[{ dir: "left" as const, icon: <ChevronLeft size={20} /> }, { dir: "right" as const, icon: <ChevronRight size={20} /> }].map(({ dir, icon }) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "1.5px solid #C9A96E",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#1C1C1E",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#C9A96E"; e.currentTarget.style.color = "#1C1C1E"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1C1C1E"; }}
            >
              {icon}
            </button>
          ))}
        </div>

      </div>

      {consultOpen && <ConsultationModal onClose={() => setConsultOpen(false)} />}
    </section>
  );
}
