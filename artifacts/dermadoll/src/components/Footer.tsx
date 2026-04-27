import { useEffect, useState } from "react";

const SOCIAL = {
  instagram: [
    { handle: "@nurandcoaesthetics", url: "https://instagram.com/nurandcoaesthetics" },
  ],
  tiktok: [
    { handle: "@nurandcoaesthetics", url: "https://tiktok.com/@nurandcoaesthetics" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();
  const [, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  const navLinks = [
    { name: "SERVICES",    href: "#services" },
    { name: "ABOUT",       href: "#about" },
    { name: "GALLERY",     href: "#gallery" },
    { name: "MEMBERSHIP",  href: "#subscription" },
    { name: "CONTACT",     href: "#contact" },
  ];

  const BASE = import.meta.env.BASE_URL;

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#") && href !== "#") {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    } else if (href === "#") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer style={{ background: "#F2EFE9", borderTop: "1px solid #BFB5A8" }}>
      <div className="footer-inner" style={{ maxWidth: 1140, margin: "0 auto", padding: "72px 2.5rem 40px" }}>

        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-col footer-col--brand">
            <a
              href="#"
              onClick={(e) => scrollTo(e, "#")}
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "baseline",
                gap: "0.5ch",
                marginBottom: "1.25rem",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: "0.8125rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#1A1917",
              }}
            >
              NUR &amp; CO
              <span style={{ opacity: 0.4 }}>/</span>
              AESTHETICS
            </a>

            <a
              href="mailto:nurandcoaesthetics@gmail.com"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: "0.8125rem",
                color: "#6B6560",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1917")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6560")}
            >
              nurandcoaesthetics@gmail.com
            </a>
          </div>

          {/* Nav */}
          <div className="footer-col footer-col--nav">
            <span className="footer-col-label">Navigate</span>
            <div className="footer-nav-links">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => scrollTo(e, link.href)}
                  className="footer-nav-link"
                >
                  {link.name}
                </a>
              ))}
              <a
                href={`${BASE}book`}
                className="footer-nav-link"
              >
                BOOK NOW
              </a>
            </div>
          </div>

          {/* Socials */}
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

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#BFB5A8", margin: 0 }}>
            © {year} Nur &amp; Co Aesthetics. All rights reserved.
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            <span style={{ color: "#BFB5A8" }}>Powered By </span>
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
