const TILE_COUNT = 4;
// Duplicate tiles for the seamless mobile marquee loop
const MOBILE_TILES = Array.from({ length: TILE_COUNT * 2 }, (_, i) => i);

export default function GalleryReel() {
  return (
    <section id="gallery" style={{ background: "#FFFFFF", padding: "6rem 2.5rem" }}>
      <style>{`
        /* ── Desktop grid ── */
        .gallery-header { /* inherits section padding */ }

        .gallery-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 3rem;
        }
        .gallery-tile {
          aspect-ratio: 4/5;
          background: #F8F8F6;
          border-radius: 2px;
          overflow: hidden;
        }
        .gallery-mobile-wrapper { display: none; }

        /* ── Mobile marquee ── */
        @keyframes gallery-autoscroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          section#gallery { padding: 3rem 0; }
          .gallery-header { padding: 0 1.25rem; }
          .gallery-grid { display: none; }

          .gallery-mobile-wrapper {
            display: block;
            overflow: hidden;
            margin-top: 2rem;
          }
          .gallery-mobile-track {
            display: flex;
            gap: 8px;
            width: max-content;
            animation: gallery-autoscroll 20s linear infinite;
            will-change: transform;
          }
          .gallery-mobile-track:active {
            animation-play-state: paused;
          }
          .gallery-mobile-tile {
            min-width: 75vw;
            aspect-ratio: 3/4;
            background: #F8F8F6;
            border-radius: 2px;
            overflow: hidden;
            flex-shrink: 0;
          }
        }
      `}</style>

      {/* Heading — always visible */}
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        <div className="gallery-header">
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>RESULTS</p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#0E0D0B",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Before &amp; after
          </h2>
        </div>
      </div>

      {/* Desktop 2-col grid */}
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        <div className="gallery-grid">
          {Array.from({ length: TILE_COUNT }, (_, i) => (
            <div key={i} className="gallery-tile" />
          ))}
        </div>
      </div>

      {/* Mobile auto-scroll marquee (full bleed) */}
      <div className="gallery-mobile-wrapper">
        <div className="gallery-mobile-track">
          {MOBILE_TILES.map((_, i) => (
            <div key={i} className="gallery-mobile-tile" />
          ))}
        </div>
      </div>
    </section>
  );
}
