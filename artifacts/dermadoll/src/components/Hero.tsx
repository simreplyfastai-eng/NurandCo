export default function Hero() {
  return (
    <section
      id="home"
      style={{
        background: "#111111",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .hero-content {
          animation: heroFadeIn 1.2s ease both;
          text-align: center;
          padding: 120px 2.5rem 6rem;
          max-width: 760px;
          width: 100%;
        }
        .hero-ctas {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .hero-btn {
          display: inline-block;
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 14px 36px;
          border: 1px solid #EAE5DF;
          border-radius: 2px;
          background: transparent;
          color: #FFFFFF;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .hero-btn:hover {
          background: #EAE5DF;
          color: #111111;
        }
        @media (max-width: 480px) {
          .hero-content { padding: 100px 1.25rem 3rem; }
          .hero-ctas { flex-direction: column; align-items: center; }
          .hero-btn { width: 100%; max-width: 280px; }
        }
      `}</style>

      <div className="hero-content">
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            color: "#FFFFFF",
            fontSize: "clamp(3rem, 6vw, 5rem)",
            lineHeight: 1.05,
            margin: "0 0 1.5rem",
          }}
        >
          Considered aesthetics.
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            color: "#BFB5A8",
            fontSize: "1rem",
            margin: "0 0 2.5rem",
            lineHeight: 1.6,
          }}
        >
          [NUR'S TAGLINE HERE]
        </p>

        <div className="hero-ctas">
          <button
            className="hero-btn"
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
          >
            Nottingham
          </button>

          <a
            className="hero-btn"
            href={`${import.meta.env.BASE_URL}book`}
          >
            Book Now
          </a>

          <a
            className="hero-btn"
            href="#subscription"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("subscription")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Membership
          </a>
        </div>
      </div>
    </section>
  );
}
