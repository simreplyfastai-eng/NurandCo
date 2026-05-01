import { useEffect, useState } from "react";

function mediaUrl(path){if(!path)return null;if(path.startsWith("/objects/"))return `/api/media/serve?path=${encodeURIComponent(path)}`;return path;}

export default function Hero() {
  const [heroVideo, setHeroVideo] = useState(null);
  const [heroImage, setHeroImage] = useState(null);
  const [heroType, setHeroType] = useState('image');
  const [heroText, setHeroText] = useState({
    headline: 'Considered aesthetics.',
    subtitle: 'Precision aesthetics. Confident results.',
    locationLabel: 'NOTTINGHAM',
  });
  useEffect(() => {
    fetch('/api/hero/config')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setHeroText(d); })
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetch('/api/media/config')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        if (d.heroVideo) { setHeroVideo(mediaUrl(d.heroVideo)); setHeroType('video'); }
        else if (d.heroImage || d.heroSrc) { setHeroImage(mediaUrl(d.heroImage || d.heroSrc)); setHeroType('image'); }
      })
      .catch(() => {});
  }, []);
  return (
    <section
      id="home"
      style={{
        background: "#E5E4E2",
        minHeight: "100dvh",
        position: "relative",
        overflow: "hidden",
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
          border: 1px solid #3D3935;
          border-radius: 2px;
          background: #3D3935;
          color: #FFFFFF;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .hero-btn--label { cursor: default; pointer-events: none; }
        .hero-btn--label:hover { background: transparent !important; color: inherit !important; }
        .hero-btn:hover {
          background: #2A2724;
          color: #FFFFFF;
        }
        @media (max-width: 480px) {
          .hero-content { padding: 100px 1.25rem 3rem; }
          .hero-ctas { flex-direction: column; align-items: center; }
          .hero-btn { width: 100%; max-width: 280px; }
        }
      `}</style>

      {(heroVideo || heroImage) && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {heroType === 'video' && heroVideo ? (
            <video src={heroVideo} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : heroImage ? (
            <img src={heroImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(229,228,226,0.15) 0%, rgba(229,228,226,0.55) 100%)" }} />
        </div>
      )}

      <div className="hero-content" style={{ position: "relative", zIndex: 1 }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            color: "#0E0D0B",
            fontSize: "clamp(3rem, 6vw, 5rem)",
            lineHeight: 1.05,
            margin: "0 0 1.5rem",
          }}
        >
          {heroText.headline}
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            color: "#E8E5DD",
            fontSize: "1rem",
            margin: "0 0 2.5rem",
            lineHeight: 1.6,
          }}
        >
          {heroText.subtitle}
        </p>

        <div className="hero-ctas">
          <span className="hero-btn hero-btn--label">{heroText.locationLabel}</span>

          <a className="hero-btn" href="/book">
            Book Now
          </a>
        </div>
      </div>
    </section>
  );
}
