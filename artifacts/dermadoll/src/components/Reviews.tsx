import { useState, useRef, useEffect } from "react";
import reviewsData from "../data/reviews.json";

interface Review {
  id: string;
  reviewer: string;
  quote: string;
  rating: number;
  source: string;
  date: string;
}

const reviews: Review[] = reviewsData;

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="#BFB5A8" aria-hidden="true">
      <polygon points="6,0.5 7.7,4.1 11.7,4.7 8.9,7.5 9.6,11.5 6,9.6 2.4,11.5 3.1,7.5 0.3,4.7 4.3,4.1" />
    </svg>
  );
}

export default function Reviews() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      if (el.clientWidth === 0) return;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIdx(Math.max(0, Math.min(idx, reviews.length - 1)));
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  return (
    <section id="reviews" style={{ background: "#111111", padding: "6rem 2.5rem" }}>
      <style>{`
        /* ── Desktop grid ── */
        .reviews-header { /* inherits section padding */ }

        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 3rem;
        }
        .review-card {
          background: transparent;
          border: 1px solid #1A1917;
          border-radius: 2px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .reviews-dots { display: none; }

        /* ── Mobile single-card swipe ── */
        @media (max-width: 768px) {
          section#reviews { padding: 3rem 0; }
          .reviews-header { padding: 0 1.25rem; }

          .reviews-grid {
            display: flex;
            grid-template-columns: unset;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 0;
            margin-top: 2rem;
            scrollbar-width: none;
          }
          .reviews-grid::-webkit-scrollbar { display: none; }

          .review-card {
            min-width: 100vw;
            scroll-snap-align: start;
            flex-shrink: 0;
            border: none;
            border-top: 1px solid #1A1917;
            border-radius: 0;
            padding: 2rem 1.25rem;
            box-sizing: border-box;
          }

          .reviews-dots {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-top: 1.5rem;
          }
          .reviews-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            transition: background 0.2s;
            flex-shrink: 0;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        <div className="reviews-header">
          <p
            className="eyebrow"
            style={{ marginBottom: "1rem", color: "#BFB5A8" }}
          >
            CLIENT REVIEWS
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#F2EFE9",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            What clients say
          </h2>
        </div>
      </div>

      {/* Cards — full-bleed on mobile */}
      <div className="reviews-grid" ref={scrollRef}>
        {reviews.map((r) => (
          <div key={r.id} className="review-card">
            <div
              aria-hidden="true"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "5rem",
                color: "#BFB5A8",
                lineHeight: 0.7,
                marginBottom: "0.25rem",
                userSelect: "none",
              }}
            >
              &ldquo;
            </div>

            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "1.2rem",
                color: "#F2EFE9",
                lineHeight: 1.6,
                margin: 0,
                flexGrow: 1,
              }}
            >
              {r.quote}
            </p>

            <div style={{ display: "flex", gap: "3px", marginTop: "0.25rem" }}>
              {Array.from({ length: r.rating }).map((_, i) => (
                <StarIcon key={i} />
              ))}
            </div>

            <div>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#BFB5A8",
                  margin: "0 0 0.25rem",
                }}
              >
                {r.reviewer}
              </p>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.625rem",
                  color: "#6B6560",
                  margin: 0,
                  letterSpacing: "0.05em",
                }}
              >
                {r.source} · {r.date}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators — visible on mobile only */}
      <div className="reviews-dots" aria-hidden="true">
        {reviews.map((_, i) => (
          <div
            key={i}
            className="reviews-dot"
            style={{ background: i === activeIdx ? "#1A1917" : "#BFB5A8" }}
          />
        ))}
      </div>
    </section>
  );
}
