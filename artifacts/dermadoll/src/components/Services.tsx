import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SERVICES } from "@/lib/treatments";

const BASE = import.meta.env.BASE_URL;

export default function Services() {
  const [location, setLocation] = useState<"hornchurch" | "marylebone">("hornchurch");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["SIGNATURE TREATMENTS"]));

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const services = SERVICES[location];

  return (
    <section id="services" style={{ background: "#FFFFFF", padding: "100px 0" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 32px" }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>Treatments</span>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 400, color: "#5C1A1A", margin: "0 0 8px" }}>
            Our Services
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#737373", margin: "0 0 36px" }}>
            Precision aesthetics tailored to you
          </p>

          <div className="svc-loc-toggle" style={{ display: "inline-flex", gap: 0 }}>
            <style>{`
              .svc-loc-toggle { display: inline-flex; }
              @media (max-width: 768px) {
                .svc-loc-toggle { display: flex !important; width: 100% !important; }
                .svc-loc-btn { flex: 1 !important; }
              }
            `}</style>
            {(["hornchurch", "marylebone"] as const).map((loc) => (
              <button
                key={loc}
                className="svc-loc-btn"
                onClick={() => setLocation(loc)}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
                  padding: "11px 28px", cursor: "pointer", transition: "all 0.2s",
                  background: location === loc ? "#5C1A1A" : "transparent",
                  color: location === loc ? "#F5F0EB" : "#5C1A1A",
                  border: "1px solid #5C1A1A",
                  marginRight: loc === "hornchurch" ? -1 : 0,
                }}
              >
                {loc === "hornchurch" ? "Hornchurch" : "Marylebone"}
              </button>
            ))}
          </div>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {services.map((group) => (
            <div key={group.group}>
              <button
                onClick={() => toggleGroup(group.group)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 0", background: "none", border: "none", borderBottom: "1px solid #E2DDD5",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: "#5C1A1A", fontWeight: 400 }}>
                  {group.group}
                </span>
                {openGroups.has(group.group) ? <ChevronUp size={16} color="#C9A96E" /> : <ChevronDown size={16} color="#C9A96E" />}
              </button>

              <AnimatePresence initial={false}>
                {openGroups.has(group.group) && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    {group.items.map((sub) => (
                      <div key={sub.subname} style={{ paddingTop: 20, paddingBottom: 8 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.1rem", color: "#3D3D3D", marginBottom: 8, paddingLeft: 4 }}>
                          {sub.subname}
                        </div>
                        {sub.treatments.map((t) => (
                          <div
                            key={t.id}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "14px 16px", background: "#F5F0EB", marginBottom: 2, gap: 8,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#3D3D3D" }}>{t.display}</span>
                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#737373", marginLeft: 8, whiteSpace: "nowrap" }}>{t.duration}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.1rem", color: "#C9A96E" }}>{t.price}</span>
                              <a
                                href={`${BASE}book?location=${location}&treatment=${t.id}`}
                                style={{
                                  fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
                                  border: "1px solid #5C1A1A", background: "transparent", color: "#5C1A1A",
                                  padding: "7px 16px", cursor: "pointer", transition: "all 0.2s",
                                  textDecoration: "none", display: "inline-block",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#5C1A1A"; e.currentTarget.style.color = "#F5F0EB"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5C1A1A"; }}
                              >
                                BOOK
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
