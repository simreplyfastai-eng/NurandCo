import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function Training() {
  const inclusions = [
    "Level 3 Anatomy & Physiology",
    "First Aid",
    "Complications Management",
    "Hyalase Dissolving",
    "Dermaplaning",
    "Microneedling",
    "Foundation Dermal Filler",
    "Foundation Anti-Wrinkle",
    "B12",
    "Insurance & Prescriber Advice",
    "24/7 Ongoing Support",
    "Pre-Study Materials"
  ];

  return (
    <section id="training" className="py-[100px] bg-secondary">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-5xl mb-4"
          >
            Pathway to Aesthetics
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-foreground/70 font-light text-lg max-w-2xl mx-auto"
          >
            Launch your aesthetics career with a fully comprehensive 3-day course
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 bg-white p-8 md:p-12 shadow-sm rounded-sm">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="font-serif text-2xl mb-6 border-b border-primary/20 pb-4">What's included</h3>
            <ul className="space-y-4">
              {inclusions.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="text-primary mt-1 flex-shrink-0" size={18} />
                  <span className="text-foreground/80 font-light">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col h-full"
          >
            <div className="mb-8">
               <h3 className="font-serif text-2xl mb-6 border-b border-primary/20 pb-4">Key details</h3>
               <div className="font-serif text-5xl text-primary mb-6">£2,000</div>
               
               <ul className="space-y-4 text-foreground/80 font-light mb-8">
                 <li><strong className="font-medium text-foreground">Add-on:</strong> Skin Boosters or Advanced Dermal Filler +£500</li>
                 <li><strong className="font-medium text-foreground">Duration:</strong> 3-day course | Max 3 students</li>
                 <li><strong className="font-medium text-foreground">Location:</strong> Birmingham | Solihull</li>
                 <li><strong className="font-medium text-foreground">Deposit:</strong> £300 deposit secures your place</li>
                 <li><strong className="font-medium text-foreground">Finance:</strong> Finance options available</li>
               </ul>

               <p className="font-serif italic text-xl text-primary/80 mb-8">
                 "Real models. Real experience. Real confidence."
               </p>
            </div>

            <div className="mt-auto">
              <a
                href="https://instagram.com/dermadollaesthetics"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-primary text-white px-8 py-4 rounded-full text-sm uppercase tracking-wider font-medium hover:bg-primary/90 transition-colors duration-300"
              >
                DM to Enquire
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
