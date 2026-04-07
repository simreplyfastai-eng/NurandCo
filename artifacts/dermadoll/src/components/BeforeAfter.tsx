import { motion } from "framer-motion";

const results = [
  { src: "result-1.jpg", label: "Liquid Rhinoplasty" },
  { src: "result-2.jpg", label: "Lip Filler" },
  { src: "result-4.jpg", label: "Lip Filler" },
  { src: "result-3.jpg", label: "Glass Skin Facial & Microneedling" },
];

export default function BeforeAfter() {
  return (
    <section className="py-[100px] bg-secondary">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-[2rem] md:text-[56px] mb-5"
          >
            Before & After
          </motion.h2>
          <div className="w-[60px] h-px bg-primary mx-auto mb-5" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-foreground/70 font-light text-lg"
          >
            Every result is natural, tailored and uniquely yours
          </motion.p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {results.map((item, i) => (
            <motion.div
              key={item.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="flex flex-col gap-3"
            >
              <div className="overflow-hidden rounded-sm">
                <img
                  src={`${import.meta.env.BASE_URL}${item.src}`}
                  alt={item.label}
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700"
                  style={{ display: "block" }}
                />
              </div>
              <p className="text-center font-sans text-xs uppercase tracking-[0.2em] text-primary font-medium">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
