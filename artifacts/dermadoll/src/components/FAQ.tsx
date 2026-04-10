import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  lines: string[];
}

export default function FAQ() {
  const faqs: FAQItem[] = [
    {
      question: "How long do treatment results typically last?",
      lines: [
        "Results vary depending on the treatment:",
        "• Anti-wrinkle injections (Botox) — typically 3 to 4 months, with results softening gradually.",
        "• Dermal fillers — 6 to 18 months depending on the area treated and product used. Lips tend to last 6–9 months; cheeks and jawline can last longer.",
        "• Skin boosters — results build cumulatively. Most clients see optimal results after 2–3 sessions spaced 4 weeks apart, lasting up to 6 months.",
        "• Facial treatments — an immediate glow with cumulative improvement over regular sessions.",
        "Niamh will give you a personalised timeline at your consultation."
      ]
    },
    {
      question: "How can I book an appointment?",
      lines: [
        "Booking is quick and easy:",
        "• Use the Book Now button on any treatment page to secure your appointment online.",
        "• Start with a free consultation if you're unsure which treatment is right for you — no charge, no obligation.",
        "• You can also reach us on Instagram @dermadollaesthetics or via the WhatsApp link in the footer.",
        "A £50 deposit is required to confirm all paid treatment bookings."
      ]
    },
    {
      question: "How should I prepare for my appointment?",
      lines: [
        "A little preparation goes a long way:",
        "• Arrive with a clean face, free from makeup where possible.",
        "• Avoid alcohol for at least 24 hours before any filler treatment.",
        "• Avoid blood-thinning medications such as ibuprofen or aspirin (unless prescribed by your GP) for 48 hours prior.",
        "• Stay hydrated and eat a light meal before your appointment.",
        "• If you have any active skin concerns, cold sores, or are unwell on the day, please get in touch before attending.",
        "Full aftercare guidance is always provided at your appointment."
      ]
    },
    {
      question: "Where is your clinic located?",
      lines: [
        "Dermadoll Aesthetics is based at:",
        "Lumi Salon\n1500 Stratford Road\nHall Green, Birmingham\nB28 9ET",
        "We are conveniently located in Hall Green with parking available nearby. Exact directions will be sent with your booking confirmation."
      ]
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
            className="font-serif text-[2rem] md:text-[56px] mb-5"
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
                    <div className="px-6 pb-6 border-t border-primary/5 pt-4 space-y-2">
                      {faq.lines.map((line, j) => (
                        <p
                          key={j}
                          className="text-foreground/70 font-light leading-relaxed whitespace-pre-line"
                          style={line.startsWith("•") ? { paddingLeft: "0.25rem" } : line === faq.lines[0] && faq.lines.length > 1 ? { fontWeight: 500, color: "var(--foreground)" } : {}}
                        >
                          {line}
                        </p>
                      ))}
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
