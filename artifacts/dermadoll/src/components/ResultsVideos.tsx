import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const CDN = "https://[SUPABASE_PROJECT_REF].supabase.co/storage/v1/object/public/media/starr/hero";

const DEFAULT_SLOTS = [
  { key: "vid0", label: "HD Sculpt Lips", category: "LIP FILLER", src: `${CDN}/video1.mp4` },
  { key: "vid1", label: "Lip Filler Dissolve & Refill", category: "FLAT LIPS CORRECTED", src: `${CDN}/video2.mp4` },
  { key: "vid2", label: "Anti-Wrinkle Treatment", category: "NEW PRODUCT SHOWCASE", src: `${CDN}/video3.mp4` },
  { key: "vid3", label: "NaturalèLips™", category: "SUBTLE YET CONFIDENT", src: `${CDN}/video1.mp4` },
];

interface VidSlot { key: string; label: string; category: string; src: string; }

function AutoPlayVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    let dead = false;

    const tryPlay = () => {
      if (dead) return;
      v.muted = true;
      v.volume = 0;
      (v as HTMLVideoElement & { playsInline: boolean }).playsInline = true;
      v.play().catch(() => {});
    };

    // DO NOT call v.load() — it resets the element, making play() fail immediately.
    // The browser starts loading from src automatically on mount.

    v.addEventListener("canplay", tryPlay);
    v.addEventListener("canplaythrough", tryPlay);
    v.addEventListener("loadeddata", tryPlay);

    // Timers catch cached/already-loaded videos that won't fire readiness events
    const t1 = setTimeout(tryPlay, 50);
    const t2 = setTimeout(tryPlay, 400);

    const observer = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? tryPlay() : v.pause(); },
      { threshold: 0.25 },
    );
    observer.observe(v);

    const onTouch = () => tryPlay();
    window.addEventListener("touchstart", onTouch, { once: true, passive: true });

    return () => {
      dead = true;
      clearTimeout(t1);
      clearTimeout(t2);
      v.removeEventListener("canplay", tryPlay);
      v.removeEventListener("canplaythrough", tryPlay);
      v.removeEventListener("loadeddata", tryPlay);
      observer.disconnect();
      window.removeEventListener("touchstart", onTouch);
    };
  }, [src]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {/* Overlay blocks browser-injected play button UI from receiving clicks */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }} aria-hidden="true" />
    </div>
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
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
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
        // New format: resultsVideos is an array of URLs
        if (Array.isArray(data.resultsVideos) && data.resultsVideos.length > 0) {
          const mapped = data.resultsVideos.slice(0, DEFAULT_SLOTS.length).map((url: string, i: number) => ({
            ...DEFAULT_SLOTS[i],
            src: url,
          }));
          const filled = DEFAULT_SLOTS.map((s, i) => mapped[i] ?? s);
          setSlots(filled);
          return;
        }
        // Legacy format: videos map
        setSlots(DEFAULT_SLOTS.map((slot) => {
          const overrideSrc = data.videos?.[slot.key];
          const overrideLabel = data.vidLabels?.[slot.key];
          return {
            ...slot,
            src: overrideSrc || slot.src,
            label: overrideLabel || slot.label,
          };
        }));
      })
      .catch(() => {});
  }, []);

  return (
    <section style={{ padding: "100px 0", background: "#FFFFFF" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 32px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>
              See the Results
            </span>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 400, color: "#5C1A1A", margin: "0 0 8px" }}>
            Watch Real Treatments
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#737373", margin: 0 }}>
            Watch real treatments and transformations
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {slots.map((vid, i) => <VideoCard key={vid.key} vid={vid} i={i} />)}
        </div>
      </div>
    </section>
  );
}
