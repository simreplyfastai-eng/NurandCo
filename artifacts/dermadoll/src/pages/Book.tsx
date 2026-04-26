import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import BookingModal from "@/components/BookingModal";

const BASE = import.meta.env.BASE_URL;

const LOCATION_IDS: Record<string, string> = {
  hornchurch: "[LOCATION_1_UUID]",
  marylebone: "[LOCATION_2_UUID]",
};

interface ApiTreatment {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
  category: string;
  active: boolean;
}

interface TreatmentGroup {
  category: string;
  items: ApiTreatment[];
}

function LocationSelector() {
  const [, navigate] = useLocation();
  const locations = [
    { slug: "[location-1-slug]", label: "[LOCATION_1]", region: "ESSEX", desc: "Our original home clinic, serving Essex and East London with our full treatment menu." },
    { slug: "[location-2-slug]", label: "[LOCATION_2]", region: "LONDON · NEW", desc: "Now open in the heart of London. Premium flat-rate pricing for all treatments." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: "100%", maxWidth: 680, textAlign: "center" }}>
        <a href={BASE} style={{ display: "inline-block", marginBottom: 48, textDecoration: "none" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", letterSpacing: "0.15em", color: "#5C1A1A", lineHeight: 1 }}>[CLIENT]</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "0.35em", color: "#C9A96E", textTransform: "uppercase" }}>BEAUTY</div>
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
  const [groups, setGroups] = useState<TreatmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [activeTreatment, setActiveTreatment] = useState<ApiTreatment | null>(null);

  const locationId = LOCATION_IDS[locationSlug];
  const locationLabel = locationSlug === "[location-1-slug]" ? "[LOCATION_1]" : "[LOCATION_2]";

  useEffect(() => {
    if (!locationId) { setLoading(false); return; }
    fetch(`/api/treatments?locationId=${locationId}`)
      .then((r) => r.json())
      .then((data: ApiTreatment[]) => {
        const groupMap = new Map<string, ApiTreatment[]>();
        for (const t of data) {
          const cat = t.category || "Other";
          if (!groupMap.has(cat)) groupMap.set(cat, []);
          groupMap.get(cat)!.push(t);
        }
        const gs: TreatmentGroup[] = Array.from(groupMap.entries()).map(([category, items]) => ({ category, items }));
        setGroups(gs);
        if (initialTreatmentId) {
          const found = data.find((t) => t.id === initialTreatmentId || t.name === initialTreatmentId);
          if (found) setActiveTreatment(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locationId, initialTreatmentId]);

  const toggleGroup = (cat: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const fmtPrice = (p: number) => `£${p}`;
  const fmtDuration = (m: number) => m >= 60 ? `${Math.floor(m / 60)}hr${m % 60 ? ` ${m % 60}m` : ""}` : `${m} mins`;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #F0EAE2", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href={BASE} style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", letterSpacing: "0.15em", color: "#5C1A1A", lineHeight: 1 }}>[CLIENT]</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, letterSpacing: "0.35em", color: "#C9A96E", textTransform: "uppercase" }}>BEAUTY</div>
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

          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 28, height: 28, border: "2px solid #F0EAE2", borderTopColor: "#5C1A1A", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#737373" }}>Loading treatments…</p>
            </div>
          )}

          {!loading && groups.length === 0 && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#737373", textAlign: "center", padding: "40px 0" }}>
              No treatments available for this location yet.
            </p>
          )}

          {groups.map((group) => (
            <div key={group.category} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggleGroup(group.category)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 20px", background: "#fff", border: "none", cursor: "pointer",
                  fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
                  color: "#3D3D3D",
                }}
              >
                {group.category.toUpperCase()}
                {openGroups.has(group.category) ? <ChevronUp size={14} color="#C9A96E" /> : <ChevronDown size={14} color="#C9A96E" />}
              </button>

              <AnimatePresence initial={false}>
                {openGroups.has(group.category) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    {group.items.map((t) => {
                      const isPoa = t.price === 0;
                      const bookBtnStyle = {
                        fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase" as const,
                        border: "1px solid #5C1A1A", background: "transparent", color: "#5C1A1A",
                        padding: "7px 16px", cursor: "pointer", transition: "all 0.2s",
                        textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" as const,
                      };
                      return (
                        <div
                          key={t.id}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "14px 20px", background: "#F5F0EB", marginBottom: 2, gap: 8,
                          }}
                        >
                          <div>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#3D3D3D" }}>{t.name}</span>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#737373", marginLeft: 8 }}>{fmtDuration(t.duration_minutes)}</span>
                            {isPoa && (
                              <div style={{ fontFamily: "'Inter', sans-serif", fontStyle: "italic", fontSize: 11, color: "#737373", marginTop: 3 }}>
                                Ask for pricing
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            {!isPoa && (
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.1rem", color: "#C9A96E" }}>
                                {fmtPrice(t.price)}
                              </span>
                            )}
                            {isPoa ? (
                              <a
                                href="https://wa.me/447701298985"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={bookBtnStyle}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#5C1A1A"; e.currentTarget.style.color = "#F5F0EB"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5C1A1A"; }}
                              >
                                BOOK
                              </a>
                            ) : (
                              <button
                                onClick={() => setActiveTreatment(t)}
                                style={bookBtnStyle}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#5C1A1A"; e.currentTarget.style.color = "#F5F0EB"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5C1A1A"; }}
                              >
                                BOOK
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>

      {activeTreatment && (
        <BookingModal
          treatment={{ name: activeTreatment.name, price: `£${activeTreatment.price}` }}
          onClose={() => setActiveTreatment(null)}
          locationId={LOCATION_IDS[locationSlug]}
          locationSlug={locationSlug}
        />
      )}
    </div>
  );
}

export default function BookPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const locationSlug = params.get("location") ?? "";
  const treatmentId = params.get("treatment") ?? "";

  if (!locationSlug) {
    return <LocationSelector />;
  }

  return <TreatmentPicker locationSlug={locationSlug} initialTreatmentId={treatmentId || undefined} />;
}
