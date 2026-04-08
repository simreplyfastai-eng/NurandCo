import { motion, AnimatePresence } from "framer-motion";
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
  const [lightbox, setLightbox] = useState<string | null>(null);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    if (lightbox) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  const isLocal = (src: string) => !src.startsWith("http") && !src.startsWith("/api/");
  const resolvedSrc = (src: string) => isLocal(src) ? `${import.meta.env.BASE_URL}${src}` : src;

  return (
    <>
      <section
        className="py-[100px]"
        style={{
          background: "linear-gradient(180deg, #F0EBE3 0%, #EAE3D9 50%, #F0EBE3 100%)",
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

          {/* Grid wrapper */}
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
                  onClick={() => setLightbox(resolvedSrc(item.src))}
                  style={{
                    justifySelf: "center",
                    width: "100%",
                    maxWidth: "420px",
                    borderRadius: "12px",
                    border: "2px solid #C9A96E",
                    overflow: "hidden",
                    cursor: "zoom-in",
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
                      src={resolvedSrc(item.src)}
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

          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setLightbox(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.88)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                maxWidth: "min(90vw, 800px)",
                maxHeight: "90vh",
                borderRadius: 12,
                border: "2px solid #C9A96E",
                overflow: "hidden",
              }}
            >
              <img
                src={lightbox}
                alt="Enlarged result"
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  maxHeight: "90vh",
                  objectFit: "contain",
                }}
              />
              {/* Close button */}
              <button
                onClick={() => setLightbox(null)}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontSize: 18,
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(201,169,110,0.8)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.6)";
                }}
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
