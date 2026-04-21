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
    const video = videoRef.current;
    if (!video) return;
    const tryPlay = () => { video.muted = true; video.playsInline = true; const p = video.play(); if (p) p.catch(() => {}); };
    tryPlay();
    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    return () => { video.removeEventListener("loadedmetadata", tryPlay); video.removeEventListener("canplay", tryPlay); };
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
          background: #F5F0EB;
        }
        .hero-left {
          flex: 1;
          background: #F5F0EB;
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
            background: #F5F0EB;
          }
          .hero-right {
            flex: unset !important;
            background: #F5F0EB !important;
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
            background: linear-gradient(to bottom, transparent 0%, #F5F0EB 100%);
            pointer-events: none;
            z-index: 2;
          }
          .hero-left {
            flex: unset !important;
            background: #F5F0EB !important;
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
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : heroImage ? (
            <img src={heroImage} alt="Eva — Starr Aesthetics"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "#E8E2D9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 28, color: "#C9A96E", opacity: 0.5 }}>Starr Aesthetics</span>
            </div>
          )}
          {/* Gradient fade — visible only on mobile */}
          <div className="hero-mobile-gradient" />
        </div>

        {/* TEXT PANEL — appears second in DOM = below image on mobile */}
        <div className="hero-left">
          <div style={{ maxWidth: 480, width: "100%" }}>

            <div className="h-ey" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ height: 1, width: 24, background: "#C9A96E" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>
                Hornchurch &amp; Marylebone
              </span>
            </div>

            <h1 className="h-h1" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2.6rem, 5.5vw, 4.4rem)", fontWeight: 400, color: "#5C1A1A", lineHeight: 1.1, margin: "0 0 20px" }}>
              Welcome to<br />Starr Aesthetics
            </h1>

            <p className="h-sub" style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, lineHeight: 1.7, margin: "0 0 28px", maxWidth: 380 }}>
              <span style={{ color: "#C9A96E" }}>Premium aesthetics treatments by Eva</span><br />
              <span style={{ color: "#5C1A1A" }}>Essex &amp; London</span>
            </p>

            <div className="h-chip" style={{ marginBottom: 24 }}>
              <button
                onClick={scrollToServices}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
                  border: "1px solid #3D3D3D", background: "transparent", color: "#3D3D3D",
                  padding: "10px 18px", cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#3D3D3D"; e.currentTarget.style.color = "#F5F0EB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3D3D3D"; }}
              >
                SIGNATURE: NATURALÉLIPS™
              </button>
            </div>

            <div className="h-btns hero-btns">
              <button
                className="hero-btn"
                onClick={scrollToServices}
                style={{ border: "1px solid #5C1A1A", background: "transparent", color: "#5C1A1A" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#5C1A1A"; e.currentTarget.style.color = "#F5F0EB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5C1A1A"; }}
              >
                VIEW TREATMENTS
              </button>
              <a
                className="hero-btn"
                href={`${import.meta.env.BASE_URL}book`}
                style={{ border: "1px solid #C9A96E", background: "transparent", color: "#3D3D3D", textDecoration: "none", display: "inline-block", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#C9A96E"; e.currentTarget.style.color = "#3D3D3D"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3D3D3D"; }}
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
