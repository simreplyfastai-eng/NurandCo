const TREATMENTS = [
  {
    id: "lip-filler",
    name: "Signature Lip Filler",
    desc: "Considered volume and definition that honours the natural architecture of your lips.",
  },
  {
    id: "facial-contouring",
    name: "Facial Contouring & Balancing",
    desc: "Structural refinement through precise product placement to restore and enhance facial harmony.",
  },
  {
    id: "anti-wrinkle",
    name: "Anti-Wrinkle Injections",
    desc: "Subtle muscle relaxation to soften expression lines while preserving natural movement.",
  },
  {
    id: "skin-boosters",
    name: "Skin Boosters & Polynucleotides",
    desc: "Deep skin hydration and cellular regeneration for lasting radiance and texture improvement.",
  },
  {
    id: "under-eye",
    name: "Under-Eye Treatments",
    desc: "Targeted correction of hollowing and discolouration to restore a rested, refreshed appearance.",
  },
  {
    id: "lemon-bottle",
    name: "Lemon Bottle Fat Dissolver",
    desc: "Non-surgical fat reduction using advanced lipolysis to contour and define targeted areas.",
  },
];

export default function Services() {
  return (
    /* padding moved to CSS class so media query can override it — inline styles can't be overridden by @media */
    <section id="services" className="services-section" style={{ background: "#EAE5DF" }}>
      <style>{`
        /* ── Desktop ── */
        .services-section {
          padding: 6rem 2.5rem;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 3rem;
        }
        .service-card {
          background: #F2EFE9;
          border: 1px solid #BFB5A8;
          border-radius: 2px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          overflow: hidden;
          word-wrap: break-word;
          white-space: normal;
          box-sizing: border-box;
        }
        .service-card-desc {
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          font-size: 0.875rem;
          color: #6B6560;
          line-height: 1.65;
          margin: 0;
          flex-grow: 1;
          white-space: normal;
        }
        .service-card-link {
          display: inline-block;
          margin-top: auto;
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          font-size: 0.75rem;
          color: #1A1917;
          text-decoration: none;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .service-card-link:hover { color: #BFB5A8; }

        @media (max-width: 1024px) {
          .services-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Mobile carousel ── */
        @media (max-width: 768px) {
          .services-section {
            padding: 3rem 0;
            overflow-x: clip; /* clips without becoming a scroll container itself */
          }
          .services-header { padding: 0 1.25rem; }
          .services-grid {
            display: flex;
            grid-template-columns: unset;
            overflow-x: scroll;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 1rem;
            padding: 1.5rem 1.25rem 1rem 1.25rem;
            margin-top: 0;
            scrollbar-width: none;
            box-sizing: border-box;
            max-width: unset;
          }
          .services-grid::-webkit-scrollbar { display: none; }
          .service-card {
            min-width: 75vw;
            max-width: 75vw;
            flex-shrink: 0;
            width: auto;
            overflow: hidden;
            box-sizing: border-box;
            word-wrap: break-word;
            white-space: normal;
          }
          .service-card-desc {
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            white-space: normal;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        <div className="services-header">
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>OUR TREATMENTS</p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#1A1917",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            What we offer
          </h2>
        </div>
      </div>

      <div className="services-grid">
        {TREATMENTS.map((t) => (
          <div key={t.id} className="service-card">
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontSize: "1.35rem",
                color: "#1A1917",
                margin: 0,
                lineHeight: 1.2,
                overflow: "hidden",
                wordWrap: "break-word",
              }}
            >
              {t.name}
            </h3>
            <p className="service-card-desc">{t.desc}</p>
            <a
              href={`${import.meta.env.BASE_URL}book`}
              className="service-card-link"
            >
              Explore →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
