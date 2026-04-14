import { useState, useCallback, useEffect } from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [clickCount, setClickCount] = useState(0);
  const [lastClick, setLastClick] = useState(0);
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.whatsapp) setWhatsapp(d.whatsapp); })
      .catch(() => {});
  }, []);

  const handleSecretClick = useCallback(() => {
    const now = Date.now();
    const fresh = now - lastClick < 3000;
    const next = fresh ? clickCount + 1 : 1;
    setClickCount(next);
    setLastClick(now);
    if (next >= 5) {
      setClickCount(0);
      window.location.href = "/portal.html";
    }
  }, [clickCount, lastClick]);

  const navLinks = [
    { name: "HOME", href: "#" },
    { name: "TREATMENTS", href: "#services" },
    { name: "ABOUT", href: "#about" },
    { name: "PACKAGES", href: "#packages" },
    { name: "PRICING", href: "#pricing" },
    { name: "CONTACT", href: "#contact" },
  ];

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === "#") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer
      style={{
        background: "#FAF7F2",
        color: "#1C1C1E",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorative watermark */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: "clamp(140px, 22vw, 280px)",
          color: "rgba(201,169,110,0.1)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        Niamh
      </div>

      {/* Ambient glow blobs */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "10%",
          left: "-8%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "#C9A96E",
          filter: "blur(100px)",
          opacity: 0.08,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "5%",
          right: "-5%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "#C9A96E",
          filter: "blur(90px)",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />

      {/* Top rule */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.5), transparent)" }} />

      <div className="container mx-auto px-6 max-w-5xl" style={{ position: "relative", zIndex: 1, paddingTop: 72, paddingBottom: 40 }}>

        {/* Logo + tagline */}
        <div className="flex flex-col items-center" style={{ marginBottom: 52 }}>
          <div className="flex flex-col items-center leading-none" style={{ gap: 3, marginBottom: 20 }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 22,
              fontWeight: 300,
              color: "rgba(28,28,30,0.8)",
              letterSpacing: "0.02em",
            }}>
              Face
            </span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 9,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: "#C9A96E",
            }}>
              BY
            </span>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 34,
              fontWeight: 700,
              color: "#1C1C1E",
              letterSpacing: "0.01em",
              lineHeight: 1,
            }}>
              Niamh
            </span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 8,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              fontWeight: 300,
              color: "rgba(28,28,30,0.35)",
            }}>
              AESTHETICS
            </span>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ height: 1, width: 40, background: "linear-gradient(90deg, transparent, #C9A96E)" }} />
            <span style={{ color: "#C9A96E", fontSize: 12 }}>✦</span>
            <div style={{ height: 1, width: 40, background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
          </div>

          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "1.25rem",
              color: "#C9A96E",
              marginBottom: 12,
              cursor: "default",
              userSelect: "none",
              textAlign: "center",
            }}
            onClick={handleSecretClick}
          >
            Natural Aesthetics. Confident Results.
          </p>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(28,28,30,0.4)",
            marginBottom: 28,
          }}>
            Leeds · Wakefield
          </p>

          {/* Social links */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a
              href="https://instagram.com/facebyniamh"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "rgba(28,28,30,0.5)",
                textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#C9A96E"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(28,28,30,0.5)"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @facebyniamh
            </a>

            <div style={{ width: 1, height: 16, background: "rgba(28,28,30,0.12)" }} />

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "rgba(28,28,30,0.5)",
                  textDecoration: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#C9A96E"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(28,28,30,0.5)"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Nav links */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px 32px",
            marginBottom: 36,
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => scrollTo(e, link.href)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(28,28,30,0.4)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#C9A96E"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(28,28,30,0.4)"}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#E2DDD5", marginBottom: 24 }} />

        {/* Legal */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: "rgba(28,28,30,0.5)",
          fontWeight: 300,
          letterSpacing: "0.04em",
        }}>
          <p style={{ margin: 0 }}>&copy; {currentYear} Face By Niamh Aesthetics. All rights reserved.</p>
          <p style={{ margin: 0, textAlign: "right", maxWidth: 360 }}>
            Results may vary. Treatments performed by a qualified aesthetics practitioner.
          </p>
        </div>

        <div style={{
          textAlign: "center",
          paddingTop: 20,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 9,
          color: "rgba(28,28,30,0.35)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}>
          Powered by{" "}
          <a
            href="https://aesthetix-systems.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#C9A96E", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#B8946A"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#C9A96E"}
          >
            AESTHETIX
          </a>
        </div>
      </div>
    </footer>
  );
}
