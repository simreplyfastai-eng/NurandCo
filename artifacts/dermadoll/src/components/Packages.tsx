import { motion } from "framer-motion";
import { useState } from "react";
import ConsultationModal from "./ConsultationModal";

interface Package {
  badge: string;
  bestFor: string;
  price: string;
  name: string;
  tagline: string;
  items: string[];
  popular?: boolean;
}

const packages: Package[] = [
  {
    badge: "ANTI-WRINKLE",
    bestFor: "First-timers",
    price: "From £140",
    name: "Anti-Wrinkle Package",
    tagline: "Smooth, lifted, refreshed.",
    items: [
      "1 area, £140",
      "2 areas, £200",
      "3 areas, £230",
      "Brow lift, £150",
      "2-week review, £10",
    ],
  },
  {
    badge: "MOST POPULAR",
    bestFor: "Anti-wrinkle + filler together",
    price: "From £230",
    name: "Combination Package",
    tagline: "The ultimate refresh.",
    items: [
      "Toxin + 1ml filler, £230",
      "Toxin + 2ml filler, £295",
      "Brow lift + 1ml lips, £245",
    ],
    popular: true,
  },
  {
    badge: "FILLER",
    bestFor: "Multi-area filler",
    price: "From £220",
    name: "Filler Package",
    tagline: "Volume, contour, definition.",
    items: [
      "2ml, £220",
      "3ml, £295",
      "4ml, £395",
      "5ml, £495",
      "Consultation, £10 (redeemable)",
    ],
  },
];

function Eyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
      <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.5 }} />
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>{label}</span>
      <div style={{ height: 1, width: 28, background: "#C9A96E", opacity: 0.5 }} />
    </div>
  );
}

export default function Packages() {
  const [consultOpen, setConsultOpen] = useState(false);
  const [current, setCurrent] = useState(1);

  return (
    <section id="packages" style={{ background: "#F5F0EB", padding: "100px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <Eyebrow label="PACKAGES" />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 600, color: "#3D3D3D", margin: "0 0 12px" }}>
            Treatment Packages
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(1rem,2vw,1.2rem)", color: "#C9A96E", margin: 0 }}>
            Save more when you combine.
          </p>
        </motion.div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "stretch" }}>
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{
                background: "#F5F0EB",
                border: pkg.popular ? "2px solid #C9A96E" : "1px solid #E2DDD5",
                borderRadius: 2,
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {pkg.popular && (
                <div style={{
                  position: "absolute",
                  top: -14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#C9A96E",
                  color: "#3D3D3D",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 9,
                  letterSpacing: "2px",
                  fontVariant: "small-caps",
                  padding: "4px 14px",
                  whiteSpace: "nowrap",
                }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 9,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "#C9A96E",
                marginBottom: 20,
              }}>{pkg.badge}</div>

              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2rem,4vw,2.6rem)",
                fontWeight: 600,
                color: "#3D3D3D",
                lineHeight: 1,
                marginBottom: 4,
              }}>{pkg.price}</div>

              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "#3D3D3D",
                marginBottom: 6,
              }}>{pkg.name}</div>

              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "1rem",
                color: "#C9A96E",
                marginBottom: 24,
              }}>{pkg.tagline}</div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", flexGrow: 1 }}>
                {pkg.items.map((item) => (
                  <li key={item} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: "#737373",
                    marginBottom: 8,
                  }}>
                    <span style={{ color: "#C9A96E", fontSize: 10 }}>✦</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 9,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#737373",
                marginBottom: 12,
              }}>Best for: {pkg.bestFor}</div>

              <button
                onClick={() => setConsultOpen(true)}
                style={{
                  background: pkg.popular ? "#3D3D3D" : "transparent",
                  border: "1px solid #C9A96E",
                  color: pkg.popular ? "#F5F0EB" : "#3D3D3D",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  padding: "13px 20px",
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#C9A96E";
                  e.currentTarget.style.color = "#3D3D3D";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = pkg.popular ? "#3D3D3D" : "transparent";
                  e.currentTarget.style.color = pkg.popular ? "#F5F0EB" : "#3D3D3D";
                }}
              >
                Book Now
              </button>
            </motion.div>
          ))}
        </div>

        <p style={{
          textAlign: "center",
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: 14,
          color: "#C9A96E",
          marginTop: 36,
          marginBottom: 0,
        }}>
          A deposit is required to secure all appointments. Courses must be used within 12 months of purchase.
        </p>
      </div>

      {consultOpen && <ConsultationModal onClose={() => setConsultOpen(false)} />}
    </section>
  );
}
