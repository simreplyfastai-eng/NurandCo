import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

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
        "• You can also reach us on Instagram @facebyniamh or via the WhatsApp link in the footer.",
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
        "Face By Niamh operates from two locations:",
        "Leeds — Private Home Clinic\nWakefield + Laurenanaisbeauty, Horsforth (2 days/month)",
        "Exact location details are sent with your booking confirmation once your appointment is secured."
      ]
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" style={{ background: "linear-gradient(180deg, #FAF9F7 0%, #F5F2EE 100%)" }} className="py-[100px] relative overflow-hidden">

      {/* Decorative background monogram */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden>
        <span className="font-serif text-[320px] leading-none text-black/[0.025] tracking-widest">D</span>
      </div>

      <div className="container mx-auto px-6 max-w-3xl relative">

        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif italic text-primary text-lg mb-4 tracking-wide"
          >
            Your questions, answered
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="font-serif text-[2rem] md:text-[52px] leading-tight mb-6"
          >
            Frequently Asked Questions
          </motion.h2>
          {/* Gold ornament */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="flex items-center justify-center gap-3"
          >
            <div style={{ height: "1px", width: "40px", background: "linear-gradient(to right, transparent, #C9A96E)" }} />
            <div style={{ width: "6px", height: "6px", background: "#C9A96E", transform: "rotate(45deg)" }} />
            <div style={{ height: "1px", width: "40px", background: "linear-gradient(to left, transparent, #C9A96E)" }} />
          </motion.div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: isOpen
                    ? "linear-gradient(135deg, #FFFDF9 0%, #FFFBF4 100%)"
                    : "#FFFFFF",
                  borderLeft: `3px solid ${isOpen ? "#C9A96E" : "#E8DDD0"}`,
                  borderTop: "1px solid #EDE8E0",
                  borderRight: "1px solid #EDE8E0",
                  borderBottom: "1px solid #EDE8E0",
                  boxShadow: isOpen
                    ? "0 8px 32px rgba(201,169,110,0.10), 0 2px 8px rgba(0,0,0,0.04)"
                    : "0 1px 4px rgba(0,0,0,0.03)",
                  transition: "all 0.3s ease",
                }}
                className="overflow-hidden"
              >
                <button
                  className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none group"
                  onClick={() => toggle(i)}
                >
                  {/* Number + Question */}
                  <div className="flex items-start gap-4 pr-4">
                    <span
                      className="font-serif italic text-sm mt-0.5 flex-shrink-0 transition-colors duration-300"
                      style={{ color: isOpen ? "#C9A96E" : "#C9A96E80", minWidth: "24px" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="font-medium leading-snug transition-colors duration-300"
                      style={{ color: isOpen ? "#111111" : "#333333", fontSize: "15px" }}
                    >
                      {faq.question}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      background: isOpen ? "#C9A96E" : "transparent",
                      border: `1.5px solid ${isOpen ? "#C9A96E" : "#C9A96E60"}`,
                    }}
                  >
                    {isOpen
                      ? <Minus size={13} color="#fff" strokeWidth={2.5} />
                      : <Plus size={13} color="#C9A96E" strokeWidth={2.5} />
                    }
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                    >
                      {/* Gold top divider */}
                      <div style={{ height: "1px", background: "linear-gradient(to right, #C9A96E40, #C9A96E20, transparent)", margin: "0 24px" }} />

                      <div className="px-6 pb-7 pt-5 pl-[60px] space-y-2.5">
                        {faq.lines.map((line, j) => (
                          <p
                            key={j}
                            className="leading-relaxed whitespace-pre-line"
                            style={{
                              color: line.startsWith("•") ? "#555550" : j === 0 && faq.lines.length > 1 ? "#111111" : "#666660",
                              fontWeight: j === 0 && faq.lines.length > 1 ? 500 : 300,
                              fontSize: "14px",
                              lineHeight: "1.8",
                            }}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-foreground/50 font-light text-sm mb-4">Still have a question?</p>
          <a
            href="https://www.instagram.com/dermadollaesthetics"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-serif italic text-primary text-base border-b border-primary/40 pb-0.5 hover:border-primary transition-colors duration-200"
          >
            Message us on Instagram
          </a>
        </motion.div>

      </div>
    </section>
  );
}
