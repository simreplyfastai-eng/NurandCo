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
      <div style={{ height: 1, width: 28, background: "#C8860A", opacity: 0.5 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C8860A" }}>{label}</span>
      <div style={{ height: 1, width: 28, background: "#C8860A", opacity: 0.5 }} />
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
    <section id="services" style={{ background: "#FAF7F2", padding: "100px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <Eyebrow label="TREATMENTS" />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 600, color: "#1A0F00", margin: "0 0 12px" }}>
            What I Offer
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(1rem,2vw,1.2rem)", color: "#C8860A", margin: 0 }}>
            Every treatment is tailored to you.
          </p>
        </motion.div>

        {/* Carousel controls */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 20 }}>
          {[{ dir: "left" as const, icon: <ChevronLeft size={18} /> }, { dir: "right" as const, icon: <ChevronRight size={18} /> }].map(({ dir, icon }) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid #E2DDD5",
                background: "#FAF7F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#1A0F00",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1A0F00"; e.currentTarget.style.color = "#FAF7F2"; (e.currentTarget.querySelector("svg") as SVGElement).style.color = "#FAF7F2"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FAF7F2"; e.currentTarget.style.color = "#1A0F00"; }}
            >
              {icon}
            </button>
          ))}
        </div>

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
                background: "#FAF7F2",
                border: "1px solid #E2DDD5",
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 20, color: "#C8860A", marginBottom: 16 }}>✦</div>
              <h3 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.4rem",
                fontWeight: 600,
                color: "#1A0F00",
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
                color: "#C8860A",
                marginBottom: 20,
              }}>
                {svc.from}
              </div>
              <button
                onClick={() => setConsultOpen(true)}
                style={{
                  background: "transparent",
                  border: "1px solid #1A0F00",
                  color: "#1A0F00",
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
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1A0F00"; e.currentTarget.style.color = "#FAF7F2"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1A0F00"; }}
              >
                Book
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {consultOpen && <ConsultationModal onClose={() => setConsultOpen(false)} />}
    </section>
  );
}
