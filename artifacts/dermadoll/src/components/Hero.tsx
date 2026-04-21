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
  const [heroImage, setHeroImage] = useState<string | null>(`${import.meta.env.BASE_URL}hero-room.jpg`);
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
  const scrollToBook = () => document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <style>{`
        .hero-wrap { display: flex; flex-direction: row; min-height: 100dvh; }
        .hero-left { flex: 1; background: #F5F0EB; display: flex; align-items: center; padding: 120px 64px 80px 80px; box-sizing: border-box; }
        .hero-right { flex: 1; background: #FFFFFF; position: relative; overflow: hidden; }
        @media (max-width: 768px) {
          .hero-wrap { flex-direction: column !important; }
          .hero-left { padding: 100px 28px 48px !important; }
          .hero-right { min-height: 60vw; max-height: 480px; }
        }
        @keyframes heroUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .h-ey { animation: heroUp 0.8s ease 0.1s both; }
        .h-h1 { animation: heroUp 0.8s ease 0.25s both; }
        .h-sub { animation: heroUp 0.8s ease 0.4s both; }
        .h-chip { animation: heroUp 0.8s ease 0.52s both; }
        .h-btns { animation: heroUp 0.8s ease 0.64s both; }
      `}</style>

      <section className="hero-wrap" id="home">

        <div className="hero-left">
          <div style={{ maxWidth: 480 }}>

            <div className="h-ey" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <div style={{ height: 1, width: 24, background: "#C9A96E" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>
                Hornchurch &amp; Marylebone
              </span>
            </div>

            <h1 className="h-h1" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2.6rem, 5.5vw, 4.4rem)", fontWeight: 400, color: "#5C1A1A", lineHeight: 1.1, margin: "0 0 20px" }}>
              Welcome to<br />Starr Aesthetics
            </h1>

            <p className="h-sub" style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#737373", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 380 }}>
              Premium aesthetics treatments by Eva —<br />Essex &amp; London
            </p>

            <div className="h-chip" style={{ marginBottom: 28 }}>
              <button
                onClick={scrollToServices}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
                  border: "1px solid #3D3D3D", background: "transparent", color: "#3D3D3D",
                  padding: "9px 18px", cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#3D3D3D"; e.currentTarget.style.color = "#F5F0EB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3D3D3D"; }}
              >
                SIGNATURE: NATURALÉLIPS™
              </button>
            </div>

            <div className="h-btns" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={scrollToServices}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
                  border: "1px solid #5C1A1A", background: "transparent", color: "#5C1A1A",
                  padding: "14px 28px", cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#5C1A1A"; e.currentTarget.style.color = "#F5F0EB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5C1A1A"; }}
              >
                VIEW TREATMENTS
              </button>
              <button
                onClick={scrollToBook}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
                  border: "1px solid #C9A96E", background: "transparent", color: "#3D3D3D",
                  padding: "14px 28px", cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#C9A96E"; e.currentTarget.style.color = "#3D3D3D"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3D3D3D"; }}
              >
                BOOK NOW
              </button>
            </div>
          </div>
        </div>

        <div className="hero-right">
          {heroSrc ? (
            <video ref={videoRef} src={heroSrc} loop muted playsInline
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : heroImage ? (
            <img src={heroImage} alt="Starr Aesthetics — Hornchurch & Marylebone"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "#E8E2D9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 28, color: "#C9A96E", opacity: 0.5 }}>Starr Aesthetics</span>
            </div>
          )}
        </div>
      </section>

      {consultOpen && <ConsultationModal onClose={() => setConsultOpen(false)} />}
    </>
  );
}
