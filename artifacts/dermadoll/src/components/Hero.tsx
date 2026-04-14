import { useEffect, useRef, useState } from "react";
import ConsultationModal from "./ConsultationModal";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; r: number; vy: number; opacity: number; }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 38; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 0.5,
        vy: -(Math.random() * 0.5 + 0.2),
        opacity: Math.random() * 0.7 + 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,134,10,${p.opacity})`;
        ctx.fill();
        p.y += p.vy;
        p.opacity -= 0.001;
        if (p.y < -10 || p.opacity <= 0) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
          p.opacity = Math.random() * 0.7 + 0.15;
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 3,
      }}
    />
  );
}

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/objects/"))
    return `/api/media/serve?path=${encodeURIComponent(path)}`;
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
    const tryPlay = () => {
      video.muted = true;
      video.playsInline = true;
      const p = video.play();
      if (p) p.catch(() => {});
    };
    tryPlay();
    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tryPlay(); });
    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, [heroSrc]);

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section id="home" style={{ minHeight: "100dvh", display: "flex", flexDirection: "row" }} className="hero-wrap">
        <style>{`
          /* Desktop: content left, image right */
          .hero-left  { order: 1; min-height: 100dvh; }
          .hero-right { order: 2; min-height: 100dvh; }
          .hero-divider { order: 3; min-height: 100dvh; }
          @media (max-width: 768px) {
            .hero-wrap { flex-direction: column !important; }
            .hero-left {
              order: 2;
              width: 100% !important;
              min-height: auto !important;
              padding: 36px 24px 60px !important;
              align-items: flex-start !important;
            }
            .hero-right {
              order: 1;
              width: 100% !important;
              height: 58vw !important;
              min-height: 280px !important;
              max-height: 380px !important;
            }
            .hero-divider { display: none !important; }
            .hero-eyebrow { gap: 8px !important; }
            .hero-line { display: none !important; }
            .hero-btns {
              flex-direction: column !important;
              width: 100% !important;
            }
            .hero-btn-1, .hero-btn-2 {
              width: 100% !important;
              text-align: center !important;
              justify-content: center !important;
            }
          }
          @keyframes pulseDot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.4); }
          }
          @keyframes heroFadeUp {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes heroFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes watermarkFloat {
            0%   { transform: translateY(0px); }
            50%  { transform: translateY(-12px); }
            100% { transform: translateY(0px); }
          }
          @keyframes lineGrow {
            from { width: 0px; opacity: 0; }
            to   { width: 22px; opacity: 0.5; }
          }
          .hero-eyebrow   { animation: heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
          .hero-h1-line1  { animation: heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.35s both; }
          .hero-h1-line2  { animation: heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.55s both; }
          .hero-body      { animation: heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.7s both; }
          .hero-btn-1     { animation: heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.88s both; }
          .hero-btn-2     { animation: heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 1.0s both; }
          .hero-watermark { animation: heroFadeIn 1.8s ease 0.4s both, watermarkFloat 7s ease-in-out 2.2s infinite; }
          .hero-line      { animation: lineGrow 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        `}</style>

        {/* LEFT — content (order:1 via CSS on desktop, order:2 on mobile) */}
        <div
          className="hero-left"
          style={{
            width: "50%",
            background: "linear-gradient(145deg, #fdf9f3 0%, #FAF7F2 45%, #f3ede2 100%)",
            display: "flex",
            alignItems: "center",
            padding: "48px 64px 80px",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Large decorative serif watermark — "FACE BY NIAMH" stacked */}
          <div aria-hidden="true" className="hero-watermark" style={{
            position: "absolute",
            bottom: 0,
            left: -6,
            right: 0,
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "clamp(96px, 15vw, 220px)",
            color: "rgba(200,134,10,0.07)",
            lineHeight: 0.9,
            pointerEvents: "none",
            userSelect: "none",
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
          }}>
            FACE<br />BY<br />NIAMH
          </div>
          {/* Subtle amber glow top right */}
          <div aria-hidden="true" style={{
            position: "absolute",
            top: -40,
            right: 0,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,134,10,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ maxWidth: 520 }}>
            {/* Eyebrow */}
            <div className="hero-eyebrow" style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#C8860A",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <div className="hero-line" style={{ height: 1, width: 22, background: "#C8860A" }} />
              LEEDS / WAKEFIELD
              <div className="hero-line" style={{ height: 1, width: 22, background: "#C8860A" }} />
            </div>

            {/* H1 */}
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)",
              fontWeight: 600,
              color: "#1A0F00",
              lineHeight: 1.1,
              margin: "0 0 28px",
            }}>
              <span className="hero-h1-line1" style={{ display: "block" }}>Natural Aesthetics.</span>
              <em className="hero-h1-line2" style={{ display: "block", color: "#C8860A", fontStyle: "italic" }}>Confident Results.</em>
            </h1>

            {/* Body */}
            <p className="hero-body" style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              color: "#6B6260",
              lineHeight: 1.75,
              margin: "0 0 40px",
              maxWidth: 420,
            }}>
              Advanced aesthetics treatments in Leeds and Wakefield — delivered with care, precision, and a commitment to natural results.
            </p>

            {/* Buttons */}
            <div className="hero-btns" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button
                className="hero-btn-1"
                onClick={scrollToServices}
                style={{
                  background: "transparent",
                  border: "1px solid #1A0F00",
                  color: "#1A0F00",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  padding: "14px 28px",
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1A0F00"; e.currentTarget.style.color = "#FAF7F2"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1A0F00"; }}
              >
                View Treatments
              </button>
              <button
                className="hero-btn-2"
                onClick={() => setConsultOpen(true)}
                style={{
                  background: "#1A0F00",
                  border: "1px solid #1A0F00",
                  color: "#FAF7F2",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  padding: "14px 28px",
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                Book a Consultation
              </button>
            </div>
          </div>
        </div>

        {/* Thin amber divider between panels */}
        <div aria-hidden="true" className="hero-divider" style={{
          width: 1,
          background: "linear-gradient(180deg, transparent 0%, rgba(200,134,10,0.35) 20%, rgba(200,134,10,0.5) 50%, rgba(200,134,10,0.35) 80%, transparent 100%)",
          flexShrink: 0,
          zIndex: 5,
        }} />

        {/* RIGHT — image (order:2 via CSS on desktop, order:1 on mobile) */}
        <div
          className="hero-right"
          style={{
            width: "50%",
            background: "#1A0F00",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Media */}
          {heroSrc ? (
            <video
              ref={videoRef}
              src={heroSrc}
              loop
              muted
              playsInline
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
            />
          ) : heroImage ? (
            <>
              <img
                src={heroImage}
                alt="Face By Niamh clinic"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
              />
              {/* Dark overlay so particles + branding stay legible */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(160deg, rgba(26,15,0,0.55) 0%, rgba(26,15,0,0.35) 60%, rgba(26,15,0,0.5) 100%)",
                zIndex: 2,
              }} />
            </>
          ) : (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(160deg, #2a1800 0%, #1A0F00 50%, #3d2200 100%)",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{ textAlign: "center", opacity: 0.3 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 32, color: "#C8860A", marginBottom: 8 }}>Face By Niamh</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "4px", textTransform: "uppercase", color: "#C8860A" }}>Aesthetics</div>
              </div>
            </div>
          )}

          {/* Particle overlay */}
          <ParticleCanvas />

          {/* @facebyniamh label */}
          <div style={{
            position: "absolute",
            bottom: 28,
            left: 24,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#C8860A",
              animation: "pulseDot 2s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              letterSpacing: "1.5px",
              color: "rgba(255,255,255,0.75)",
              textTransform: "uppercase",
            }}>
              @facebyniamh
            </span>
          </div>
        </div>
      </section>

      {consultOpen && <ConsultationModal onClose={() => setConsultOpen(false)} />}
    </>
  );
}
