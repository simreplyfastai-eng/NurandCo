import { motion } from "framer-motion";
import { useState } from "react";

const masterclasses = [
  {
    title: "Essex Masterclass",
    location: "Hornchurch Clinic",
    badge: "CPD ACCREDITED",
  },
  {
    title: "London Masterclass",
    location: "Marylebone Clinic",
    badge: "CPD ACCREDITED",
  },
];

export default function Training() {
  const [enquireOpen, setEnquireOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");

  const handleEnquire = (title: string) => {
    setSelectedClass(title);
    setEnquireOpen(true);
  };

  return (
    <section id="training" style={{ background: "#FFFFFF", padding: "100px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        <div className="training-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <style>{`@media (max-width: 768px) { .training-grid { grid-template-columns: 1fr !important; gap: 40px !important; } }`}</style>

          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ height: 1, width: 24, background: "#C9A96E" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>
                Starr Academy
              </span>
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 400, color: "#5C1A1A", margin: "0 0 8px" }}>
              Train With Eva
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#737373", margin: "0 0 28px" }}>
              CPD accredited aesthetics training
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#737373", lineHeight: 1.8, margin: "0 0 18px" }}>
              Eva's background in education meets her clinical expertise, delivering world-class aesthetics training through Starr Academy. All courses are CPD accredited and open to candidates with no prior background required.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#737373", lineHeight: 1.8, margin: 0 }}>
              Small groups. Real models. Real confidence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {masterclasses.map((mc, i) => (
              <div
                key={mc.title}
                style={{ background: "#F5F0EB", border: "1px solid #E2DDD5", padding: "28px 28px 24px" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.3rem", fontWeight: 400, color: "#5C1A1A", margin: 0 }}>
                    {mc.title}
                  </h3>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase",
                    border: "1px solid #C9A96E", color: "#C9A96E", padding: "4px 8px", flexShrink: 0, marginLeft: 12,
                  }}>
                    {mc.badge}
                  </span>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#737373", margin: "0 0 20px" }}>
                  {mc.location}
                </p>
                <button
                  onClick={() => handleEnquire(mc.title)}
                  style={{
                    width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
                    border: "1px solid #5C1A1A", background: "transparent", color: "#5C1A1A",
                    padding: "12px 0", cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#5C1A1A"; e.currentTarget.style.color = "#F5F0EB"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5C1A1A"; }}
                >
                  ENQUIRE NOW
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {enquireOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setEnquireOpen(false)}
        >
          <div
            style={{ background: "#FFFFFF", padding: "48px 40px", maxWidth: 480, width: "100%", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEnquireOpen(false)}
              style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#737373" }}
            >×</button>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.8rem", color: "#5C1A1A", margin: "0 0 8px" }}>
              Enquire
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#737373", margin: "0 0 28px" }}>
              {selectedClass}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#737373", lineHeight: 1.7 }}>
              To enquire about our training courses, please reach out via Instagram{" "}
              <a href="https://instagram.com/starraestheticss" target="_blank" rel="noopener noreferrer" style={{ color: "#C9A96E" }}>@starraestheticss</a>{" "}
              or email{" "}
              <a href="mailto:starrbeautyyltd@gmail.com" style={{ color: "#C9A96E" }}>starrbeautyyltd@gmail.com</a>.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
