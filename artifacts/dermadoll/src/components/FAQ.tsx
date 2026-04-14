import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Do I need a consultation before booking?",
    answer: "All new clients require a consultation before treatment. A £10 consultation fee applies, which is fully redeemable against your treatment.",
  },
  {
    question: "Is a deposit required to book?",
    answer: "Yes — a deposit is required to secure all appointments. The deposit amount varies depending on the treatment booked. Deposits are non-refundable.",
  },
  {
    question: "What is your rescheduling policy?",
    answer: "Please give at least 48 hours' notice if you need to reschedule. Rescheduling within this timeframe allows your deposit to be transferred to your new appointment.",
  },
  {
    question: "What happens if I cancel or don't show up?",
    answer: "Cancellations with less than 48 hours' notice will result in your deposit being forfeited. No-shows will lose their deposit and will be charged the remainder of the appointment cost. A new deposit will be required to rebook.",
  },
  {
    question: "Where are you based?",
    answer: "Niamh works from a private home clinic in Leeds and is available at Laurenanaisbeauty in Horsforth two days a month. Exact address details are provided upon booking confirmation.",
  },
  {
    question: "How long do results last?",
    answer: "This varies by treatment. Lip filler typically lasts 6–9 months, anti-wrinkle 3–4 months, and skin boosters can last up to 12 months with a course.",
  },
  {
    question: "What aftercare is provided?",
    answer: "Full aftercare guidance is provided after every treatment. A complimentary 2-week review is included for anti-wrinkle treatments. Niamh is always available via Instagram DM or WhatsApp for any questions after your appointment.",
  },
];

function Eyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
      <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.5 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>{label}</span>
      <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.5 }} />
    </div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ background: "#F0EBE1", padding: "100px 0" }}>
      <div style={{ maxWidth: 750, margin: "0 auto", padding: "0 24px" }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <Eyebrow label="FAQ" />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 600, color: "#1C1C1E", margin: 0 }}>
            Common Questions
          </h2>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              style={{ border: "1px solid #E2DDD5", borderRadius: 2, overflow: "hidden" }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  background: open === i ? "#1C1C1E" : "#FAF7F2",
                  border: "none",
                  cursor: "pointer",
                  gap: 16,
                  transition: "background 0.2s",
                  textAlign: "left",
                }}
              >
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: open === i ? "#FAF7F2" : "#1C1C1E",
                }}>
                  {faq.question}
                </span>
                <ChevronDown
                  size={16}
                  color={open === i ? "#C9A96E" : "#6B6260"}
                  style={{ flexShrink: 0, transform: open === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}
                />
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden", background: "#FAF7F2" }}
                  >
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      color: "#6B6260",
                      lineHeight: 1.8,
                      margin: 0,
                      padding: "20px 24px",
                    }}>
                      {faq.answer}
                    </p>
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
