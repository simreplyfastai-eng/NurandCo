import { motion } from "framer-motion";

export default function About() {
  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-4xl md:text-5xl mb-6">Meet Dermadoll Aesthetics</h2>
          <p className="text-foreground/80 leading-relaxed text-lg md:text-xl font-light mb-16 max-w-3xl mx-auto">
            Dermadoll Aesthetics is a premier face clinic dedicated to enhancing your natural beauty. Led by Niamh — a skilled, experienced practitioner — every treatment is tailored to you, combining the latest techniques with a warm, professional approach. Your comfort and results are our priority.
          </p>
        </motion.div>

        <div className="h-px w-24 bg-primary mx-auto mb-12 opacity-50" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="font-serif text-5xl text-primary mb-2">62</div>
            <div className="text-sm uppercase tracking-widest text-foreground/60 font-medium">Treatments Performed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="font-serif text-5xl text-primary mb-2">★ 5.0</div>
            <div className="text-sm uppercase tracking-widest text-foreground/60 font-medium">Rating</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="font-serif text-5xl text-primary mb-2">5</div>
            <div className="text-sm uppercase tracking-widest text-foreground/60 font-medium">Five-Star Reviews</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
