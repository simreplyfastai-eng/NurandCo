import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function BookNow() {
  const [waNumber, setWaNumber] = useState("447701298985");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => { if (d?.whatsapp) setWaNumber(d.whatsapp); })
      .catch(() => {});
  }, []);

  return (
    <section className="py-[100px] bg-white">
      <div className="container mx-auto px-6 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-[2rem] md:text-[56px] mb-5">Ready to Book?</h2>
          <div className="w-[60px] h-px bg-primary mx-auto mb-5" />
          <p className="text-foreground/70 font-light text-lg mb-14">
            Book your appointment online, message us on WhatsApp, or find us on Instagram
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="#treatments"
              onClick={(e) => { e.preventDefault(); document.getElementById("treatments")?.scrollIntoView({ behavior: "smooth" }); }}
              className="bg-primary text-white px-8 py-4 rounded-full text-sm uppercase tracking-wider font-medium hover:bg-primary/90 transition-all duration-300 w-full sm:w-auto shadow-sm hover:shadow-md"
            >
              Book Now
            </a>
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-primary text-primary px-8 py-4 rounded-full text-sm uppercase tracking-wider font-medium hover:bg-primary hover:text-white transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" className="shrink-0" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.117 1.523 5.845L.057 23.704a.5.5 0 0 0 .614.632l6.054-1.572A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.724.967.998-3.613-.236-.373A9.818 9.818 0 1 1 12 21.818z"/>
              </svg>
              WhatsApp Us
            </a>
            <a
              href="https://instagram.com/StarrAestheticss"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-primary text-primary px-8 py-4 rounded-full text-sm uppercase tracking-wider font-medium hover:bg-primary hover:text-white transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="17" height="17" className="shrink-0" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
              Instagram
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
