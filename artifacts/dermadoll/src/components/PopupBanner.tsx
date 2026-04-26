import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getNextAvailableSlot } from "@/lib/nextSlot";

const SESSION_KEY = "popupSeen";

export default function PopupBanner() {
  const [visible, setVisible] = useState(false);
  const [nextSlot] = useState(() => getNextAvailableSlot());

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const t = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible]);

  const close = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setVisible(false);
  };

  const bookNow = () => {
    close();
    setTimeout(() => {
      document.getElementById("treatments")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 400,
              borderRadius: 24,
              padding: "clamp(28px,5vw,40px) clamp(20px,4vw,32px)",
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "0 12px 48px rgba(201,169,110,0.2)",
              textAlign: "center", overflow: "hidden",
              position: "relative", flexShrink: 0,
            }}
          >
            <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "var(--brand-accent)", filter: "blur(60px)", opacity: 0.25, pointerEvents: "none", zIndex: 0 }} />
            <div style={{ position: "absolute", bottom: -30, left: -30, width: 140, height: 140, borderRadius: "50%", background: "#f0d898", filter: "blur(60px)", opacity: 0.25, pointerEvents: "none", zIndex: 0 }} />

            <button
              onClick={close}
              aria-label="Close"
              style={{ position: "absolute", top: 16, right: 20, fontSize: 22, color: "var(--brand-accent)", background: "none", border: "none", cursor: "pointer", zIndex: 1, lineHeight: 1 }}
            >
              ×
            </button>

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-block", background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.4)", color: "var(--brand-accent)", fontFamily: "Inter, sans-serif", fontSize: 11, letterSpacing: "2px", borderRadius: 20, padding: "5px 14px" }}>
                LIMITED AVAILABILITY
              </div>

              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,5vw,34px)", fontWeight: 600, color: "#ffffff", marginTop: 16, lineHeight: 1.2, marginBottom: 0 }}>
                Book Your Treatment<br />This Week ✨
              </h2>

              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}>
                Spaces fill up fast. Secure your appointment today and receive confirmation within minutes.
              </p>

              <div style={{ width: 50, height: 1, background: "var(--brand-accent)", margin: "20px auto" }} />

              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--brand-accent)", fontStyle: "italic", margin: 0 }}>
                ⏰ Next available: {nextSlot}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
                <button
                  onClick={bookNow}
                  style={{ background: "var(--brand-accent)", color: "#000", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, padding: 14, borderRadius: 30, border: "none", cursor: "pointer", transition: "all 0.15s", width: "100%" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Book Now →
                </button>
                <button
                  onClick={close}
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.8)", fontFamily: "Inter, sans-serif", fontSize: 13, padding: 12, borderRadius: 30, cursor: "pointer", transition: "all 0.15s", width: "100%" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                >
                  Maybe Later
                </button>
              </div>

              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", fontStyle: "italic", marginTop: 16, marginBottom: 0 }}>
                No card required to enquire.<br />Free cancellation 48hrs before.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
