import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import BookingModal from "@/components/BookingModal";
import { SERVICES, findTreatment, type Treatment } from "@/lib/treatments";

const BASE = import.meta.env.BASE_URL;

const LOCATION_IDS: Record<string, string> = {
  hornchurch: "ccb325d5-6b17-4218-b97d-1a1a0383410a",
  marylebone: "5b3d890a-bf6f-4e87-af43-5db0726a46ce",
};

function LocationSelector() {
  const [, navigate] = useLocation();
  const locations = [
    { slug: "hornchurch", label: "Hornchurch", region: "ESSEX", desc: "Our original home clinic, serving Essex and East London with our full treatment menu." },
    { slug: "marylebone", label: "Marylebone", region: "LONDON · NEW", desc: "Now open in the heart of London. Premium flat-rate pricing for all treatments." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: "100%", maxWidth: 680, textAlign: "center" }}>
        <a href={BASE} style={{ display: "inline-block", marginBottom: 48, textDecoration: "none" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", letterSpacing: "0.15em", color: "#5C1A1A", lineHeight: 1 }}>STARR</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "0.35em", color: "#C9A96E", textTransform: "uppercase" }}>AESTHETICS</div>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 16 }}>
          <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>Choose Location</span>
          <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 400, color: "#5C1A1A", margin: "0 0 40px" }}>
          Where would you like to book?
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {locations.map((loc, i) => (
            <motion.button
              key={loc.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              onClick={() => navigate(`/book?location=${loc.slug}`)}
              style={{
                background: "#fff", border: "1px solid #E8E2D9", padding: "36px 28px",
                textAlign: "left", cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#5C1A1A"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E2D9"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "#C9A96E", marginBottom: 10 }}>{loc.region}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", color: "#5C1A1A", marginBottom: 12, lineHeight: 1 }}>{loc.label}</div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#737373", lineHeight: 1.6, margin: "0 0 20px" }}>{loc.desc}</p>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#5C1A1A", borderTop: "1px solid #E8E2D9", paddingTop: 16 }}>
                Book Here →
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TreatmentPicker({ locationSlug, initialTreatmentId }: { locationSlug: string; initialTreatmentId?: string }) {
  const [, navigate] = useLocation();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["SIGNATURE TREATMENTS"]));
  const [activeTreatment, setActiveTreatment] = useState<Treatment | null>(null);

  const loc = locationSlug as "hornchurch" | "marylebone";
  const groups = SERVICES[loc] ?? SERVICES["hornchurch"];
  const locationLabel = loc === "hornchurch" ? "Hornchurch" : "Marylebone";

  useEffect(() => {
    if (initialTreatmentId) {
      const t = findTreatment(locationSlug, initialTreatmentId);
      if (t) setActiveTreatment(t);
    }
  }, [initialTreatmentId, locationSlug]);

  const toggleGroup = (g: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #F0EAE2", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href={BASE} style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", letterSpacing: "0.15em", color: "#5C1A1A", lineHeight: 1 }}>STARR</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, letterSpacing: "0.35em", color: "#C9A96E", textTransform: "uppercase" }}>AESTHETICS</div>
        </a>
        <button
          onClick={() => navigate("/book")}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "#737373", background: "none", border: "none", cursor: "pointer" }}
        >
          ← Change Location
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 100px" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>{locationLabel}</span>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem,5vw,2.8rem)", fontWeight: 400, color: "#5C1A1A", margin: "0 0 48px" }}>
            Choose a Treatment
          </h1>

          {groups.map((group) => (
            <div key={group.group} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggleGroup(group.group)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 20px", background: "#fff", border: "none", cursor: "pointer",
                  fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
                  color: "#3D3D3D",
                }}
              >
                {group.group}
                {openGroups.has(group.group) ? <ChevronUp size={14} color="#C9A96E" /> : <ChevronDown size={14} color="#C9A96E" />}
              </button>

              <AnimatePresence initial={false}>
                {openGroups.has(group.group) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    {group.items.map((sub) => (
                      <div key={sub.subname} style={{ marginBottom: 8 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1rem", color: "#5C1A1A", padding: "12px 20px 8px", background: "#F9F5F0" }}>
                          {sub.subname}
                        </div>
                        {sub.treatments.map((t) => (
                          <div
                            key={t.id}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "14px 20px", background: "#F5F0EB", marginBottom: 2, gap: 8,
                            }}
                          >
                            <div>
                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#3D3D3D" }}>{t.display}</span>
                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#737373", marginLeft: 8 }}>{t.duration}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.1rem", color: "#C9A96E" }}>{t.price}</span>
                              <button
                                onClick={() => setActiveTreatment(t)}
                                style={{
                                  fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
                                  border: "1px solid #5C1A1A", background: "transparent", color: "#5C1A1A",
                                  padding: "7px 16px", cursor: "pointer", transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#5C1A1A"; e.currentTarget.style.color = "#F5F0EB"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5C1A1A"; }}
                              >
                                BOOK
                              </button>
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
        </motion.div>
      </div>

      {activeTreatment && (
        <BookingModal
          treatment={{ name: activeTreatment.name, price: activeTreatment.price }}
          onClose={() => setActiveTreatment(null)}
          locationId={LOCATION_IDS[locationSlug]}
          locationSlug={locationSlug}
        />
      )}
    </div>
  );
}

export default function BookPage() {
  const params = new URLSearchParams(window.location.search);
  const locationSlug = params.get("location") ?? "";
  const treatmentId = params.get("treatment") ?? "";

  if (!locationSlug) {
    return <LocationSelector />;
  }

  return <TreatmentPicker locationSlug={locationSlug} initialTreatmentId={treatmentId || undefined} />;
}
