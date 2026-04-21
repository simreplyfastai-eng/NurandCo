export default function Footer() {
  const year = new Date().getFullYear();

  const navLinks = [
    { name: "SERVICES", href: "#services" },
    { name: "LOCATIONS", href: "#locations" },
    { name: "TRAINING", href: "#training" },
    { name: "BOOK NOW", href: "#book" },
  ];

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === "#") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer style={{ background: "#F5F0EB", borderTop: "1px solid #E2DDD5" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 32px 40px", textAlign: "center" }}>

        <a href="#" onClick={(e) => scrollTo(e, "#")} style={{ textDecoration: "none", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 600, letterSpacing: "0.02em", color: "#5C1A1A", lineHeight: 1 }}>
            STARR
          </span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 400, color: "#C9A96E", lineHeight: 1 }}>
            AESTHETICS
          </span>
        </a>

        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.15rem", color: "#737373", margin: "0 0 40px" }}>
          Beauty Redefined
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 28px", marginBottom: 40 }}>
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => scrollTo(e, link.href)}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#737373", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#5C1A1A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
            >
              {link.name}
            </a>
          ))}
        </div>

        <div style={{ height: 1, background: "#E2DDD5", marginBottom: 28 }} />

        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#737373", lineHeight: 2, marginBottom: 32 }}>
          <div>
            Instagram:{" "}
            <a href="https://instagram.com/starraestheticss" target="_blank" rel="noopener noreferrer"
              style={{ color: "#5C1A1A", textDecoration: "none" }}>
              @starraestheticss
            </a>
          </div>
          <div>
            Website:{" "}
            <a href="https://www.starrbeautyy.co.uk" target="_blank" rel="noopener noreferrer"
              style={{ color: "#5C1A1A", textDecoration: "none" }}>
              www.starrbeautyy.co.uk
            </a>
          </div>
          <div>
            Email:{" "}
            <a href="mailto:starrbeautyyltd@gmail.com"
              style={{ color: "#5C1A1A", textDecoration: "none" }}>
              starrbeautyyltd@gmail.com
            </a>
          </div>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B0A898", margin: 0 }}>
          © {year} Starr Aesthetics. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
