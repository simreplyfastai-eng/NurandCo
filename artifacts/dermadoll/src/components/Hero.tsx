import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [heroSrc, setHeroSrc] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/media/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.heroVideo) setHeroSrc(data.heroVideo);
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
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    const onVisible = () => { if (!document.hidden) tryPlay(); };
    document.addEventListener("visibilitychange", onVisible);

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) tryPlay(); },
      { threshold: 0.1 },
    );
    observer.observe(video);

    const userGesture = () => { tryPlay(); window.removeEventListener("touchstart", userGesture); };
    window.addEventListener("touchstart", userGesture, { once: true, passive: true });

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", onVisible);
      observer.disconnect();
    };
  }, [heroSrc]);

  const defaultSrc = `${import.meta.env.BASE_URL}hero.mp4`;

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 w-full h-full z-0" style={{ background: "#1A0F00" }}>
        <video
          ref={videoRef}
          key={heroSrc ?? "default"}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          {...{ "webkit-playsinline": "true" } as any}
          className="absolute inset-0 w-full h-full object-cover object-top md:object-[center_35%]"
          style={{ pointerEvents: "none" }}
        >
          <source src={heroSrc ?? defaultSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: "rgba(26,15,0,0.58)" }} />
        <div className="absolute inset-x-0 bottom-0 h-2/5" style={{ background: "linear-gradient(to top, rgba(26,15,0,0.95), transparent)" }} />
      </div>

      <div className="relative z-10 text-center px-6 flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
        {/* Brand lockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center mb-8"
        >
          <span
            className="font-serif italic font-light text-white leading-none"
            style={{ fontSize: "clamp(1.5rem, 6vw, 3.5rem)", opacity: 0.95 }}
          >
            Face
          </span>
          <span
            className="font-sans uppercase font-medium tracking-[0.5em] leading-none my-1"
            style={{ fontSize: "clamp(0.55rem, 1.6vw, 0.8rem)", color: "#C8860A", letterSpacing: "0.55em" }}
          >
            BY
          </span>
          <span
            className="font-serif font-bold text-white leading-none"
            style={{ fontSize: "clamp(3rem, 13vw, 8rem)", textShadow: "0 0 40px rgba(200,134,10,0.25)" }}
          >
            Niamh
          </span>
          <span
            className="font-sans uppercase font-light tracking-[0.45em] mt-2 text-white/60 leading-none"
            style={{ fontSize: "clamp(0.5rem, 1.4vw, 0.75rem)" }}
          >
            AESTHETICS
          </span>
        </motion.div>

        {/* Amber divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.7, ease: "easeInOut" }}
          className="mb-6"
          style={{ width: "40px", height: "1px", background: "#C8860A", transformOrigin: "left" }}
        />

        {/* Tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          className="font-serif text-white font-light leading-tight mb-4"
          style={{ fontSize: "clamp(1.4rem, 4.5vw, 3rem)" }}
        >
          Natural Aesthetics. Confident Results.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="font-sans font-light text-white/75 max-w-xl mx-auto mb-12"
          style={{ fontSize: "clamp(0.85rem, 2vw, 1rem)", lineHeight: 1.7 }}
        >
          Advanced aesthetics treatments in Leeds and Wakefield — delivered with care, precision, and a commitment to natural results.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto"
        >
          <a
            href="#services"
            className="w-full sm:w-auto font-sans text-[11px] tracking-[0.22em] uppercase font-medium px-8 py-4 border border-white/70 text-white transition-all duration-300"
            style={{ background: "transparent" }}
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" });
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            View Treatments
          </a>
          <a
            href="#treatments"
            className="w-full sm:w-auto font-sans text-[11px] tracking-[0.22em] uppercase font-medium px-8 py-4 transition-all duration-300"
            style={{ background: "#C8860A", color: "#FAF7F2", border: "1px solid #C8860A" }}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("treatments")?.scrollIntoView({ behavior: "smooth" });
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#b8780a"; e.currentTarget.style.borderColor = "#b8780a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#C8860A"; e.currentTarget.style.borderColor = "#C8860A"; }}
          >
            Book a Consultation
          </a>
        </motion.div>

        {/* Location */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="font-sans mt-10 text-white/40"
          style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase" }}
        >
          Leeds · Wakefield
        </motion.p>
      </div>
    </section>
  );
}
