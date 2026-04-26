import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is NaturalèLips™?",
    answer: "NaturalèLips™ is Eva's signature lip filler technique, designed to create beautifully natural, defined lips that suit your unique facial anatomy. The technique focuses on hydration, shape and symmetry, never overdone.",
  },
  {
    question: "Which location should I choose?",
    answer: "Both clinics offer the full [CLIENT_NAME] treatment menu. [LOCATION_1] is our original Essex home clinic, perfect for those in Essex and East London. [LOCATION_2] is our new London clinic, ideal for those based in or near Central London.",
  },
  {
    question: "Does it hurt?",
    answer: "Comfort is a priority at every appointment. Topical numbing cream is applied before all filler treatments. Most clients find the experience very manageable, any discomfort is brief and minimal.",
  },
  {
    question: "How long do results last?",
    answer: "Results vary by treatment. Lip filler typically lasts 6–9 months, anti-wrinkle 3–4 months, and skin boosters such as Profhilo can last up to 12 months with a maintenance course.",
  },
  {
    question: "What is the deposit policy?",
    answer: "A deposit is required to secure all bookings. The amount varies by treatment. Deposits are non-refundable but can be transferred to a new appointment with at least 48 hours notice.",
  },
  {
    question: "Do you offer training?",
    answer: "Yes, through [Client] Academy, Eva offers CPD accredited training at both the [LOCATION_1] and [LOCATION_2] clinics. Courses are open to candidates with no prior background required. Enquire via Instagram or email.",
  },
  {
    question: "How do I book?",
    answer: "Use the 'Book Now' button to select your treatment and preferred location. You can also message us on Instagram @[ClientName]s, @[Client]Facess or email [CLIENT_NAME]yltd@gmail.com.",
  },
  {
    question: "What should I do before my appointment?",
    answer: "Arrive with clean skin, free from makeup where possible. Avoid blood-thinning medications (e.g. ibuprofen, aspirin) for 24 hours before filler treatments unless medically required. Full pre-care guidance is sent upon booking confirmation.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ background: "#FFFFFF", padding: "100px 0" }}>
      <div style={{ maxWidth: 750, margin: "0 auto", padding: "0 32px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>FAQ</span>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 400, color: "#5C1A1A", margin: 0 }}>
            Your Questions Answered
          </h2>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{ background: "#F5F0EB", border: "1px solid #E8E2D9", overflow: "hidden" }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "20px 24px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#3D3D3D", fontWeight: 400, paddingRight: 16 }}>
                  {faq.question}
                </span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.25 }}>
                  <ChevronDown size={16} color="#C9A96E" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 24px 20px", fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#737373", lineHeight: 1.75 }}>
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
