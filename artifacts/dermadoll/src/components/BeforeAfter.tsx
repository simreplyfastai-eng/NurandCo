import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const DEFAULT_SLOTS = [
  { key: "ba0", src: "result-1.jpg", label: "Liquid Rhinoplasty" },
  { key: "ba1", src: "result-4.jpg", label: "Teeth Whitening" },
  { key: "ba2", src: "result-2.jpg", label: "Lip Filler" },
  { key: "ba3", src: "result-3.jpg", label: "Glass Skin Facial & Microneedling" },
];

const IMAGE_DELAYS = [0.2, 0.4, 0.6, 0.8];

interface Slot { key: string; src: string; label: string; }

export default function BeforeAfter() {
  const [results, setResults] = useState<Slot[]>(DEFAULT_SLOTS);

  useEffect(() => {
    fetch("/api/media/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setResults(DEFAULT_SLOTS.map((slot) => {
          const overrideSrc = data.beforeAfter?.[slot.key];
          const overrideLabel = data.baLabels?.[slot.key];
          return {
            key: slot.key,
            src: overrideSrc || slot.src,
            label: overrideLabel || slot.label,
          };
        }));
      })
      .catch(() => {});
  }, []);

  const isLocal = (src: string) => !src.startsWith("http") && !src.startsWith("/api/");

  return (
    <section
      className="py-[100px]"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #FAF8F4 50%, #FFFFFF 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top-left decorative cross */}
      <span
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          color: "#C9A96E",
          opacity: 0.4,
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        +
      </span>

      {/* Bottom-right decorative cross */}
      <span
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          color: "#C9A96E",
          opacity: 0.4,
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        +
      </span>

      <div className="container mx-auto px-6 max-w-5xl">

        {/* Heading block */}
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-[2rem] md:text-[56px] mb-5"
          >
            The Doll Gallery
          </motion.h2>

          {/* Animated gold divider */}
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: 60 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            style={{
              height: 1,
              background: "#C9A96E",
              margin: "0 auto 20px",
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="font-light text-lg"
            style={{ color: "#C9A96E" }}
          >
            Every result is natural, tailored and uniquely yours
          </motion.p>
        </div>

        {/* Grid wrapper — relative so the background circle stays inside */}
        <div style={{ position: "relative" }}>

          {/* Faint gold circle behind grid */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 500,
              height: 500,
              border: "1px solid #C9A96E",
              borderRadius: "50%",
              opacity: 0.06,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <div
            className="py-12"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {results.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: IMAGE_DELAYS[i], duration: 0.6, ease: "easeOut" }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 8px 24px rgba(201,169,110,0.2)",
                }}
                style={{
                  justifySelf: "center",
                  width: "100%",
                  maxWidth: "420px",
                  borderRadius: "12px",
                  border: "2px solid #C9A96E",
                  overflow: "hidden",
                  cursor: "default",
                  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#B8934A";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#C9A96E";
                }}
              >
                <div style={{ aspectRatio: "1 / 1", width: "100%", overflow: "hidden" }}>
                  <img
                    src={isLocal(item.src) ? `${import.meta.env.BASE_URL}${item.src}` : item.src}
                    alt={item.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile swipe hint */}
          <p
            style={{
              display: "none",
              textAlign: "center",
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              color: "#C9A96E",
              fontStyle: "italic",
              marginTop: 16,
            }}
            className="mobile-swipe-hint"
          >
            Swipe through our results →
          </p>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-swipe-hint { display: block !important; }
        }
      `}</style>
    </section>
  );
}
