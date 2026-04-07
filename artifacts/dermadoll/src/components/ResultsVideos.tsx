import { motion } from "framer-motion";

export default function ResultsVideos() {
  const topVideos = [
    { label: "Medical Needling", src: "video1.mp4" },
    { label: "Lip Filler", src: "video2.mp4" },
  ];

  const bottomVideo = { label: "Masseter Botox", src: "video3.mp4" };

  const VideoCard = ({ vid, i }: { vid: { label: string; src: string }; i: number }) => (
    <motion.div
      key={vid.label}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.08, duration: 0.6 }}
      className="flex flex-col gap-2"
    >
      <div className="rounded-sm overflow-hidden bg-[#FAF9F7] aspect-square">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        >
          <source src={`${import.meta.env.BASE_URL}${vid.src}`} type="video/mp4" />
        </video>
      </div>
      <p className="text-center font-sans text-[10px] md:text-xs uppercase tracking-[0.18em] text-primary font-medium">
        {vid.label}
      </p>
    </motion.div>
  );

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
            className="text-foreground/70 font-light text-lg"
          >
            Watch real treatments and transformations
          </motion.p>
        </div>

        {/* Top row — 2 videos */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 mb-3 md:mb-6">
          {topVideos.map((vid, i) => <VideoCard key={vid.label} vid={vid} i={i} />)}
        </div>

        {/* Bottom — 1 video centred */}
        <div className="flex justify-center">
          <div className="w-full max-w-[calc(50%-0.75rem)] md:max-w-[calc(50%-0.75rem)]">
            <VideoCard vid={bottomVideo} i={2} />
          </div>
        </div>
      </div>
    </section>
  );
}
