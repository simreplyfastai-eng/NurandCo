import { motion } from "framer-motion";

export default function BookNow() {
  return (
    <section className="py-[100px] bg-white">
      <div className="container mx-auto px-6 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-[2.5rem] md:text-[56px] mb-5">Ready to Book?</h2>
          <div className="w-[60px] h-px bg-primary mx-auto mb-5" />
          <p className="text-foreground/70 font-light text-lg mb-14">
            Book directly via our Faces profile or reach out on Instagram
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a
              href="https://facesconsent.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white px-8 py-4 rounded-full text-sm uppercase tracking-wider font-medium hover:bg-primary/90 transition-all duration-300 w-full sm:w-auto shadow-sm hover:shadow-md"
            >
              Book Now
            </a>
            <a
              href="https://instagram.com/dermadollaesthetics"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-primary text-primary px-8 py-4 rounded-full text-sm uppercase tracking-wider font-medium hover:bg-primary hover:text-white transition-all duration-300 w-full sm:w-auto"
            >
              @dermadollaesthetics
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
