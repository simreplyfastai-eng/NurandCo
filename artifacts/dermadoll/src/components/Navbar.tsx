import { useState, useEffect } from "react";
import { Menu, X, Lock } from "lucide-react";

const goToPortal = () => {
  window.location.href = `${import.meta.env.BASE_URL}portal.html`;
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const textColor = "#0E0D0B";
  const bg = scrolled ? "#FFFFFF" : "transparent";
  const borderColor = scrolled ? "#E8E5DD" : "transparent";

  const links = [
    { label: "SERVICES", href: "#services" },
    { label: "ABOUT", href: "#about" },
    { label: "GALLERY", href: "#gallery" },
    { label: "TREATMENTS", href: "#treatments" },
    { label: "CONTACT", href: "#contact" },
  ];

  const scrollTo = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    if (href === "#") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        .nav-root {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          transition: background 0.2s ease, border-color 0.2s ease;
          border-bottom: 1px solid transparent;
        }
        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2.5rem;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          text-decoration: none;
          display: flex;
          align-items: baseline;
          gap: 0.5ch;
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          font-size: 0.8125rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .nav-logo-sep {
          opacity: 0.4;
        }
        .nav-hamburger {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          transition: opacity 0.2s;
        }
        .nav-hamburger:hover { opacity: 0.6; }
        /* Mobile drawer */
        .nav-drawer {
          position: fixed;
          inset: 0;
          z-index: 49;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .nav-drawer.closed {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-8px);
        }
        .nav-drawer.open {
          opacity: 1;
          pointer-events: all;
          transform: translateY(0);
        }
        .nav-drawer-link {
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          font-size: 0.8125rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #FFFFFF;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-drawer-link:hover { color: #E8E5DD; }
        .nav-drawer-book {
          display: inline-block;
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #FFFFFF;
          border: 1px solid #FFFFFF;
          border-radius: 2px;
          padding: 14px 36px;
          text-decoration: none;
          background: transparent;
          transition: background 0.2s, color 0.2s;
          cursor: pointer;
        }
        .nav-drawer-book:hover { background: #FFFFFF; color: #0E0D0B; }
        @media (max-width: 767px) {
          .nav-inner { padding: 0 1.25rem; }
        }
      `}</style>

      <nav
        className="nav-root"
        style={{ background: bg, borderColor }}
      >
        <div className="nav-inner">
          <a
            href="#"
            className="nav-logo"
            style={{ color: textColor }}
            onClick={(e) => scrollTo(e, "#")}
          >
            NUR &amp; CO
            <span className="nav-logo-sep">/</span>
            AESTHETICS
          </a>

          <button
            className="nav-hamburger"
            style={{ color: textColor }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen
              ? <X size={22} color={textColor} />
              : <Menu size={22} color={textColor} />}
          </button>
        </div>
      </nav>

      <div className={`nav-drawer ${menuOpen ? "open" : "closed"}`}>
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="nav-drawer-link"
            onClick={(e) => scrollTo(e, link.href)}
          >
            {link.label}
          </a>
        ))}
        <a
          href={`${import.meta.env.BASE_URL}book`}
          className="nav-drawer-book"
        >
          BOOK NOW
        </a>
        <button
          onClick={() => { setMenuOpen(false); goToPortal(); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "'Inter', sans-serif", fontWeight: 300,
            fontSize: "0.625rem", letterSpacing: "0.2em",
            color: "#5A5248", textTransform: "uppercase",
          }}
        >
          <Lock size={11} />
          Admin
        </button>
      </div>
    </>
  );
}
