import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const DEFAULT_SLOTS = [
  { key: "ba0", src: "result-1.jpg", label: "NaturalèLips™", category: "LIP FILLER" },
  { key: "ba1", src: "result-4.jpg", label: "Facial Contouring", category: "ADVANCED FILLER" },
  { key: "ba2", src: "result-2.jpg", label: "NaturalèLips™", category: "LIP FILLER" },
  { key: "ba3", src: "result-3.jpg", label: "NaturalèLips™", category: "HD SCULPT LIPS" },
];

const IMAGE_DELAYS = [0.2, 0.4, 0.6, 0.8];

interface Slot { key: string; src: string; label: string; category: string; }

export default function BeforeAfter() {
  const [results, setResults] = useState<Slot[]>(DEFAULT_SLOTS);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/media/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        // New format: galleryImages is an array of URLs
        if (Array.isArray(data.galleryImages) && data.galleryImages.length > 0) {
          const mapped = data.galleryImages.slice(0, DEFAULT_SLOTS.length).map((url: string, i: number) => ({
            ...DEFAULT_SLOTS[i],
            src: url,
          }));
          // Fill remaining slots with defaults if fewer than 4 images
          const filled = DEFAULT_SLOTS.map((s, i) => mapped[i] ?? s);
          setResults(filled);
          return;
        }
        // Legacy format: beforeAfter map
        setResults(DEFAULT_SLOTS.map((slot) => {
          const overrideSrc = data.beforeAfter?.[slot.key];
          const overrideLabel = data.baLabels?.[slot.key];
          return {
            ...slot,
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
      <section id="results" style={{ padding: "100px 0", background: "var(--brand-bg-alt)" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 32px" }}>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
              <div style={{ height: 1, width: 28, background: "var(--brand-accent)" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-accent)" }}>Real Results</span>
              <div style={{ height: 1, width: 28, background: "var(--brand-accent)" }} />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 400, color: "var(--brand-primary)", margin: "0 0 8px" }}>
              Real Transformations
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "var(--brand-accent)", margin: 0 }}>
              Natural. Tailored. Uniquely yours.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {results.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: IMAGE_DELAYS[i], duration: 0.6 }}
                onClick={() => setLightbox(resolvedSrc(item.src))}
                style={{ cursor: "zoom-in" }}
              >
                <div style={{ aspectRatio: "1 / 1", width: "100%", overflow: "hidden", background: "#D4CEC8" }}>
                  {isLocal(item.src) ? (
                    <div style={{ width: "100%", height: "100%", backgroundColor: "#D4CEC8", display: "flex", alignItems: "flex-end", padding: "12px 14px" }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#1A1917", opacity: 0.4 }}>{item.category}</span>
                    </div>
                  ) : (
                    <img
                      src={resolvedSrc(item.src)}
                      alt={item.label}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--brand-primary)" }}>
              Client consent obtained · Results may vary
            </span>
          </div>

        </div>
      </section>

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
                border: "2px solid var(--brand-accent)",
                overflow: "hidden",
              }}
            >
              <img
                src={lightbox}
                alt="Enlarged result"
                style={{ display: "block", width: "100%", height: "100%", maxHeight: "90vh", objectFit: "contain" }}
              />
              <button
                onClick={() => setLightbox(null)}
                aria-label="Close"
                style={{
                  position: "absolute", top: 12, right: 12,
                  width: 36, height: 36,
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff", fontSize: 18,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(4px)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(191,181,168,0.8)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.6)"; }}
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
