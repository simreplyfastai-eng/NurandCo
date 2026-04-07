import { motion } from "framer-motion";

export default function ResultsVideos() {
  const videos = [
    { label: "Lip Filler Treatment", src: "video1.mp4" },
    { label: "Glass Skin Facial", src: "video2.mp4" },
    { label: "Masseter Botox", src: "video3.mp4" },
    { label: "Skin Booster Results", src: "video4.mp4" },
  ];

  return (
    <section className="py-[100px] bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-[2.5rem] md:text-[56px] mb-5"
          >
            See The Results
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {videos.map((vid, i) => (
            <motion.div
              key={vid.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="flex flex-col gap-4"
            >
              <div className="rounded-md overflow-hidden shadow-sm bg-[#FAF9F7] aspect-[3/4] relative">
                 <video
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                >
                  <source src={vid.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <h4 className="text-center font-sans text-xs uppercase tracking-[0.2em] text-primary font-medium">
                {vid.label}
              </h4>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
