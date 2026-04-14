import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ConsultationModal from "./ConsultationModal";

interface PricingItem {
  name: string;
  price: string;
}

interface PricingCategory {
  title: string;
  items: PricingItem[];
}

const categories: PricingCategory[] = [
  {
    title: "Dermal Fillers",
    items: [
      { name: "Consultation", price: "£10" },
      { name: "1ml Lip Filler", price: "£130" },
      { name: "0.7ml Lip Filler", price: "£110" },
      { name: "0.5ml Lip Filler", price: "£100" },
      { name: "Lip Filler Dissolving", price: "£95" },
      { name: "Lip Filler Dissolve & 1ml Refill", price: "£190" },
      { name: "1ml Cheek Contour", price: "£130" },
      { name: "Jaw Filler", price: "£130" },
      { name: "Chin Augmentation", price: "£110" },
      { name: "Non-Surgical Rhinoplasty", price: "£130" },
      { name: "Pixie Tip Lift", price: "£80" },
      { name: "Tear Trough Filler", price: "£130" },
      { name: "Nasolabial Folds", price: "£110" },
      { name: "Facial Slimming Package", price: "£315" },
      { name: "Summer Glow Up", price: "£320" },
      { name: "2ml Package", price: "£220" },
      { name: "3ml Package", price: "£295" },
      { name: "4ml Package", price: "£395" },
      { name: "5ml Package", price: "£495" },
    ],
  },
  {
    title: "Anti-Wrinkle",
    items: [
      { name: "1 Area", price: "£140" },
      { name: "2 Areas", price: "£200" },
      { name: "3 Areas", price: "£230" },
      { name: "Brow Lift", price: "£150" },
      { name: "2 Week Review / Top-up", price: "£10" },
      { name: "Masseter Slimming Tox", price: "£150" },
      { name: "Nose Tip Lift Tox", price: "£140" },
      { name: "DAO Tox", price: "£140" },
      { name: "Dimple Chin Tox", price: "£150" },
      { name: "Nose Slimming Tox", price: "£140" },
    ],
  },
  {
    title: "Skin Boosters",
    items: [
      { name: "Profhilo", price: "£140" },
      { name: "Profhilo x4", price: "£450" },
      { name: "Jalupro HMW", price: "£130" },
      { name: "Jalupro HMW x4", price: "£420" },
      { name: "Lumi Eyes", price: "£100" },
      { name: "Lumi Eyes x4", price: "£350" },
      { name: "Seventy Hyal", price: "£120" },
      { name: "Seventy Hyal x4", price: "£300" },
    ],
  },
  {
    title: "Facials",
    items: [
      { name: "Luxury Dermaplane", price: "£30" },
      { name: "Luxury Microneedling with Salmon DNA", price: "£45" },
      { name: "Dermaplane & Microneedling combo", price: "£65" },
    ],
  },
  {
    title: "Vitamin Injections",
    items: [
      { name: "Vitamin B12 Injection", price: "£25" },
      { name: "Weekly Course x4", price: "£90" },
    ],
  },
];

function Eyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
      <div style={{ height: 1, width: 28, background: "#C8860A", opacity: 0.5 }} />
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C8860A" }}>{label}</span>
      <div style={{ height: 1, width: 28, background: "#C8860A", opacity: 0.5 }} />
    </div>
  );
}

export default function Pricing() {
  const [open, setOpen] = useState<number>(0);
  const [consultOpen, setConsultOpen] = useState(false);

  return (
    <section id="pricing" style={{ background: "#FAF7F2", padding: "100px 0" }}>
      <div style={{ maxWidth: 750, margin: "0 auto", padding: "0 24px" }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <Eyebrow label="PRICING" />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 600, color: "#1A0F00", margin: "0 0 12px" }}>
            Transparent Pricing
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(1rem,2vw,1.2rem)", color: "#C8860A", margin: 0 }}>
            No hidden fees. Every treatment listed.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              style={{ border: "1px solid #E2DDD5", borderRadius: 2, overflow: "hidden" }}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 24px",
                  background: open === i ? "#1A0F00" : "#FAF7F2",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: open === i ? "#FAF7F2" : "#1A0F00",
                }}>
                  {cat.title}
                </span>
                <ChevronDown
                  size={16}
                  color={open === i ? "#C8860A" : "#6B6260"}
                  style={{ transform: open === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}
                />
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden", background: "#FAF7F2" }}
                  >
                    <div style={{ padding: "4px 24px 8px" }}>
                      {cat.items.map((item, j) => (
                        <div
                          key={j}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 0",
                            borderBottom: j < cat.items.length - 1 ? "1px solid #E2DDD5" : "none",
                            gap: 16,
                          }}
                        >
                          <span style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 14,
                            color: "#1A0F00",
                            flexShrink: 0,
                          }}>
                            {item.name}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                            <span style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              fontStyle: "italic",
                              fontSize: 20,
                              color: "#C8860A",
                            }}>
                              {item.price}
                            </span>
                            <button
                              onClick={() => setConsultOpen(true)}
                              style={{
                                background: "transparent",
                                border: "1px solid #1A0F00",
                                color: "#1A0F00",
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 9,
                                letterSpacing: "2px",
                                textTransform: "uppercase",
                                padding: "6px 12px",
                                borderRadius: 0,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#1A0F00";
                                e.currentTarget.style.color = "#FAF7F2";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "#1A0F00";
                              }}
                            >
                              BOOK
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {consultOpen && <ConsultationModal onClose={() => setConsultOpen(false)} />}
    </section>
  );
}
