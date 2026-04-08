import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const DEFAULT_SLOTS = [
  { key: "ba0", src: "result-1.jpg", label: "Liquid Rhinoplasty" },
  { key: "ba1", src: "result-4.jpg", label: "Teeth Whitening" },
  { key: "ba2", src: "result-2.jpg", label: "Lip Filler" },
  { key: "ba3", src: "result-3.jpg", label: "Glass Skin Facial & Microneedling" },
];

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
    <section className="py-[100px] bg-secondary">
      <div className="container mx-auto px-6 max-w-5xl">

        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-[2rem] md:text-[56px] mb-5"
          >
            Before & After
          </motion.h2>
          <div className="w-[60px] h-px bg-primary mx-auto mb-5" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-light text-lg"
            style={{ color: "#C9A96E" }}
          >
            Every result is natural, tailored and uniquely yours
          </motion.p>
        </div>

        <div
          className="py-12"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          {results.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
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

              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  color: "#C9A96E",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  textAlign: "center",
                  marginTop: "10px",
                  paddingBottom: "14px",
                  paddingLeft: "8px",
                  paddingRight: "8px",
                }}
              >
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
