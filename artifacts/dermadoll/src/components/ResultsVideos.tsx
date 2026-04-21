import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const DEFAULT_SLOTS = [
  { key: "vid0", label: "Medical Needling", src: "video1.mp4" },
  { key: "vid1", label: "Lip Filler", src: "video2.mp4" },
  { key: "vid2", label: "Masseter Botox", src: "video3.mp4" },
  { key: "vid3", label: "Skin Booster Results", src: "video1.mp4" },
];

interface VidSlot { key: string; label: string; src: string; }

function AutoPlayVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const tryPlay = () => {
      video.muted = true;
      video.playsInline = true;
      const p = video.play();
      if (p) p.catch(() => {});
    };

    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tryPlay();
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);

    const userGesture = () => { tryPlay(); window.removeEventListener("touchstart", userGesture); };
    window.addEventListener("touchstart", userGesture, { once: true, passive: true });

    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      observer.disconnect();
    };
  }, [src]);

  return (
    <video
      ref={ref}
      key={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      {...{ "webkit-playsinline": "true" } as any}
      className="w-full h-full object-cover"
      style={{ pointerEvents: "none" }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

function VideoCard({ vid, i }: { vid: VidSlot; i: number }) {
  const isLocal = !vid.src.startsWith("http") && !vid.src.startsWith("/api/");
  const src = isLocal ? `${import.meta.env.BASE_URL}${vid.src}` : vid.src;

  return (
    <motion.div
      key={vid.key}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.08, duration: 0.6 }}
      className="flex flex-col gap-2"
    >
      <div style={{ overflow: "hidden", background: "#E8E2D9", aspectRatio: "1/1" }}>
        <AutoPlayVideo src={src} />
      </div>
    </motion.div>
  );
}

export default function ResultsVideos() {
  const [slots, setSlots] = useState<VidSlot[]>(DEFAULT_SLOTS);

  useEffect(() => {
    fetch("/api/media/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setSlots(DEFAULT_SLOTS.map((slot) => {
          const overrideSrc = data.videos?.[slot.key];
          const overrideLabel = data.vidLabels?.[slot.key];
          return {
            key: slot.key,
            src: overrideSrc || slot.src,
            label: overrideLabel || slot.label,
          };
        }));
      })
      .catch(() => {});
  }, []);

  const top = slots.slice(0, 2);
  const bottom = slots.slice(2, 4);

  return (
    <section className="py-[100px] bg-white">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 400, color: "#5C1A1A", margin: "0 0 8px" }}>
            Watch Real Treatments
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#737373", margin: 0 }}>
            Watch real treatments and transformations
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:gap-6 mb-3 md:mb-6">
          {top.map((vid, i) => <VideoCard key={vid.key} vid={vid} i={i} />)}
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-6">
          {bottom.map((vid, i) => <VideoCard key={vid.key} vid={vid} i={i + 2} />)}
        </div>
      </div>
    </section>
  );
}
