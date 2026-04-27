import { useState, useEffect, useRef } from "react";
import ConsultationModal from "./ConsultationModal";

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/objects/")) return `/api/media/serve?path=${encodeURIComponent(path)}`;
  return path;
}

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [heroSrc, setHeroSrc] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(`${import.meta.env.BASE_URL}eva-about.jpg`);
  const [consultOpen, setConsultOpen] = useState(false);

  useEffect(() => {
    fetch("/api/media/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.heroVideo) setHeroSrc(data.heroVideo);
        if (data?.heroImage) setHeroImage(mediaUrl(data.heroImage));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let dead = false;
    const tryPlay = () => {
      if (dead) return;
      v.muted = true; v.volume = 0;
      (v as HTMLVideoElement & { playsInline: boolean }).playsInline = true;
      v.play().catch(() => {});
    };
    v.addEventListener("canplay", tryPlay);
    v.addEventListener("canplaythrough", tryPlay);
    v.addEventListener("loadeddata", tryPlay);
    const t1 = setTimeout(tryPlay, 50);
    const t2 = setTimeout(tryPlay, 400);
    return () => {
      dead = true;
      clearTimeout(t1); clearTimeout(t2);
      v.removeEventListener("canplay", tryPlay);
      v.removeEventListener("canplaythrough", tryPlay);
      v.removeEventListener("loadeddata", tryPlay);
    };
  }, [heroSrc]);

  const scrollToServices = () => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <style>{`
        /* ── DESKTOP ── */
        .hero-wrap {
          display: flex;
          flex-direction: row;
          min-height: 100dvh;
          background: var(--brand-bg-alt);
        }
        .hero-left {
          flex: 1;
          background: var(--brand-bg-alt);
          display: flex;
          align-items: center;
          padding: 120px 64px 80px 80px;
          box-sizing: border-box;
        }
        .hero-right {
          flex: 1;
          background: #FFFFFF;
          position: relative;
          overflow: hidden;
        }
        .hero-mobile-gradient { display: none; }

        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-btn {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 14px 28px;
          cursor: pointer;
          transition: all 0.2s;
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .hero-wrap {
            flex-direction: column !important;
            min-height: 100dvh;
            background: var(--brand-bg-alt);
          }
          .hero-right {
            flex: unset !important;
            background: var(--brand-bg-alt) !important;
            height: 68dvh;
            min-height: 320px;
            max-height: 540px;
            overflow: visible !important;
            position: relative;
          }
          .hero-right img,
          .hero-right video {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: top center !important;
            display: block !important;
          }
          .hero-mobile-gradient {
            display: block !important;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 45%;
            background: linear-gradient(to bottom, transparent 0%, var(--brand-bg-alt) 100%);
            pointer-events: none;
            z-index: 2;
          }
          .hero-left {
            flex: unset !important;
            background: var(--brand-bg-alt) !important;
            padding: 0px 24px 52px !important;
            align-items: flex-start !important;
          }
          .hero-btns {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .hero-btn {
            width: 100% !important;
            text-align: center !important;
            padding: 16px 0 !important;
            box-sizing: border-box !important;
          }
          .h-chip button {
            width: 100% !important;
            box-sizing: border-box !important;
          }
        }

        @keyframes heroUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .h-ey   { animation: heroUp 0.8s ease 0.1s  both; }
        .h-h1   { animation: heroUp 0.8s ease 0.25s both; }
        .h-sub  { animation: heroUp 0.8s ease 0.4s  both; }
        .h-chip { animation: heroUp 0.8s ease 0.52s both; }
        .h-btns { animation: heroUp 0.8s ease 0.64s both; }
      `}</style>

      <section className="hero-wrap" id="home">

        {/* IMAGE PANEL — appears first in DOM = top on mobile (column flow) */}
        <div className="hero-right">
          {heroSrc ? (
            <video ref={videoRef} src={heroSrc} autoPlay loop muted playsInline preload="auto"
              disablePictureInPicture disableRemotePlayback
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : heroImage ? (
            <img src={heroImage} alt="Eva — Nur &amp; Co Aesthetics"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "#E8E2D9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 28, color: "var(--brand-accent)", opacity: 0.5 }}>Nur &amp; Co Aesthetics</span>
            </div>
          )}
          {/* Gradient fade — visible only on mobile */}
          <div className="hero-mobile-gradient" />
        </div>

        {/* TEXT PANEL — appears second in DOM = below image on mobile */}
        <div className="hero-left">
          <div style={{ maxWidth: 480, width: "100%" }}>

            <div className="h-ey" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ height: 1, width: 24, background: "var(--brand-accent)" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-accent)" }}>
                [LOCATION_1] &amp; [LOCATION_2]
              </span>
            </div>

            <h1 className="h-h1" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2.6rem, 5.5vw, 4.4rem)", fontWeight: 400, color: "var(--brand-primary)", lineHeight: 1.1, margin: "0 0 20px" }}>
              Welcome to<br />Nur &amp; Co Aesthetics
            </h1>

            <p className="h-sub" style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, lineHeight: 1.7, margin: "0 0 28px", maxWidth: 380 }}>
              <span style={{ color: "var(--brand-accent)" }}>Premium aesthetic & beauty treatments by Eva</span><br />
              <span style={{ color: "var(--brand-primary)" }}>Essex &amp; London</span>
            </p>

            <div className="h-chip" style={{ marginBottom: 24 }}>
              <button
                onClick={scrollToServices}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
                  border: "1px solid var(--brand-text)", background: "transparent", color: "var(--brand-text)",
                  padding: "10px 18px", cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-text)"; e.currentTarget.style.color = "var(--brand-bg-alt)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--brand-text)"; }}
              >
                SIGNATURE: NATURALÉLIPS™
              </button>
            </div>

            <div className="h-btns hero-btns">
              <button
                className="hero-btn"
                onClick={scrollToServices}
                style={{ border: "1px solid var(--brand-primary)", background: "transparent", color: "var(--brand-primary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-primary)"; e.currentTarget.style.color = "var(--brand-bg-alt)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--brand-primary)"; }}
              >
                VIEW TREATMENTS
              </button>
              <a
                className="hero-btn"
                href={`${import.meta.env.BASE_URL}book`}
                style={{ border: "1px solid var(--brand-accent)", background: "transparent", color: "var(--brand-text)", textDecoration: "none", display: "inline-block", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-accent)"; e.currentTarget.style.color = "var(--brand-text)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--brand-text)"; }}
              >
                BOOK NOW
              </a>
            </div>
          </div>
        </div>

      </section>

      {consultOpen && <ConsultationModal onClose={() => setConsultOpen(false)} />}
    </>
  );
}
