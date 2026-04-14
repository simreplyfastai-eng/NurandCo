import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import ConsultationModal from "./ConsultationModal";

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/objects/"))
    return `/api/media/serve?path=${encodeURIComponent(path)}`;
  return path;
}

function Eyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ height: 1, width: 28, background: "#C8860A", opacity: 0.5 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C8860A" }}>{label}</span>
      <div style={{ height: 1, width: 28, background: "#C8860A", opacity: 0.5 }} />
    </div>
  );
}

export default function About() {
  const [practImage, setPractImage] = useState<string | null>(`${import.meta.env.BASE_URL}niamh-practitioner.jpg`);
  const [consultOpen, setConsultOpen] = useState(false);

  useEffect(() => {
    fetch("/api/media/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.practitionerImage) setPractImage(mediaUrl(data.practitionerImage));
      })
      .catch(() => {});
  }, []);

  return (
    <section id="about" style={{ background: "#F0EBE1", padding: "100px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }} className="about-grid">
          <style>{`
            @media (max-width: 768px) {
              .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
              .about-img-col { order: 2 !important; }
              .about-text-col { order: 1 !important; }
            }
          `}</style>

          {/* Photo — left on desktop */}
          <motion.div
            className="about-img-col"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ aspectRatio: "3/4", overflow: "hidden", background: "#d8cfc6", borderRadius: 4, boxShadow: "0 8px 40px rgba(26,15,0,0.12)" }}
          >
            {practImage ? (
              <img
                src={practImage}
                alt="Niamh — Face By Niamh Aesthetics"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                minHeight: 420,
                background: "linear-gradient(160deg, #cfc5b8 0%, #bfb4a5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "rgba(26,15,0,0.3)" }}>
                  Niamh
                </span>
              </div>
            )}
          </motion.div>

          {/* Text — right on desktop */}
          <motion.div
            className="about-text-col"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <Eyebrow label="ABOUT NIAMH" />
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 600, color: "#1A0F00", margin: "0 0 10px" }}>
              Meet Your Practitioner
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.1rem", color: "#C8860A", margin: "0 0 28px" }}>
              Student Nurse. Advanced Aesthetics Practitioner.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#6B6260", lineHeight: 1.8, margin: "0 0 18px" }}>
              Hi, I'm Niamh — a Student Nurse and Advanced Aesthetics Practitioner based between Leeds and Wakefield. I specialise in natural-looking results that enhance your features while keeping you looking like you — just a refreshed version.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#6B6260", lineHeight: 1.8, margin: "0 0 36px" }}>
              I work from my private home clinic in Leeds and am available at Laurenanaisbeauty in Horsforth two days a month. Every treatment starts with a thorough consultation and is tailored specifically to you.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: 32, marginBottom: 36 }}>
              {[
                { value: "100+", label: "Clients" },
                { value: "5★", label: "Average Rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", fontWeight: 600, color: "#1A0F00", lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "#6B6260", marginTop: 6 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setConsultOpen(true)}
              style={{
                background: "transparent",
                border: "1px solid #1A0F00",
                color: "#1A0F00",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                letterSpacing: "2px",
                textTransform: "uppercase",
                padding: "14px 28px",
                borderRadius: 0,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1A0F00"; e.currentTarget.style.color = "#FAF7F2"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1A0F00"; }}
            >
              Book a Consultation
            </button>
          </motion.div>
        </div>
      </div>

      {consultOpen && <ConsultationModal onClose={() => setConsultOpen(false)} />}
    </section>
  );
}
