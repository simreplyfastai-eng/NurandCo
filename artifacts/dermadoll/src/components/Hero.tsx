import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative h-[100dvh] w-full overflow-hidden flex items-center justify-center">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-[#1a1a1a] to-[#2d2520]">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={`${import.meta.env.BASE_URL}hero.mp4`} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 flex flex-col items-center justify-center w-full max-w-5xl mx-auto pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center mb-10"
        >
          <span
            className="font-serif text-5xl md:text-7xl tracking-[0.2em] font-bold leading-none text-white"
            style={{ textShadow: "0 0 20px rgba(201,169,110,0.25), 0 0 40px rgba(201,169,110,0.1)" }}
          >
            DERMADOLL
          </span>
          <span
            className="font-sans text-sm md:text-base tracking-[0.4em] font-light mt-4 text-white/90"
            style={{ textShadow: "0 0 15px rgba(201,169,110,0.2)" }}
          >
            AESTHETICS
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mb-6 relative inline-block"
        >
          <h1
            className="font-serif text-4xl md:text-6xl text-white font-medium leading-tight"
            style={{ textShadow: "0 0 20px rgba(201,169,110,0.2), 0 0 40px rgba(201,169,110,0.08)" }}
          >
            Redefining Natural Beauty
          </h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 1, ease: "easeInOut" }}
            className="h-[1px] bg-primary w-full absolute -bottom-2 left-0 origin-left"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-white/90 font-light text-lg md:text-xl max-w-2xl mx-auto mb-12"
          style={{ textShadow: "0 0 15px rgba(201,169,110,0.15)" }}
        >
          Premium aesthetics treatments in Birmingham & Solihull
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <a
            href="#services"
            className="w-full sm:w-auto bg-primary text-white px-8 py-3.5 rounded-full text-sm uppercase tracking-wider font-medium hover:bg-primary/90 transition-all duration-300"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            View Treatments
          </a>
          <a
            href="https://facesconsent.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto border border-white text-white px-8 py-3.5 rounded-full text-sm uppercase tracking-wider font-medium hover:bg-white hover:text-black transition-all duration-300"
          >
            Book a Consultation
          </a>
        </motion.div>
      </div>
    </section>
  );
}
