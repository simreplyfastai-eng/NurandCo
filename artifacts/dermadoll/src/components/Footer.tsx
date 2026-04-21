import { useEffect, useState } from "react";

const SOCIAL = {
  instagram: [
    { handle: "@StarrFacess",      url: "https://instagram.com/StarrFacess" },
    { handle: "@StarrAestheticss", url: "https://instagram.com/StarrAestheticss" },
    { handle: "@StarrSuitess",     url: "https://instagram.com/StarrSuitess" },
    { handle: "@StarrNailedd",     url: "https://instagram.com/StarrNailedd" },
  ],
  tiktok: [
    { handle: "@StarrFacess",      url: "https://tiktok.com/@StarrFacess" },
    { handle: "@StarrAestheticss", url: "https://tiktok.com/@StarrAestheticss" },
    { handle: "@StarrSuitess",     url: "https://tiktok.com/@StarrSuitess" },
    { handle: "@StarrNailedd",     url: "https://tiktok.com/@StarrNailedd" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();
  const [, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  const navLinks = [
    { name: "SERVICES",  href: "#services" },
    { name: "LOCATIONS", href: "#locations" },
    { name: "TRAINING",  href: "#training" },
    { name: "BOOK NOW",  href: "#book" },
  ];

  const BASE = import.meta.env.BASE_URL;

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#") && href !== "#") {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (href === "#") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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

        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.15rem", color: "#5C1A1A", margin: "0 0 40px" }}>
          Beauty Redefined
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 28px", marginBottom: 40 }}>
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href === "#book" ? `${BASE}book` : link.href}
              onClick={(e) => link.href !== "#book" ? scrollTo(e, link.href) : undefined}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#737373", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#5C1A1A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
            >
              {link.name}
            </a>
          ))}
        </div>

        <div style={{ height: 1, background: "#E2DDD5", marginBottom: 28 }} />

        <div className="footer-social-block">

          <div className="footer-social-section">
            <span className="footer-social-label">Instagram</span>
            {SOCIAL.instagram.map((a) => (
              <a key={a.handle} href={a.url} target="_blank" rel="noopener noreferrer" className="footer-social-link">
                {a.handle}
              </a>
            ))}
          </div>

          <div className="footer-social-section">
            <span className="footer-social-label">TikTok</span>
            {SOCIAL.tiktok.map((a) => (
              <a key={a.handle} href={a.url} target="_blank" rel="noopener noreferrer" className="footer-social-link">
                {a.handle}
              </a>
            ))}
          </div>

          <div className="footer-social-section">
            <span className="footer-social-label">Email</span>
            <a href="mailto:starrbeautyyltd@gmail.com" className="footer-social-link">
              starrbeautyyltd@gmail.com
            </a>
          </div>

        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A96E", margin: 0 }}>
          © {year} Starr Aesthetics. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
