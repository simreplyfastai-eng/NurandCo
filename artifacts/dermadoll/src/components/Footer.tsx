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
      <div className="footer-inner" style={{ maxWidth: 1140, margin: "0 auto", padding: "72px 40px 40px" }}>

        {/* ── Main 3-column grid ── */}
        <div className="footer-grid">

          {/* LEFT — Brand */}
          <div className="footer-col footer-col--brand">
            <a
              href="#"
              onClick={(e) => scrollTo(e, "#")}
              style={{ textDecoration: "none", display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 4, marginBottom: 16 }}
            >
              <span className="footer-logo-name" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 600, letterSpacing: "0.02em", color: "#5C1A1A", lineHeight: 1 }}>
                STARR
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 400, color: "#C9A96E", lineHeight: 1 }}>
                BEAUTY
              </span>
            </a>

            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.1rem", color: "#5C1A1A", margin: "0 0 20px" }}>
              Beauty Redefined
            </p>

            <a
              href="mailto:[CLIENT_NAME]yltd@gmail.com"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#737373", textDecoration: "none", letterSpacing: "0.04em", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#5C1A1A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
            >
              [CLIENT_NAME]yltd@gmail.com
            </a>
          </div>

          {/* CENTRE — Nav */}
          <div className="footer-col footer-col--nav">
            <span className="footer-col-label">Navigate</span>
            <div className="footer-nav-links">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href === "#book" ? `${BASE}book` : link.href}
                  onClick={(e) => link.href !== "#book" ? scrollTo(e, link.href) : undefined}
                  className="footer-nav-link"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT — Socials */}
          <div className="footer-col footer-col--socials">
            <span className="footer-col-label">Follow Us</span>
            <div className="footer-social-grid">

              <div>
                <span className="footer-social-label">Instagram</span>
                {SOCIAL.instagram.map((a) => (
                  <a key={a.handle} href={a.url} target="_blank" rel="noopener noreferrer" className="footer-social-link">
                    {a.handle}
                  </a>
                ))}
              </div>

              <div>
                <span className="footer-social-label">TikTok</span>
                {SOCIAL.tiktok.map((a) => (
                  <a key={a.handle} href={a.url} target="_blank" rel="noopener noreferrer" className="footer-social-link">
                    {a.handle}
                  </a>
                ))}
              </div>

            </div>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A96E", margin: 0 }}>
            © {year} [CLIENT_NAME]. All rights reserved.
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            <span style={{ color: "#C9A96E" }}>Powered By </span>
            <a
              href="https://aesthetix-systems.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#A80000", textDecoration: "none", transition: "opacity 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              AESTHETIX
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}
