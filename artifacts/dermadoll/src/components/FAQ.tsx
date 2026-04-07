import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      question: "Are your treatments safe?",
      answer: "Absolutely. Niamh is a fully trained and insured aesthetic practitioner using only premium, CE-marked products. All treatments are carried out in a professional clinical environment with your safety as the top priority."
    },
    {
      question: "Does it hurt?",
      answer: "Most treatments involve minimal discomfort. Topical numbing cream is applied before filler treatments to keep you comfortable throughout. Botox injections are very quick and most clients find them virtually painless."
    },
    {
      question: "How long do results last?",
      answer: "Results vary by treatment. Botox typically lasts 3–4 months, dermal fillers 6–18 months depending on the area and product used. Skin boosters and facials provide cumulative results with regular sessions."
    },
    {
      question: "How do I book?",
      answer: "You can book directly via our Faces profile using the Book Now button, or send us a DM on Instagram @dermadollaesthetics and we'll get you booked in."
    },
    {
      question: "What should I do before my appointment?",
      answer: "Arrive with a clean face where possible. Avoid alcohol 24 hours before filler treatments and avoid blood-thinning medications (unless prescribed) 48 hours prior. Full aftercare advice is provided at your appointment."
    },
    {
      question: "Do you offer finance or payment plans?",
      answer: "Yes — finance options are available to help spread the cost of treatments. DM us on Instagram for more details."
    },
    {
      question: "Where are you located?",
      answer: "We are based in Birmingham and Solihull. Exact location details are provided upon booking confirmation."
    },
    {
      question: "What is included in the Pathway to Aesthetics training?",
      answer: "The 3-day course covers Level 3 Anatomy & Physiology, First Aid, Complications Management, Hyalase Dissolving, Dermaplaning, Microneedling, Foundation Dermal Filler, Foundation Anti-Wrinkle, B12, Insurance & Prescriber Advice, and more — all for £2,000 with a £300 deposit to secure your place."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-[100px] bg-secondary">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-[2.5rem] md:text-[56px] mb-5"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="w-[60px] h-px bg-primary mx-auto mb-5" />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-foreground/70 font-light text-lg"
          >
            Everything you need to know before booking
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-primary/10 rounded-sm overflow-hidden"
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                onClick={() => toggle(i)}
              >
                <span className="font-medium text-foreground pr-4">{faq.question}</span>
                <ChevronDown 
                  className={`text-primary transition-transform duration-300 flex-shrink-0 ${openIndex === i ? "rotate-180" : ""}`} 
                  size={20} 
                />
              </button>
              
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-5 text-foreground/70 font-light leading-relaxed border-t border-primary/5 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
