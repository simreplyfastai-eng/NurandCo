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
      video.play().catch(() => {});
    };

    tryPlay();
    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tryPlay();
    });

    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, [heroSrc]);

  const defaultSrc = `${import.meta.env.BASE_URL}hero.mp4`;

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-[#1a1a1a] to-[#2d2520]">
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
        >
          <source src={heroSrc ?? defaultSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-x-0 bottom-0 h-2/5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent)" }} />
      </div>

      <div className="relative z-10 text-center px-6 flex flex-col items-center justify-center w-full max-w-5xl mx-auto py-28 md:py-0">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="flex flex-col items-center mb-10 md:mb-12"
        >
          <span
            className="font-serif tracking-[0.18em] font-bold leading-none text-white text-[clamp(1.8rem,10.5vw,8rem)] md:text-[96px]"
            style={{
              textShadow: "0 0 30px rgba(201,169,110,0.3), 0 0 60px rgba(201,169,110,0.12)",
            }}
          >
            DERMADOLL
          </span>
          <span
            className="font-sans text-sm md:text-[14px] tracking-[0.45em] md:tracking-[8px] font-light mt-4 md:mt-[8px] text-white/85"
            style={{ textShadow: "0 0 15px rgba(201,169,110,0.2)" }}
          >
            AESTHETICS
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.45 }}
          className="mb-8 md:mb-4 relative inline-block"
        >
          <h1
            className="font-serif text-[1.85rem] md:text-[52px] text-white font-medium leading-tight"
            style={{ textShadow: "0 0 20px rgba(201,169,110,0.2), 0 0 40px rgba(201,169,110,0.08)" }}
          >
            Redefining Natural Beauty
          </h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 1.1, ease: "easeInOut" }}
            className="h-[1px] bg-primary w-full absolute -bottom-2 left-0 origin-left"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="text-white/85 font-light text-base md:text-[16px] max-w-2xl mx-auto mb-14 md:mb-12"
          style={{ textShadow: "0 0 15px rgba(201,169,110,0.15)" }}
        >
          Premium aesthetics treatments in Birmingham & Solihull
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="flex flex-col sm:flex-row gap-5 md:gap-4 items-center w-full sm:w-auto"
        >
          <a
            href="#services"
            className="w-full sm:w-auto bg-primary text-white px-8 py-4 md:px-10 rounded-full text-sm md:text-[13px] uppercase tracking-wider md:tracking-[2px] font-medium hover:bg-primary/90 transition-all duration-300"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            View Treatments
          </a>
          <a
            href="#treatments"
            className="w-full sm:w-auto border border-white text-white px-8 py-4 md:px-10 rounded-full text-sm md:text-[13px] uppercase tracking-wider md:tracking-[2px] font-medium hover:bg-white hover:text-black transition-all duration-300"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("treatments")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Book a Consultation
          </a>
        </motion.div>
      </div>
    </section>
  );
}
