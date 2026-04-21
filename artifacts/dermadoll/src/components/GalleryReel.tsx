import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL;
const res = (src: string) => src.startsWith("http") || src.startsWith("/api/") ? src : `${BASE}${src}`;

interface Card { key: string; type: "image" | "video"; src: string; label: string; category: string; }

const ROW1: Card[] = [
  { key: "r1a", type: "image", src: "result-1.jpg",  label: "NaturalèLips™",      category: "LIP FILLER" },
  { key: "r1b", type: "video", src: "video1.mp4",    label: "HD Sculpt Lips",      category: "LIP FILLER" },
  { key: "r1c", type: "image", src: "result-4.jpg",  label: "Facial Contouring",   category: "ADVANCED FILLER" },
  { key: "r1d", type: "video", src: "video2.mp4",    label: "Filler Dissolve & Refill", category: "FLAT LIPS CORRECTED" },
];

const ROW2: Card[] = [
  { key: "r2a", type: "image", src: "result-2.jpg",  label: "NaturalèLips™",      category: "LIP FILLER" },
  { key: "r2b", type: "video", src: "video3.mp4",    label: "Anti-Wrinkle",        category: "NEW PRODUCT SHOWCASE" },
  { key: "r2c", type: "image", src: "result-3.jpg",  label: "NaturalèLips™",      category: "HD SCULPT LIPS" },
  { key: "r2d", type: "video", src: "video1.mp4",    label: "NaturalèLips™",       category: "SUBTLE YET CONFIDENT" },
];

function VideoCard({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const tryPlay = () => { v.muted = true; v.playsInline = true; v.play().catch(() => {}); };
    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    const obs = new IntersectionObserver(([e]) => e.isIntersecting ? tryPlay() : v.pause(), { threshold: 0.1 });
    obs.observe(v);
    return () => { v.removeEventListener("loadeddata", tryPlay); v.removeEventListener("canplay", tryPlay); obs.disconnect(); };
  }, [src]);
  return (
    <video ref={ref} autoPlay muted loop playsInline preload="auto"
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}>
      <source src={src} type="video/mp4" />
    </video>
  );
}

function ReelCard({ card, onClick }: { card: Card; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: 240,
        height: 340,
        position: "relative",
        overflow: "hidden",
        background: "#2A2A2A",
        cursor: card.type === "image" ? "zoom-in" : "default",
        marginRight: 12,
      }}
    >
      {card.type === "image" ? (
        <img src={res(card.src)} alt={card.label}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <VideoCard src={res(card.src)} />
      )}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "absolute", bottom: 18, left: 18, right: 18, pointerEvents: "none" }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#C9A96E", marginBottom: 5 }}>
          {card.category}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.05rem", fontWeight: 400, color: "#F5F0EB", lineHeight: 1.2 }}>
          {card.label}
        </div>
      </div>
    </div>
  );
}

function InfiniteRow({ cards, direction }: { cards: Card[]; direction: "ltr" | "rtl" }) {
  const doubled = [...cards, ...cards, ...cards];
  const animName = direction === "ltr" ? "reel-ltr" : "reel-rtl";
  const cardW = 240 + 12;
  const totalW = cards.length * cardW;
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      <style>{`
        @keyframes reel-ltr { from { transform: translateX(0); } to { transform: translateX(-${totalW}px); } }
        @keyframes reel-rtl { from { transform: translateX(-${totalW}px); } to { transform: translateX(0); } }
        .reel-track-${direction} { animation: ${animName} ${cards.length * 5}s linear infinite; display: flex; will-change: transform; }
        .reel-track-${direction}:hover { animation-play-state: paused; }
      `}</style>

      <div style={{ overflow: "hidden", marginBottom: 12 }}>
        <div className={`reel-track-${direction}`} style={{ width: `${doubled.length * cardW}px` }}>
          {doubled.map((card, i) => (
            <ReelCard key={`${card.key}-${i}`} card={card}
              onClick={card.type === "image" ? () => setLightbox(res(card.src)) : undefined} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ position: "relative", maxWidth: "min(90vw, 800px)", maxHeight: "90vh", border: "2px solid #C9A96E", overflow: "hidden" }}>
              <img src={lightbox} alt="Result" style={{ display: "block", width: "100%", maxHeight: "90vh", objectFit: "contain" }} />
              <button onClick={() => setLightbox(null)}
                style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function GalleryReel() {
  return (
    <section id="results" style={{ padding: "100px 0 90px", background: "#F5F0EB", overflow: "hidden" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 32px", marginBottom: 52 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>Real Results</span>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 400, color: "#5C1A1A", margin: "0 0 8px", textAlign: "center" }}>
            Transformations & Treatments
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#737373", textAlign: "center", margin: 0 }}>
            Natural. Tailored. Uniquely yours.
          </p>
        </motion.div>
      </div>

      <InfiniteRow cards={ROW1} direction="ltr" />
      <InfiniteRow cards={ROW2} direction="rtl" />

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "#A0A0A0" }}>
          Client consent obtained · Results may vary
        </span>
      </div>
    </section>
  );
}
