import { useEffect, useState } from "react";

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/objects/")) return `/api/media/serve?path=${encodeURIComponent(path)}`;
  return path;
}

export default function About() {
  const [practImage, setPractImage] = useState<string | null>(null);

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
    <section id="about" className="has-texture" style={{ background: "#F8F8F6", padding: "6rem 2.5rem" }}>
      <style>{`
        .about-grid {
          display: grid;
          grid-template-columns: 5fr 7fr;
          gap: 5rem;
          align-items: start;
          max-width: 1140px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .about-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          section#about { padding: 3rem 1.25rem; }
        }
      `}</style>

      <div className="about-grid">
        {/* Portrait */}
        <div
          style={{
            aspectRatio: "3/4",
            background: "#F8F8F6",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {practImage && (
            <img
              src={practImage}
              alt="Nur — practitioner"
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
            />
          )}
        </div>

        {/* Text */}
        <div>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>THE PRACTITIONER</p>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "clamp(3rem, 6vw, 4.5rem)",
              color: "#0E0D0B",
              margin: "0 0 1.5rem",
              lineHeight: 1,
            }}
          >
            Nur
          </h2>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: "0.9375rem",
              color: "#5A5248",
              lineHeight: 1.8,
              margin: "0 0 2rem",
            }}
          >
          Nur & Co Aesthetics was built on what was missing as a client — tailored treatments, transparent pricing, results led by the highest-quality products and devices.
          </p>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: "0.9375rem",
            color: "#5A5248",
            lineHeight: 1.8,
            margin: "0 0 2rem",
          }}
        >
          Backed by 10,000+ treatments, 5-star reviews and progression toward Level 7. Prescriber-led, doctor-backed, with ultrasound and SkinPen Precision Elite. Known for working with nervous clients and those let down before. Every treatment is precise, considered, never rushed — with honest advice, even when that means saying no.
        </p>

          <div
            style={{
              borderTop: "1px solid #E8E5DD",
              paddingTop: "1.5rem",
            }}
          >
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: "0.8125rem",
                color: "#5A5248",
                lineHeight: 1.9,
                margin: 0,
              }}
            >
              Over 10,000 treatments
              <span style={{ margin: "0 0.6em", color: "#E8E5DD" }}>·</span>
              Top 2.91% UK practitioners (Faces)
              <span style={{ margin: "0 0.6em", color: "#E8E5DD" }}>·</span>
              Fully insured
              <span style={{ margin: "0 0.6em", color: "#E8E5DD" }}>·</span>
              Works with qualified prescriber
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
