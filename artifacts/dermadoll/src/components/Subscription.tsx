import { useState } from "react";

const TIERS = [
  {
    id: "essential",
    name: "Essential",
    price: "[PLACEHOLDER price/mo]",
    inclusions: "[PLACEHOLDER inclusions]",
    featured: false,
  },
  {
    id: "refined",
    name: "Refined",
    price: "[PLACEHOLDER price/mo]",
    inclusions: "[PLACEHOLDER inclusions]",
    featured: true,
  },
  {
    id: "connoisseur",
    name: "Connoisseur",
    price: "[PLACEHOLDER price/mo]",
    inclusions: "[PLACEHOLDER inclusions]",
    featured: false,
  },
];

const FAQS = [
  { q: "What's included?", a: "[PLACEHOLDER]" },
  { q: "Can I pause?", a: "[PLACEHOLDER]" },
  { q: "Can I upgrade?", a: "[PLACEHOLDER]" },
  { q: "How do I redeem?", a: "[PLACEHOLDER]" },
];

export default function Subscription() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="subscription" style={{ background: "#EAE5DF", padding: "6rem 2.5rem" }}>
      <style>{`
        /* ── Desktop grid ── */
        .sub-header { /* inherits section padding */ }

        .sub-tiers {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 3rem;
        }
        .sub-card {
          background: #F2EFE9;
          border-radius: 2px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .faq-item {
          border-top: 1px solid #BFB5A8;
        }
        .faq-item:last-child {
          border-bottom: 1px solid #BFB5A8;
        }
        .faq-trigger {
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 0;
          text-align: left;
          gap: 1rem;
        }
        .faq-answer {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.2s ease, padding 0.2s ease;
        }
        .faq-answer.open {
          max-height: 300px;
          padding-bottom: 1.25rem;
        }

        /* ── Mobile carousel ── */
        @media (max-width: 768px) {
          section#subscription { padding: 3rem 0; }
          .sub-header { padding: 0 1.25rem; }
          .sub-faq { padding: 0 1.25rem; }

          .sub-tiers {
            display: flex;
            grid-template-columns: unset;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 1rem;
            padding: 1.5rem 1.25rem 0.25rem;
            margin-top: 0;
            scrollbar-width: none;
          }
          .sub-tiers::-webkit-scrollbar { display: none; }

          .sub-card {
            min-width: 85vw;
            scroll-snap-align: start;
            flex-shrink: 0;
          }
          .sub-card--featured {
            padding-top: 3rem;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        <div className="sub-header">
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>NUR &amp; CO MEMBERSHIP</p>
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
            Exceptional care, every visit.
          </h2>
        </div>
      </div>

      {/* Tier cards — full-bleed on mobile */}
      <div className="sub-tiers" style={{ maxWidth: 1140, margin: "0 auto" }}>
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`sub-card${tier.featured ? " sub-card--featured" : ""}`}
            style={{
              border: tier.featured ? "1px solid #1A1917" : "1px solid #BFB5A8",
            }}
          >
            {tier.featured && (
              <p className="eyebrow" style={{ margin: 0, color: "#1A1917" }}>
                MOST POPULAR
              </p>
            )}

            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontSize: "1.75rem",
                color: "#1A1917",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {tier.name}
            </h3>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: "1.125rem",
                color: "#1A1917",
                margin: 0,
              }}
            >
              {tier.price}
            </p>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: "0.875rem",
                color: "#6B6560",
                lineHeight: 1.7,
                margin: 0,
                flexGrow: 1,
              }}
            >
              {tier.inclusions}
            </p>

            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-primary"
              style={{ textAlign: "center", textDecoration: "none" }}
            >
              Enquire
            </a>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="sub-faq" style={{ marginTop: "4rem", maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <h3
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "1.5rem",
              color: "#1A1917",
              margin: "0 0 1.5rem",
            }}
          >
            Questions
          </h3>

          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item">
              <button
                className="faq-trigger"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: "0.875rem",
                    color: "#1A1917",
                  }}
                >
                  {faq.q}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "1rem",
                    color: "#BFB5A8",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                  aria-hidden="true"
                >
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              <div className={`faq-answer ${openFaq === i ? "open" : ""}`}>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: "0.875rem",
                    color: "#6B6560",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
