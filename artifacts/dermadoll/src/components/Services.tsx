import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import BookingModal from "./BookingModal";

interface Treatment {
  id: string;
  name: string;
  display: string;
  duration: string;
  price: string;
}

interface TreatmentGroup {
  group: string;
  items: { subname: string; treatments: Treatment[] }[];
}

const SERVICES: Record<"hornchurch" | "marylebone", TreatmentGroup[]> = {
  hornchurch: [
    {
      group: "SIGNATURE TREATMENTS",
      items: [
        {
          subname: "NaturalèLips™",
          treatments: [
            { id: "nl-05", name: "NaturalèLips™ 0.5ml", display: "0.5ml", duration: "45 mins", price: "£140" },
            { id: "nl-08", name: "NaturalèLips™ 0.8ml", display: "0.8ml", duration: "45 mins", price: "£185" },
            { id: "nl-11", name: "NaturalèLips™ 1.1ml", display: "1.1ml", duration: "45 mins", price: "£200" },
          ],
        },
        {
          subname: "HD Sculpt Lips",
          treatments: [
            { id: "hd-08", name: "HD Sculpt Lips 0.8ml", display: "0.8ml", duration: "1 hr", price: "£195" },
            { id: "hd-11", name: "HD Sculpt Lips 1.1ml", display: "1.1ml", duration: "1 hr", price: "£225" },
          ],
        },
      ],
    },
    {
      group: "DERMAL FILLERS",
      items: [
        {
          subname: "Facial Contouring",
          treatments: [
            { id: "fc-cheek", name: "Cheek Filler", display: "Cheek Filler", duration: "45 mins", price: "£180" },
            { id: "fc-jaw", name: "Jaw Filler", display: "Jaw Filler", duration: "45 mins", price: "£180" },
            { id: "fc-chin", name: "Chin Filler", display: "Chin Filler", duration: "30 mins", price: "£150" },
            { id: "fc-tt", name: "Tear Trough", display: "Tear Trough", duration: "45 mins", price: "£220" },
          ],
        },
      ],
    },
    {
      group: "SKIN TREATMENTS",
      items: [
        {
          subname: "Injectables",
          treatments: [
            { id: "sb-prof", name: "Profhilo (2-session course)", display: "Profhilo", duration: "30 mins", price: "£280" },
            { id: "sb-pdrn", name: "Polynucleotides", display: "Polynucleotides", duration: "45 mins", price: "£180" },
            { id: "sb-lumi", name: "Lumi Eyes", display: "Lumi Eyes", duration: "30 mins", price: "£150" },
          ],
        },
        {
          subname: "Facials",
          treatments: [
            { id: "skin-dp", name: "Dermaplaning", display: "Dermaplaning", duration: "45 mins", price: "£55" },
            { id: "skin-mn", name: "Microneedling", display: "Microneedling", duration: "1 hr", price: "£120" },
          ],
        },
      ],
    },
    {
      group: "ANTI-WRINKLE",
      items: [
        {
          subname: "Toxin Treatments",
          treatments: [
            { id: "aw-1", name: "Anti-Wrinkle — 1 Area", display: "1 Area", duration: "20 mins", price: "£140" },
            { id: "aw-2", name: "Anti-Wrinkle — 2 Areas", display: "2 Areas", duration: "20 mins", price: "£170" },
            { id: "aw-3", name: "Anti-Wrinkle — 3 Areas", display: "3 Areas", duration: "30 mins", price: "£200" },
            { id: "aw-lb", name: "Lip Blush Tox", display: "Lip Blush Tox", duration: "20 mins", price: "£80" },
          ],
        },
      ],
    },
  ],
  marylebone: [
    {
      group: "SIGNATURE TREATMENTS",
      items: [
        {
          subname: "NaturalèLips™",
          treatments: [
            { id: "m-nl-05", name: "NaturalèLips™ 0.5ml", display: "0.5ml", duration: "45 mins", price: "£160" },
            { id: "m-nl-08", name: "NaturalèLips™ 0.8ml", display: "0.8ml", duration: "45 mins", price: "£205" },
            { id: "m-nl-11", name: "NaturalèLips™ 1.1ml", display: "1.1ml", duration: "45 mins", price: "£220" },
          ],
        },
        {
          subname: "HD Sculpt Lips",
          treatments: [
            { id: "m-hd-08", name: "HD Sculpt Lips 0.8ml", display: "0.8ml", duration: "1 hr", price: "£215" },
            { id: "m-hd-11", name: "HD Sculpt Lips 1.1ml", display: "1.1ml", duration: "1 hr", price: "£245" },
          ],
        },
      ],
    },
    {
      group: "DERMAL FILLERS",
      items: [
        {
          subname: "Facial Contouring",
          treatments: [
            { id: "m-fc-cheek", name: "Cheek Filler", display: "Cheek Filler", duration: "45 mins", price: "£200" },
            { id: "m-fc-jaw", name: "Jaw Filler", display: "Jaw Filler", duration: "45 mins", price: "£200" },
            { id: "m-fc-chin", name: "Chin Filler", display: "Chin Filler", duration: "30 mins", price: "£170" },
            { id: "m-fc-tt", name: "Tear Trough", display: "Tear Trough", duration: "45 mins", price: "£240" },
          ],
        },
      ],
    },
    {
      group: "SKIN TREATMENTS",
      items: [
        {
          subname: "Injectables",
          treatments: [
            { id: "m-sb-prof", name: "Profhilo (2-session course)", display: "Profhilo", duration: "30 mins", price: "£300" },
            { id: "m-sb-pdrn", name: "Polynucleotides", display: "Polynucleotides", duration: "45 mins", price: "£200" },
            { id: "m-sb-lumi", name: "Lumi Eyes", display: "Lumi Eyes", duration: "30 mins", price: "£170" },
          ],
        },
      ],
    },
    {
      group: "ANTI-WRINKLE",
      items: [
        {
          subname: "Toxin Treatments",
          treatments: [
            { id: "m-aw-1", name: "Anti-Wrinkle — 1 Area", display: "1 Area", duration: "20 mins", price: "£160" },
            { id: "m-aw-2", name: "Anti-Wrinkle — 2 Areas", display: "2 Areas", duration: "20 mins", price: "£190" },
            { id: "m-aw-3", name: "Anti-Wrinkle — 3 Areas", display: "3 Areas", duration: "30 mins", price: "£220" },
          ],
        },
      ],
    },
  ],
};

export default function Services() {
  const [location, setLocation] = useState<"hornchurch" | "marylebone">("hornchurch");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["SIGNATURE TREATMENTS"]));
  const [bookingTreatment, setBookingTreatment] = useState<{ id: string; name: string; price: string } | null>(null);

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

          <div style={{ display: "inline-flex", gap: 0 }}>
            {(["hornchurch", "marylebone"] as const).map((loc) => (
              <button
                key={loc}
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
          {services.map((group, gi) => (
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
                              padding: "14px 16px", background: "#F5F0EB", marginBottom: 2,
                            }}
                          >
                            <div>
                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#3D3D3D" }}>{t.display}</span>
                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#737373", marginLeft: 12 }}>{t.duration}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.1rem", color: "#C9A96E" }}>{t.price}</span>
                              <button
                                onClick={() => setBookingTreatment({ id: t.id, name: t.name, price: t.price })}
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
        </div>
      </div>

      {bookingTreatment && (
        <BookingModal
          treatment={{ name: bookingTreatment.name, price: bookingTreatment.price }}
          onClose={() => setBookingTreatment(null)}
        />
      )}
    </section>
  );
}
