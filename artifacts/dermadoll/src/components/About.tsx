import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/objects/")) return `/api/media/serve?path=${encodeURIComponent(path)}`;
  return path;
}

export default function About() {
  const [practImage, setPractImage] = useState<string | null>(`${import.meta.env.BASE_URL}eva-hero.jpg`);

  useEffect(() => {
    fetch("/api/media/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const img = data?.aboutImage || data?.practitionerImage;
        if (img) setPractImage(mediaUrl(img));
      })
      .catch(() => {});
  }, []);

  return (
    <section id="about" style={{ background: "#FFFFFF", padding: "100px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <style>{`
            @media (max-width: 768px) {
              .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
              .about-text-col { order: 1 !important; }
              .about-img-col { order: 2 !important; }
            }
          `}</style>

          <motion.div
            className="about-text-col"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ height: 1, width: 24, background: "#C9A96E" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>
                Meet the Founder
              </span>
            </div>

            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: 400, color: "#5C1A1A", margin: "0 0 28px", lineHeight: 1 }}>
              Eva
            </h2>

            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#737373", lineHeight: 1.8, margin: "0 0 18px" }}>
              With over 6 years in beauty and a BA (Hons) in Education, Eva founded StarrBeauty with a singular vision, to enhance your natural beauty with precision, artistry and care.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#737373", lineHeight: 1.8, margin: "0 0 40px" }}>
              As the creator of the signature NaturalèLips™ technique, Eva combines clinical expertise with an educator's touch in every treatment she performs.
            </p>

            <div style={{ borderTop: "1px solid #E2DDD5", paddingTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
              {[
                { stat: "6+", label: "Years Experience" },
                { stat: "2", label: "Clinic Locations" },
                { stat: "NL™", label: "NaturalèLips™ Creator" },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: "center", borderRight: i < 2 ? "1px solid #E2DDD5" : "none", padding: "0 16px" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", fontWeight: 400, color: "#C9A96E", lineHeight: 1, marginBottom: 6 }}>
                    {item.stat}
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#737373" }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="about-img-col"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "#E8E2D9" }}>
              {practImage ? (
                <img src={practImage} alt="Eva, Founder, StarrBeauty"
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "#C9A96E", opacity: 0.5 }}>Eva</span>
                </div>
              )}
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "#C9A96E", textAlign: "center", margin: 0 }}>
              Eva, Founder
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
