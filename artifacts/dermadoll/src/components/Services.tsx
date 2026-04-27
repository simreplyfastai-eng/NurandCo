import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const LOCATION_IDS: Record<string, string> = {
  "nur-and-co": "[LOCATION_1_UUID]",
  "nur-and-co-2": "[LOCATION_2_UUID]",
};

const CATEGORY_ORDER = [
  "Aesthetics",
  "Lashes & Brows",
  "Facials",
  "Nails",
  "SPMU",
];

interface ApiTreatment {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
  category: string;
  active: boolean;
}

interface CategoryGroup {
  category: string;
  items: ApiTreatment[];
}

function fmtDuration(m: number): string {
  if (!m) return "";
  if (m < 60) return `${m} mins`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}hr ${rem}m` : `${h}hr`;
}

function fmtPrice(p: number): string {
  return p === 0 ? "POA" : `£${p}`;
}

function groupByCategory(treatments: ApiTreatment[]): CategoryGroup[] {
  const map = new Map<string, ApiTreatment[]>();
  for (const t of treatments) {
    const cat = t.category || "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(t);
  }
  const ordered: CategoryGroup[] = [];
  for (const cat of CATEGORY_ORDER) {
    if (map.has(cat)) ordered.push({ category: cat, items: map.get(cat)! });
  }
  for (const [cat, items] of map.entries()) {
    if (!CATEGORY_ORDER.includes(cat)) ordered.push({ category: cat, items });
  }
  return ordered;
}

export default function Services() {
  const [location, setLocation] = useState<"nur-and-co" | "nur-and-co-2">("nur-and-co");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [data, setData] = useState<Record<string, CategoryGroup[]>>({ "nur-and-co": [], "nur-and-co-2": [] });
  const [loading, setLoading] = useState<Record<string, boolean>>({ "nur-and-co": true, "nur-and-co-2": false });
  const [fetched, setFetched] = useState<Record<string, boolean>>({ "nur-and-co": false, "nur-and-co-2": false });

  const fetchLocation = async (loc: "nur-and-co" | "nur-and-co-2") => {
    if (fetched[loc]) return;
    setLoading((prev) => ({ ...prev, [loc]: true }));
    try {
      const res = await fetch(`/api/treatments?locationId=${LOCATION_IDS[loc]}`);
      if (res.ok) {
        const treats: ApiTreatment[] = await res.json();
        const groups = groupByCategory(treats.filter((t) => t.active !== false));
        setData((prev) => ({ ...prev, [loc]: groups }));
        setFetched((prev) => ({ ...prev, [loc]: true }));
      }
    } catch {
      // fail silently — section just stays empty
    } finally {
      setLoading((prev) => ({ ...prev, [loc]: false }));
    }
  };

  useEffect(() => { fetchLocation("nur-and-co"); }, []);

  const handleTabClick = (loc: "nur-and-co" | "nur-and-co-2") => {
    setLocation(loc);
    if (fetched[loc]) {
      setOpenGroups(new Set());
    } else {
      setOpenGroups(new Set());
      fetchLocation(loc);
    }
  };

  const toggleGroup = (cat: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const groups = data[location];
  const isLoading = loading[location];

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
            <div style={{ height: 1, width: 28, background: "var(--brand-accent)" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-accent)" }}>Treatments</span>
            <div style={{ height: 1, width: 28, background: "var(--brand-accent)" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 400, color: "var(--brand-primary)", margin: "0 0 8px" }}>
            Our Services
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "var(--brand-accent)", margin: "0 0 36px" }}>
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
            {(["nur-and-co", "nur-and-co-2"] as const).map((loc) => (
              <button
                key={loc}
                className="svc-loc-btn"
                onClick={() => handleTabClick(loc)}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
                  padding: "11px 28px", cursor: "pointer", transition: "all 0.2s",
                  background: location === loc ? "var(--brand-primary)" : "transparent",
                  color: location === loc ? "var(--brand-bg-alt)" : "var(--brand-primary)",
                  border: "1px solid var(--brand-primary)",
                  marginRight: loc === "nur-and-co" ? -1 : 0,
                }}
              >
                {loc === "nur-and-co" ? "[LOCATION_1]" : "[LOCATION_2]"}
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ width: 24, height: 24, border: "2px solid #E2DDD5", borderTopColor: "var(--brand-primary)", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#737373" }}>Loading treatments…</p>
          </div>
        )}

        {!isLoading && groups.length === 0 && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#737373", textAlign: "center", padding: "40px 0" }}>
            No treatments available for this location yet.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {groups.map((group) => (
            <div key={group.category}>
              <button
                onClick={() => toggleGroup(group.category)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 0", background: "none", border: "none", borderBottom: "1px solid #E2DDD5",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: openGroups.has(group.category) ? "var(--brand-primary)" : "var(--brand-accent)", fontWeight: 400 }}>
                  {group.category.toUpperCase()}
                </span>
                {openGroups.has(group.category) ? <ChevronUp size={16} color="var(--brand-accent)" /> : <ChevronDown size={16} color="var(--brand-accent)" />}
              </button>

              <AnimatePresence initial={false}>
                {openGroups.has(group.category) && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ paddingTop: 4, paddingBottom: 8 }}>
                      {group.items.map((t) => {
                        const isPoa = t.price === 0;
                        const bookStyle = {
                          fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase" as const,
                          border: "1px solid var(--brand-primary)", background: "transparent", color: "var(--brand-primary)",
                          padding: "7px 16px", cursor: "pointer", transition: "all 0.2s",
                          textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" as const,
                        };
                        return (
                          <div
                            key={t.id}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "14px 16px", background: "var(--brand-bg-alt)", marginBottom: 2, gap: 8,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1rem", color: "var(--brand-text)" }}>{t.name}</span>
                              {t.duration_minutes > 0 && (
                                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#737373", marginLeft: 8, whiteSpace: "nowrap" }}>
                                  {fmtDuration(t.duration_minutes)}
                                </span>
                              )}
                              {isPoa && (
                                <div style={{ fontFamily: "'Inter', sans-serif", fontStyle: "italic", fontSize: 11, color: "#737373", marginTop: 3 }}>
                                  Ask for pricing
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                              {!isPoa && (
                                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.1rem", color: "var(--brand-accent)", whiteSpace: "nowrap" }}>
                                  {fmtPrice(t.price)}
                                </span>
                              )}
                              {isPoa ? (
                                <a
                                  href="https://wa.me/447701298985"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={bookStyle}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-primary)"; e.currentTarget.style.color = "var(--brand-bg-alt)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--brand-primary)"; }}
                                >
                                  BOOK
                                </a>
                              ) : (
                                <a
                                  href={`${BASE}book?location=${location}&treatment=${t.id}`}
                                  style={bookStyle}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-primary)"; e.currentTarget.style.color = "var(--brand-bg-alt)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--brand-primary)"; }}
                                >
                                  BOOK
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
