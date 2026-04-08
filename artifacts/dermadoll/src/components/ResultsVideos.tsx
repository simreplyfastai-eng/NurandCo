import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const DEFAULT_SLOTS = [
  { key: "vid0", label: "Medical Needling", src: "video1.mp4" },
  { key: "vid1", label: "Lip Filler", src: "video2.mp4" },
  { key: "vid2", label: "Masseter Botox", src: "video3.mp4" },
  { key: "vid3", label: "Skin Booster Results", src: "video1.mp4" },
];

interface VidSlot { key: string; label: string; src: string; }

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
      <div className="rounded-sm overflow-hidden bg-[#FAF9F7] aspect-square border border-[#C9A96E]">
        <video
          key={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          {...{ "webkit-playsinline": "true" } as any}
          className="w-full h-full object-cover"
        >
          <source src={src} type="video/mp4" />
        </video>
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
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-[2rem] md:text-[56px] mb-5"
          >
            Real Results
          </motion.h2>
          <div className="w-[60px] h-px bg-primary mx-auto mb-5" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-light text-lg"
            style={{ color: "#C9A96E" }}
          >
            Watch real treatments and transformations
          </motion.p>
        </div>

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
