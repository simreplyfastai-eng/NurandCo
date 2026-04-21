const igAccounts = [
  { handle: "StarrFacess",      label: "Face Treatments",  url: "https://instagram.com/StarrFacess" },
  { handle: "StarrAestheticss", label: "Aesthetics",       url: "https://instagram.com/StarrAestheticss" },
  { handle: "StarrSuitess",     label: "The Suite",        url: "https://instagram.com/StarrSuitess" },
  { handle: "StarrNailedd",     label: "Nails",            url: "https://instagram.com/StarrNailedd" },
];

const ttAccounts = [
  { handle: "StarrFacess",      label: "Face Treatments",  url: "https://tiktok.com/@StarrFacess" },
  { handle: "StarrAestheticss", label: "Aesthetics",       url: "https://tiktok.com/@StarrAestheticss" },
  { handle: "StarrSuitess",     label: "The Suite",        url: "https://tiktok.com/@StarrSuitess" },
  { handle: "StarrNailedd",     label: "Nails",            url: "https://tiktok.com/@StarrNailedd" },
];

const IgIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const TtIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z"/>
  </svg>
);

function SocialPill({ handle, url, icon }: { handle: string; url: string; icon: "ig" | "tt" }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        border: "1px solid #DDD8D0",
        borderRadius: 999,
        textDecoration: "none",
        fontSize: 11.5,
        letterSpacing: "0.01em",
        color: "#5C1A1A",
        background: "rgba(255,255,255,0.55)",
        transition: "border-color 160ms ease, color 160ms ease, background 160ms ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#C9A96E";
        e.currentTarget.style.color = "#C9A96E";
        e.currentTarget.style.background = "rgba(201,169,110,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#DDD8D0";
        e.currentTarget.style.color = "#5C1A1A";
        e.currentTarget.style.background = "rgba(255,255,255,0.55)";
      }}
    >
      {icon === "ig" ? <IgIcon /> : <TtIcon />}
      @{handle}
    </a>
  );
}

function ColLabel({ children }: { children: string }) {
  return (
    <span style={{
      display: "block",
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: "0.18em",
      color: "#C9A96E",
      marginBottom: 10,
      fontFamily: "'Inter', sans-serif",
    }}>
      {children}
    </span>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  const navLinks = [
    { name: "SERVICES", href: "#services" },
    { name: "LOCATIONS", href: "#locations" },
    { name: "TRAINING", href: "#training" },
    { name: "BOOK NOW", href: "#book" },
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

        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.15rem", color: "#737373", margin: "0 0 40px" }}>
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

        <div style={{ fontFamily: "'Inter', sans-serif", marginBottom: 32 }}>

          {/* Paired grid: each row = one account, ig left | tt right */}
          <div style={{ display: "inline-block", textAlign: "left" }}>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginBottom: 10 }}>
              <ColLabel>Instagram</ColLabel>
              <ColLabel>TikTok</ColLabel>
            </div>

            {/* Account rows — flat array, grid auto-places pairs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
              {igAccounts.flatMap((a, i) => [
                <SocialPill key={"ig-" + a.handle} handle={a.handle} url={a.url} icon="ig" />,
                <SocialPill key={"tt-" + ttAccounts[i].handle} handle={ttAccounts[i].handle} url={ttAccounts[i].url} icon="tt" />,
              ])}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginTop: 24 }}>
            <ColLabel>Email</ColLabel>
            <a
              href="mailto:starrbeautyyltd@gmail.com"
              style={{ color: "#5C1A1A", fontSize: 13, textDecoration: "none", transition: "color 150ms ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A96E")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5C1A1A")}
            >
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
