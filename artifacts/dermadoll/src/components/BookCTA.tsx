export default function BookCTA() {
  return (
    <section
      id="book-cta"
      style={{
        background: "#111111",
        padding: "6rem 2.5rem",
        textAlign: "center",
      }}
    >
      <style>{`
        @media (max-width: 480px) {
          section#book-cta { padding: 3rem 1.25rem; }
        }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <p
          className="eyebrow"
          style={{ color: "#BFB5A8", marginBottom: "1.25rem" }}
        >
          READY TO BEGIN
        </p>

        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
            color: "#FFFFFF",
            margin: "0 0 2.5rem",
            lineHeight: 1.1,
          }}
        >
          Book your consultation.
        </h2>

        <a
          href={`${import.meta.env.BASE_URL}book`}
          className="btn-primary btn-primary--light"
        >
          Book Now
        </a>
      </div>
    </section>
  );
}
