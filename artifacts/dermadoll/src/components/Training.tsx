import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import trainingPathwayImg from "@/assets/training-pathway.jpg";

function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("/objects/"))
    return `/api/media/serve?path=${encodeURIComponent(path)}`;
  return path;
}

interface Graduate {
  slot: number;
  name: string;
  course: string;
  src: string;
}

const DEFAULT_GRADUATES: Graduate[] = [
  { slot: 1, name: "Sarah M.", course: "Foundation Anti-Wrinkle", src: "" },
  { slot: 2, name: "Jessica T.", course: "Advanced Dermal Filler", src: "" },
  { slot: 3, name: "Priya K.", course: "Pathway to Aesthetics", src: "" },
];

const COURSES = [
  {
    name: "Pathway to Aesthetics",
    price: "£2,000",
    deposit: "£300 deposit",
    detail: "3-day course · Max 3 students",
    highlight: true,
    inclusions: [
      "Level 3 Anatomy & Physiology",
      "First Aid",
      "Complications Management",
      "Hyalase Dissolving",
      "Dermaplaning",
      "Microneedling",
      "Foundation Dermal Filler",
      "Foundation Anti-Wrinkle",
      "B12",
      "Insurance & Prescriber Advice",
      "24/7 Ongoing Support",
      "Pre-Study Materials",
    ],
  },
  { name: "Foundation Anti-Wrinkle & Tox", price: "£1,300", deposit: null, detail: "1-day course", highlight: false, inclusions: [] },
  { name: "Advanced Dermal Filler", price: "£600", deposit: null, detail: "1-day course", highlight: false, inclusions: [] },
  { name: "Advanced Anti-Wrinkle", price: "£600", deposit: null, detail: "1-day course", highlight: false, inclusions: [] },
  { name: "Skin Boosters & Polynucleotides", price: "£600", deposit: null, detail: "1-day course", highlight: false, inclusions: [] },
  { name: "Glass Skin Facial & Microneedling", price: "£700", deposit: null, detail: "1-day course", highlight: false, inclusions: [] },
  { name: "Russian Lip Masterclass", price: "£600", deposit: null, detail: "1-day course", highlight: false, inclusions: [] },
];

const COURSE_NAMES = COURSES.map((c) => c.name);

function validateEnquiryName(v: string) {
  if (!v.trim()) return "Please enter your full name";
  return "";
}
function validateEnquiryEmail(v: string) {
  if (!v.trim()) return "Please enter your email address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Please enter a valid email address";
  return "";
}
function validateEnquiryPhone(v: string) {
  const s = v.replace(/\s/g, "");
  if (!s) return "Please enter your phone number";
  if (!/^(\+447\d{9}|07\d{9})$/.test(s)) return "Please enter a valid UK phone number";
  return "";
}

export default function Training() {
  const [showForm, setShowForm] = useState(false);
  const [preselect, setPreselect] = useState("");
  const [graduates, setGraduates] = useState<Graduate[]>(DEFAULT_GRADUATES);

  const [enqName, setEnqName] = useState("");
  const [enqEmail, setEnqEmail] = useState("");
  const [enqPhone, setEnqPhone] = useState("");
  const [enqCourse, setEnqCourse] = useState("");
  const [enqMessage, setEnqMessage] = useState("");

  const [enqNameErr, setEnqNameErr] = useState("");
  const [enqEmailErr, setEnqEmailErr] = useState("");
  const [enqPhoneErr, setEnqPhoneErr] = useState("");
  const [enqCourseErr, setEnqCourseErr] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/media/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.graduates && Array.isArray(data.graduates) && data.graduates.length === 3) {
          setGraduates(
            data.graduates.map((g: Partial<Graduate>, i: number) => ({
              slot: g.slot ?? i + 1,
              name: g.name || DEFAULT_GRADUATES[i].name,
              course: g.course || DEFAULT_GRADUATES[i].course,
              src: mediaUrl(g.src || "") || "",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const openForm = (courseName?: string) => {
    setPreselect(courseName ?? "");
    setEnqCourse(courseName ?? "");
    setEnqNameErr(""); setEnqEmailErr(""); setEnqPhoneErr(""); setEnqCourseErr("");
    setSubmitError("");
    setSubmitted(false);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("training-enquiry-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleSubmit = async () => {
    const nErr = validateEnquiryName(enqName);
    const eErr = validateEnquiryEmail(enqEmail);
    const pErr = validateEnquiryPhone(enqPhone);
    const cErr = enqCourse ? "" : "Please select a course";
    setEnqNameErr(nErr); setEnqEmailErr(eErr); setEnqPhoneErr(pErr); setEnqCourseErr(cErr);
    if (nErr || eErr || pErr || cErr) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: enqName.trim(),
          email: enqEmail.trim(),
          phone: enqPhone.replace(/\s/g, ""),
          course: enqCourse,
          message: enqMessage.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSubmitError((d as { error?: string }).error ?? "Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inp = (hasErr: boolean): React.CSSProperties => ({
    width: "100%", border: `1px solid ${hasErr ? "#C62828" : "#E0E0E0"}`,
    borderRadius: "8px", padding: "12px 14px", fontSize: "14px",
    fontFamily: "Inter, sans-serif", outline: "none",
    boxSizing: "border-box" as const,
  });

  const lbl: React.CSSProperties = {
    display: "block", fontSize: "11px", textTransform: "uppercase",
    letterSpacing: "0.08em", color: "#888", marginBottom: "6px",
    fontFamily: "Inter, sans-serif",
  };

  return (
    <section id="training" className="py-14 md:py-[100px] bg-secondary">
      <style>{`
        .courses-scroll::-webkit-scrollbar { display: none; }
        .graduates-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 767px) {
          .courses-scroll {
            display: flex !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            gap: 12px !important;
            padding-bottom: 8px;
          }
          .courses-scroll .course-card-m {
            min-width: 200px !important;
            max-width: 200px !important;
            flex-shrink: 0 !important;
            border-radius: 12px !important;
            border: 1px solid #E8E0D0 !important;
            padding: 16px !important;
            box-shadow: none !important;
          }
          .courses-scroll .card-name {
            font-family: 'Cormorant Garamond', serif !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            margin-bottom: 4px !important;
            line-height: 1.3 !important;
          }
          .courses-scroll .card-detail {
            font-family: Inter, sans-serif !important;
            font-size: 11px !important;
            color: #AAAAAA !important;
            margin-bottom: 8px !important;
          }
          .courses-scroll .card-price {
            font-family: 'Cormorant Garamond', serif !important;
            font-size: 20px !important;
            color: #C9A96E !important;
            font-weight: 700 !important;
            margin-bottom: 12px !important;
          }
          .courses-scroll .card-btn {
            width: 100% !important;
            border: 1px solid #C9A96E !important;
            color: #C9A96E !important;
            font-family: Inter, sans-serif !important;
            font-size: 11px !important;
            border-radius: 20px !important;
            padding: 8px !important;
            background: white !important;
            letter-spacing: normal !important;
            text-transform: uppercase;
          }
          .graduates-scroll {
            display: flex !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            gap: 12px !important;
            padding-bottom: 8px;
          }
          .graduates-scroll .grad-card {
            min-width: 260px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>

      <div className="container mx-auto px-6 max-w-5xl">

        {/* Section header */}
        <div className="text-center mb-10 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-serif text-[1.75rem] md:text-[56px] mb-4 md:mb-5"
          >
            Training Courses
          </motion.h2>
          <div className="w-[60px] h-px bg-primary mx-auto mb-4 md:mb-5" />
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-light text-sm md:text-lg max-w-2xl mx-auto"
            style={{ color: "#C9A96E" }}
          >
            CPD accredited · No background needed · Birmingham & Solihull
          </motion.p>
        </div>

        {/* Pathway to Aesthetics — promotional image */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex justify-center mb-8 md:mb-12"
        >
          <img
            src={trainingPathwayImg}
            alt="Pathway to Aesthetics — Dermadoll Training Course"
            className="w-full max-w-sm md:max-w-md lg:max-w-lg rounded-2xl shadow-lg object-cover"
            style={{ display: "block" }}
          />
        </motion.div>

        {/* Pathway to Aesthetics — featured card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white p-5 md:p-12 shadow-sm rounded-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-20"
        >
          <div>
            <h3 className="font-serif text-lg md:text-2xl mb-3 md:mb-6 border-b border-primary/20 pb-3 md:pb-4">What's included</h3>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-2 md:gap-y-4">
              {COURSES[0].inclusions.map((item, i) => (
                <li key={i} className="flex items-start gap-2 md:gap-3">
                  <Check className="text-primary mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-foreground/80 font-light text-[13px] leading-[1.6] md:text-base md:leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col h-full">
            <div className="mb-4 md:mb-8">
              <h3 className="font-serif text-lg md:text-2xl mb-3 md:mb-6 border-b border-primary/20 pb-3 md:pb-4">
                Pathway to Aesthetics
              </h3>
              <div className="font-serif text-3xl md:text-5xl text-primary mb-3 md:mb-6">£2,000</div>
              <ul className="space-y-2 md:space-y-4 text-foreground/80 font-light text-[13px] md:text-base mb-4 md:mb-8">
                <li><strong className="font-medium text-foreground">Add-on:</strong> Skin Boosters or Advanced Dermal Filler +£500</li>
                <li><strong className="font-medium text-foreground">Duration:</strong> 3-day course | Max 3 students</li>
                <li><strong className="font-medium text-foreground">Location:</strong> Birmingham | Solihull</li>
                <li><strong className="font-medium text-foreground">Deposit:</strong> £300 deposit secures your place</li>
                <li><strong className="font-medium text-foreground">Finance:</strong> Finance options available</li>
              </ul>
              <p className="font-serif italic text-sm md:text-xl text-primary/80 mb-4 md:mb-8">
                "Real models. Real experience. Real confidence."
              </p>
            </div>
            <div className="mt-auto">
              <button
                onClick={() => openForm("Pathway to Aesthetics")}
                className="block w-full text-center bg-primary text-white px-8 py-3 md:py-4 rounded-full text-xs md:text-sm uppercase tracking-wider font-medium hover:bg-primary/90 transition-colors duration-300"
              >
                Enquire Now
              </button>
            </div>
          </div>
        </motion.div>

        {/* Other 6 courses — grid on desktop, horizontal scroll on mobile */}
        <div className="relative mb-10 md:mb-14">
          <div
            className="courses-scroll grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            style={{ scrollbarWidth: "none" } as React.CSSProperties}
          >
            {COURSES.slice(1).map((course, i) => (
              <motion.div
                key={course.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="course-card-m bg-white p-6 shadow-sm rounded-sm flex flex-col"
              >
                <h4 className="card-name font-serif text-base md:text-lg mb-2 leading-snug">{course.name}</h4>
                <p className="card-detail text-xs text-foreground/50 mb-3 font-light" style={{ fontFamily: "Inter, sans-serif" }}>{course.detail}</p>
                <div className="card-price font-serif text-2xl text-primary mb-4">{course.price}</div>
                <div className="mt-auto">
                  <button
                    onClick={() => openForm(course.name)}
                    className="card-btn w-full text-center border border-primary text-primary px-6 py-2.5 rounded-full text-xs uppercase tracking-wider font-medium hover:bg-primary hover:text-white transition-colors duration-300"
                  >
                    Enquire
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Scroll fade hint — mobile only */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 md:hidden"
            style={{ background: "linear-gradient(to right, transparent, #FAF9F7)" }}
          />
        </div>

        {/* Our Graduates */}
        <div className="mb-10 md:mb-16">
          <div className="text-center mb-10">
            <motion.h3
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", color: "#111111", marginBottom: "8px", fontWeight: 700 }}
            >
              Our Graduates
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#C9A96E", fontStyle: "italic", letterSpacing: "1px" }}
            >
              Real students. Real results. Real careers.
            </motion.p>
          </div>

          {/* Photo strip */}
          <div className="relative">
            <div
              className="graduates-scroll grid md:grid-cols-3 gap-4"
              style={{ scrollbarWidth: "none" } as React.CSSProperties}
            >
              {graduates.map((grad, i) => (
                <motion.div
                  key={grad.slot}
                  className="grad-card"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.4 } }}
                  style={{
                    position: "relative",
                    borderRadius: "16px",
                    overflow: "hidden",
                    aspectRatio: "3 / 4",
                  }}
                >
                  {/* Image or placeholder */}
                  {grad.src ? (
                    <img
                      src={grad.src}
                      alt={grad.name}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: "#1A1A1A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.2">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#C9A96E", textAlign: "center", padding: "0 16px" }}>
                        Graduate photo coming soon
                      </span>
                    </div>
                  )}

                  {/* Gold corner — top-left */}
                  <div style={{ position: "absolute", top: "12px", left: "12px", width: "20px", height: "2px", background: "#C9A96E", zIndex: 2 }} />
                  <div style={{ position: "absolute", top: "12px", left: "12px", width: "2px", height: "20px", background: "#C9A96E", zIndex: 2 }} />

                  {/* Gold corner — bottom-right */}
                  <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "20px", height: "2px", background: "#C9A96E", zIndex: 2 }} />
                  <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "2px", height: "20px", background: "#C9A96E", zIndex: 2 }} />

                </motion.div>
              ))}
            </div>

            {/* Mobile scroll fade */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-10 md:hidden"
              style={{ background: "linear-gradient(to right, transparent, #FAF9F7)" }}
            />
          </div>

          {/* Quote */}
          <motion.p
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "20px",
              fontStyle: "italic",
              color: "#C9A96E",
              textAlign: "center",
              marginTop: "40px",
            }}
          >
            "Join the next generation of aesthetic professionals."
          </motion.p>
        </div>

        {/* Enquiry form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              id="training-enquiry-form"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4 }}
              className="bg-white p-6 md:p-10 shadow-sm rounded-sm"
            >
              {submitted ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full" style={{ backgroundColor: "rgba(201,169,110,0.12)" }}>
                    <Check className="text-primary" size={24} />
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl mb-2">Enquiry Sent</h3>
                  <p className="text-sm text-foreground/60 mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
                    Thank you! We'll be in touch shortly with more details and available dates.
                  </p>
                  <button
                    onClick={() => { setShowForm(false); setSubmitted(false); setEnqName(""); setEnqEmail(""); setEnqPhone(""); setEnqCourse(""); setEnqMessage(""); }}
                    className="text-sm uppercase tracking-wider font-medium"
                    style={{ color: "#C9A96E", fontFamily: "Inter, sans-serif" }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-serif text-xl md:text-2xl mb-1">Training Enquiry</h3>
                  <p className="text-sm text-foreground/60 mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
                    Fill in your details and we'll be in touch with available dates and next steps.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label style={lbl}>Full Name *</label>
                      <input
                        type="text" value={enqName} placeholder="Jane Smith"
                        onChange={(e) => { setEnqName(e.target.value); if (enqNameErr) setEnqNameErr(""); }}
                        style={inp(!!enqNameErr)}
                      />
                      {enqNameErr && <p style={{ color: "#C62828", fontSize: "12px", marginTop: "4px", fontFamily: "Inter, sans-serif" }}>{enqNameErr}</p>}
                    </div>
                    <div>
                      <label style={lbl}>Email Address *</label>
                      <input
                        type="email" value={enqEmail} placeholder="jane@email.com"
                        onChange={(e) => { setEnqEmail(e.target.value); if (enqEmailErr) setEnqEmailErr(""); }}
                        style={inp(!!enqEmailErr)}
                      />
                      {enqEmailErr && <p style={{ color: "#C62828", fontSize: "12px", marginTop: "4px", fontFamily: "Inter, sans-serif" }}>{enqEmailErr}</p>}
                    </div>
                    <div>
                      <label style={lbl}>Phone Number *</label>
                      <input
                        type="tel" value={enqPhone} placeholder="07700 900000"
                        onChange={(e) => { setEnqPhone(e.target.value); if (enqPhoneErr) setEnqPhoneErr(""); }}
                        style={inp(!!enqPhoneErr)}
                      />
                      {enqPhoneErr && <p style={{ color: "#C62828", fontSize: "12px", marginTop: "4px", fontFamily: "Inter, sans-serif" }}>{enqPhoneErr}</p>}
                    </div>
                    <div>
                      <label style={lbl}>Course Interested In *</label>
                      <select
                        value={enqCourse}
                        onChange={(e) => { setEnqCourse(e.target.value); if (enqCourseErr) setEnqCourseErr(""); }}
                        style={{ ...inp(!!enqCourseErr), color: enqCourse ? "#111" : "#aaa", appearance: "auto" as const }}
                      >
                        <option value="" disabled>Select a course…</option>
                        {COURSE_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      {enqCourseErr && <p style={{ color: "#C62828", fontSize: "12px", marginTop: "4px", fontFamily: "Inter, sans-serif" }}>{enqCourseErr}</p>}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label style={lbl}>Message (optional)</label>
                    <textarea
                      value={enqMessage} rows={3}
                      placeholder="Any questions or anything you'd like us to know…"
                      onChange={(e) => setEnqMessage(e.target.value)}
                      style={{ ...inp(false), resize: "vertical" }}
                    />
                  </div>

                  {submitError && (
                    <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#FFF3F3", color: "#C62828", border: "1px solid #FFCDD2", fontFamily: "Inter, sans-serif" }}>
                      {submitError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 py-3.5 text-white text-sm uppercase tracking-wider font-medium rounded-full transition-all hover:opacity-90"
                      style={{ backgroundColor: "#C9A96E", fontFamily: "Inter, sans-serif", opacity: submitting ? 0.7 : 1 }}
                    >
                      {submitting ? "Sending…" : "Send Enquiry"}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-6 py-3.5 text-sm uppercase tracking-wider font-medium rounded-full border border-primary/30 hover:bg-primary/5 transition-all"
                      style={{ color: "#888", fontFamily: "Inter, sans-serif" }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
