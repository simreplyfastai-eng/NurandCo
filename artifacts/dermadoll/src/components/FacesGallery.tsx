import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const DEFAULT_IMAGES = [
  { key: "g0", src: "gallery-1.jpg", label: "Lip Filler" },
  { key: "g1", src: "gallery-2.jpg", label: "Lip Filler" },
  { key: "g2", src: "gallery-3.jpg", label: "Liquid Rhinoplasty" },
  { key: "g3", src: "gallery-4.jpg", label: "Lip Filler" },
  { key: "g4", src: "gallery-5.jpg", label: "Dermal Filler" },
  { key: "g5", src: "gallery-6.jpg", label: "Lip Filler" },
  { key: "g6", src: "gallery-7.jpg", label: "Anti-Wrinkle" },
];

interface GalleryItem { key: string; src: string; label: string; }

function resolvedSrc(src: string) {
  if (src.startsWith("http") || src.startsWith("/api/")) return src;
  return `${import.meta.env.BASE_URL}${src}`;
}

export default function FacesGallery() {
  const [images, setImages] = useState<GalleryItem[]>(DEFAULT_IMAGES);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/media/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.gallery) return;
        const merged = DEFAULT_IMAGES.map((slot) => ({
          ...slot,
          src: data.gallery[slot.key] || slot.src,
          label: data.galleryLabels?.[slot.key] || slot.label,
        }));
        setImages(merged);
      })
      .catch(() => {});
  }, []);

  // Duplicate the images for seamless looping
  const items = [...images, ...images];

  return (
    <section
      style={{
        padding: "96px 0",
        background: "#F0EBE1",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative amber rule top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(200,134,10,0.25), transparent)" }} />

      {/* Section heading */}
      <div className="container mx-auto px-6 max-w-5xl" style={{ marginBottom: 56 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center" }}
        >
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 16 }}>
            <div style={{ height: 1, width: 32, background: "#C8860A", opacity: 0.5 }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C8860A" }}>Gallery</span>
            <div style={{ height: 1, width: 32, background: "#C8860A", opacity: 0.5 }} />
          </div>

          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 600,
            color: "#1A0F00",
            margin: "0 0 10px",
            lineHeight: 1.15,
          }}>
            The Faces Gallery
          </h2>

          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "#C8860A",
            margin: 0,
          }}>
            Real people. Real results. Every client is unique.
          </p>
        </motion.div>
      </div>

      {/* Scrolling carousel strip — full bleed */}
      <style>{`
        @keyframes gallery-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .gallery-track {
          animation: gallery-scroll 28s linear infinite;
        }
        .gallery-track.paused {
          animation-play-state: paused;
        }
        .gallery-card img {
          transition: transform 0.4s ease, filter 0.4s ease;
          filter: brightness(0.96) saturate(0.9);
        }
        .gallery-card:hover img {
          transform: scale(1.04);
          filter: brightness(1) saturate(1.05);
        }
      `}</style>

      {/* Edge fade masks */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: 120,
          background: "linear-gradient(90deg, #F0EBE1, transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          right: 0, top: 0, bottom: 0,
          width: 120,
          background: "linear-gradient(270deg, #F0EBE1, transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }} />

        {/* Track */}
        <div style={{ overflow: "hidden" }}>
          <div
            ref={trackRef}
            className={`gallery-track${paused ? " paused" : ""}`}
            style={{
              display: "flex",
              gap: 16,
              width: "max-content",
              paddingLeft: 16,
            }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {items.map((item, i) => (
              <div
                key={`${item.key}-${i}`}
                className="gallery-card"
                style={{
                  width: 220,
                  height: 290,
                  borderRadius: 18,
                  overflow: "hidden",
                  flexShrink: 0,
                  boxShadow: "0 4px 20px rgba(26,15,0,0.10)",
                  cursor: "default",
                }}
              >
                <img
                  src={resolvedSrc(item.src)}
                  alt={item.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative amber rule bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(200,134,10,0.25), transparent)" }} />
    </section>
  );
}
