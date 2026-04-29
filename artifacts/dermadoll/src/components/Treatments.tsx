import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { num: "01", name: "Dermal Fillers", desc: "Restore volume \u00b7 sculpt natural contours", items: [
    { name: "Lip Enhancement", time: "45 min", price: "From \u00a3179", desc: "Natural volume using premium hyaluronic acid fillers" },
    { name: "Cheek Sculpting", time: "45 min", price: "From \u00a3249", desc: "Restore youthful volume and define cheekbone structure" },
    { name: "Jawline Contouring", time: "60 min", price: "From \u00a3299", desc: "Sharp, defined jawline through precise filler placement" },
    { name: "Chin Augmentation", time: "30 min", price: "From \u00a3249", desc: "Balanced profile proportions without surgery" },
    { name: "Nasolabial Folds", time: "30 min", price: "From \u00a3199", desc: "Soften smile lines for a refreshed appearance" },
  ]},
  { num: "02", name: "Anti-Wrinkle", desc: "Smooth fine lines \u00b7 prevent future creasing", items: [
    { name: "Forehead & Frown", time: "20 min", price: "From \u00a3149", desc: "Relax dynamic wrinkles across the upper face" },
    { name: "Crow\u2019s Feet", time: "15 min", price: "From \u00a399", desc: "Soften lines around the eyes" },
    { name: "Full Face Anti-Wrinkle", time: "30 min", price: "From \u00a3249", desc: "Comprehensive upper face \u2014 3 areas" },
    { name: "Brow Lift", time: "15 min", price: "From \u00a3149", desc: "Subtle elevation for a refreshed eye area" },
  ]},
  { num: "03", name: "Skin Treatments", desc: "Clinical-grade radiance \u00b7 lasting glow", items: [
    { name: "Profhilo", time: "30 min", price: "From \u00a3299", desc: "Bio-remodelling for deep hydration and skin tightening" },
    { name: "Microneedling", time: "45 min", price: "From \u00a3199", desc: "Stimulate collagen for smoother, firmer skin" },
    { name: "Chemical Peel", time: "30 min", price: "From \u00a3129", desc: "Targeted exfoliation for brighter, even-toned skin" },
    { name: "PRP Facial", time: "60 min", price: "From \u00a3349", desc: "Platelet-rich plasma for natural regeneration" },
  ]},
  { num: "04", name: "Advanced", desc: "Bespoke procedures \u00b7 transformative results", items: [
    { name: "Non-Surgical Rhinoplasty", time: "30 min", price: "From \u00a3349", desc: "Reshape nasal contours without downtime" },
    { name: "Fat Dissolving", time: "30 min", price: "From \u00a3249", desc: "Targeted reduction of stubborn fat deposits" },
    { name: "Skin Boosters", time: "30 min", price: "From \u00a3199", desc: "Deep hydration for glass-like luminosity" },
  ]},
];

export default function Treatments() {
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (i: number) => setOpen(open === i ? null : i);

  return (
    <section id="treatments" style={{ background: "#FFFFFF", padding: "120px 0 100px", position: "relative" }}>
      <style>{`
        .tr-wrap { max-width: 960px; margin: 0 auto; padding: 0 32px; }
        .tr-eyebrow { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 400; letter-spacing: 0.4em; text-transform: uppercase; color: #B89968; text-align: center; margin-bottom: 20px; }
        .tr-title { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300; font-size: clamp(2.4rem, 5vw, 3.6rem); text-align: center; color: #0E0D0B; margin: 0 0 16px; line-height: 1.05; letter-spacing: -0.005em; }
        .tr-sub { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 300; color: #5A5248; text-align: center; margin: 0 auto 20px; max-width: 420px; line-height: 1.7; }
        .tr-divider { width: 60px; height: 1px; background: #B89968; margin: 0 auto 72px; }

        /* Accordion category */
        .tr-cat { border-top: 1px solid #E8E5DD; transition: background 0.4s ease; position: relative; }
        .tr-cat:last-of-type { border-bottom: 1px solid #E8E5DD; }
        .tr-cat.open { background: linear-gradient(180deg, rgba(184,153,104,0.025) 0%, rgba(255,255,255,0) 100%); }
        .tr-cat::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 0;
          background: #B89968; transition: width 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .tr-cat.open::before { width: 2px; }

        .tr-header { display: grid; grid-template-columns: 60px 1fr auto; gap: 24px; align-items: center; padding: 32px 0 32px 24px; cursor: pointer; user-select: none; transition: padding 0.3s ease; }
        .tr-header:hover .tr-cat-name { color: #B89968; }
        .tr-header:hover .tr-num { color: #B89968; }

        .tr-num {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-weight: 300;
          font-size: 1.4rem; color: #B89968;
          opacity: 0.5;
          transition: all 0.3s ease;
          letter-spacing: 0.05em;
        }
        .tr-cat.open .tr-num { opacity: 1; color: #B89968; }

        .tr-cat-name {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-weight: 400;
          font-size: clamp(1.5rem, 2.8vw, 2rem);
          color: #0E0D0B;
          transition: color 0.3s ease; margin: 0; line-height: 1.1;
        }
        .tr-cat-desc {
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 300; color: #5A5248;
          margin-top: 6px; letter-spacing: 0.04em;
        }

        /* Plus/minus indicator */
        .tr-toggle {
          width: 32px; height: 32px;
          border: 1px solid #E8E5DD; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
          position: relative; flex-shrink: 0;
        }
        .tr-cat.open .tr-toggle { background: #B89968; border-color: #B89968; transform: rotate(180deg); }
        .tr-toggle::before, .tr-toggle::after {
          content: ''; position: absolute;
          background: #0E0D0B; transition: all 0.3s ease;
        }
        .tr-toggle::before { width: 10px; height: 1px; }
        .tr-toggle::after { width: 1px; height: 10px; }
        .tr-cat.open .tr-toggle::before { background: #FFFFFF; }
        .tr-cat.open .tr-toggle::after { opacity: 0; }

        /* Items */
        .tr-items { overflow: hidden; }
        .tr-items-inner { padding: 0 0 36px 84px; }

        .tr-row {
          display: grid; grid-template-columns: 1fr auto auto;
          gap: 24px; align-items: center;
          padding: 18px 0;
          border-top: 1px solid rgba(232,229,221,0.6);
          cursor: pointer;
          transition: padding 0.3s ease;
          position: relative;
        }
        .tr-row::after {
          content: '\\2192';
          position: absolute;
          right: -28px;
          font-family: 'Inter', sans-serif;
          color: #B89968;
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s ease;
        }
        .tr-row:hover { padding-left: 8px; }
        .tr-row:hover::after { opacity: 1; transform: translateX(0); }
        .tr-row:hover .tr-name { color: #B89968; }

        .tr-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem; color: #0E0D0B;
          transition: color 0.3s ease;
          letter-spacing: -0.005em;
        }
        .tr-rdesc {
          font-family: 'Inter', sans-serif;
          font-size: 11px; color: #5A5248;
          margin-top: 4px; font-weight: 300;
          line-height: 1.6;
        }
        .tr-time {
          font-family: 'Inter', sans-serif;
          font-size: 10px; color: #B89968;
          letter-spacing: 0.15em; text-transform: uppercase;
          white-space: nowrap;
        }
        .tr-price {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-weight: 400;
          font-size: 1.1rem; color: #B89968;
          white-space: nowrap; min-width: 90px; text-align: right;
        }

        /* CTA */
        .tr-cta { text-align: center; margin-top: 80px; }
        .tr-cta-line { width: 1px; height: 40px; background: #E8E5DD; margin: 0 auto 32px; }
        .tr-cta-text {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-size: 1.4rem; font-weight: 300;
          color: #0E0D0B; margin-bottom: 28px;
        }
        .tr-btn {
          font-family: 'Inter', sans-serif;
          font-size: 10px; font-weight: 400;
          letter-spacing: 0.35em; text-transform: uppercase;
          color: #0E0D0B;
          border: 1px solid #B89968;
          background: #B89968; color: #FFFFFF !important;
          padding: 18px 56px;
          background: transparent; cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none; display: inline-block;
          position: relative; overflow: hidden;
        }
        .tr-btn::before {
          content: ''; position: absolute; inset: 0;
          background: #0E0D0B;
          transform: translateX(-100%);
          transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .tr-btn span { position: relative; z-index: 1; transition: color 0.3s ease; }
        .tr-btn:hover::before { transform: translateX(0); }
        .tr-btn:hover span { color: #FFFFFF; }

        @media (max-width: 720px) {
          .tr-header { grid-template-columns: 40px 1fr auto; padding: 24px 0 24px 12px; gap: 16px; }
          .tr-num { font-size: 1.1rem; }
          .tr-items-inner { padding: 0 0 28px 56px; }
          .tr-row { grid-template-columns: 1fr auto; gap: 12px; }
          .tr-time { display: none; }
          .tr-rdesc { display: none; }
        }
      `}</style>

      <div className="tr-wrap">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}>
          <div className="tr-eyebrow">Treatment Menu</div>
          <h2 className="tr-title">Considered aesthetics.</h2>
          <p className="tr-sub">Every treatment tailored to your unique anatomy. No templates, no shortcuts \u2014 only precision and care.</p>
          <div className="tr-divider" />
        </motion.div>

        {CATEGORIES.map((cat, i) => (
          <div key={cat.name} className={`tr-cat ${open === i ? "open" : ""}`}>
            <div className="tr-header" onClick={() => toggle(i)}>
              <span className="tr-num">{cat.num}</span>
              <div>
                <h3 className="tr-cat-name">{cat.name}</h3>
                <div className="tr-cat-desc">{cat.desc}</div>
              </div>
              <div className="tr-toggle" />
            </div>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  className="tr-items"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div className="tr-items-inner">
                    {cat.items.map((t, idx) => (
                      <motion.div
                        key={t.name}
                        className="tr-row"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 + idx * 0.06 }}
                        onClick={() => document.querySelector("#book")?.scrollIntoView({ behavior: "smooth" })}
                      >
                        <div>
                          <div className="tr-name">{t.name}</div>
                          <div className="tr-rdesc">{t.desc}</div>
                        </div>
                        <span className="tr-time">{t.time}</span>
                        <span className="tr-price">{t.price}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        <div className="tr-cta">
          <div className="tr-cta-line" />
          <div className="tr-cta-text">Begin your transformation.</div>
          <a href="#book" className="tr-btn"><span>Book Consultation</span></a>
        </div>
      </div>
    </section>
  );
}
