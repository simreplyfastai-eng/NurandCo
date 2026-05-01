import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";

interface ApiTreatment { id: string; name: string; price: number; duration_minutes?: number | null; category: string; description?: string }
interface ProcessStep { title: string; description: string }
interface FaqItem { q: string; a: string }
interface PageConfig {
  eyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroMediaType: "image" | "video";
  heroMediaUrl: string;
  philosophy: string;
  process: ProcessStep[];
  included: string[];
  beforeAfterImages: string[];
  faq: FaqItem[];
}

const SLUG = "signature-lip-filler";
const CATEGORY_NAME = "Signature Lip Filler";
const LOCATION_SLUG = "nur-and-co";
const LOCATION_ID = "f2c78e92-66bd-4fca-8006-e31009edfa8f";

export default function TreatmentLipFiller() {
  const [cfg, setCfg] = useState<PageConfig | null>(null);
  const [variants, setVariants] = useState<ApiTreatment[]>([]);
  const [showSticky, setShowSticky] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeBooking, setActiveBooking] = useState<ApiTreatment | null>(null);

  useEffect(() => {
    fetch(`/api/treatment-page/${SLUG}?locationId=${LOCATION_ID}`)
      .then(r => r.json()).then(setCfg).catch(() => setCfg(null));
    fetch(`/api/treatments?locationId=${LOCATION_ID}`)
      .then(r => r.json()).then((all: ApiTreatment[]) => {
        setVariants(all.filter(t => t.category === CATEGORY_NAME));
      }).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!cfg) {
    return <div style={{minHeight:"100vh",background:"#FFFFFF"}}><Navbar /></div>;
  }

  const titleLines = cfg.heroTitle.split("\n");

  return (
    <div style={{ background: "#FFFFFF", color: "#0E0D0B", minHeight: "100vh" }}>
      <Navbar />

      <style>{`
        .tlf-hero { display: grid; grid-template-columns: 1.05fr 1fr; min-height: 92vh; }
        .tlf-hero-left { display: flex; flex-direction: column; justify-content: center; padding: 8rem 5rem 6rem 7rem; position: relative; }
        .tlf-hero-right { position: relative; overflow: hidden; background: #F2EFEA; }
        .tlf-hero-right::after { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, transparent 0%, transparent 60%, rgba(14,13,11,0.08) 100%); pointer-events: none; }
        .tlf-hero-media { width: 100%; height: 100%; object-fit: cover; animation: tlfKenBurns 22s ease-in-out infinite alternate; }
        @keyframes tlfKenBurns { 0% { transform: scale(1.0); } 100% { transform: scale(1.08); } }
        .tlf-eyebrow { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.4em; text-transform: uppercase; color: #B89968; margin-bottom: 2.5rem; display: inline-flex; align-items: center; gap: 14px; }
        .tlf-eyebrow::before { content: ""; display: inline-block; width: 28px; height: 1px; background: #B89968; }
        .tlf-hero-title { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: clamp(3.5rem, 7vw, 6.5rem); line-height: 0.95; letter-spacing: -0.02em; color: #0E0D0B; margin: 0 0 2rem; }
        .tlf-hero-title em { font-style: italic; font-weight: 300; display: block; }
        .tlf-hero-sub { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-style: italic; font-size: 1.35rem; line-height: 1.55; color: #3D3935; max-width: 460px; margin: 0; }
        .tlf-scroll-hint { position: absolute; bottom: 3rem; left: 7rem; font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 0.35em; text-transform: uppercase; color: #5A5248; display: flex; align-items: center; gap: 14px; }
        .tlf-scroll-hint::after { content: ""; display: inline-block; width: 40px; height: 1px; background: #B89968; }
        .tlf-philosophy { padding: 7rem 2.5rem; text-align: center; max-width: 860px; margin: 0 auto; position: relative; }
        .tlf-philosophy::before { content: ""; display: block; width: 1px; height: 60px; background: #B89968; margin: 0 auto 3rem; }
        .tlf-philosophy p { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300; font-size: clamp(1.4rem, 2.4vw, 1.95rem); line-height: 1.55; color: #0E0D0B; margin: 0; }
        .tlf-section { padding: 7rem 2.5rem; max-width: 1280px; margin: 0 auto; }
        .tlf-section-eyebrow { font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 0.4em; text-transform: uppercase; color: #B89968; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 14px; }
        .tlf-section-eyebrow::before { content: ""; display: inline-block; width: 28px; height: 1px; background: #B89968; }
        .tlf-section-title { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: clamp(2.5rem, 4.5vw, 3.75rem); line-height: 1.05; letter-spacing: -0.01em; color: #0E0D0B; margin: 0 0 4rem; max-width: 700px; }
        .tlf-section-title em { font-style: italic; }

        .tlf-variants { display: flex; flex-direction: column; gap: 0; border-top: 1px solid #E8E5DD; }
        .tlf-variant { display: grid; grid-template-columns: 80px 1fr auto auto; gap: 2rem; align-items: center; padding: 2.5rem 0; border-bottom: 1px solid #E8E5DD; transition: padding 0.4s ease, background 0.3s ease; }
        .tlf-variant:hover { padding-left: 1rem; padding-right: 1rem; background: #FAFAF7; }
        .tlf-variant-num { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300; font-size: 1.5rem; color: #B89968; }
        .tlf-variant-name { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 1.75rem; color: #0E0D0B; }
        .tlf-variant-meta { font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #5A5248; margin-top: 4px; }
        .tlf-variant-price { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 2rem; color: #0E0D0B; min-width: 80px; text-align: right; }
        .tlf-variant-cta { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.35em; text-transform: uppercase; color: #FFFFFF; background: #0E0D0B; border: none; padding: 14px 32px; cursor: pointer; transition: background 0.3s ease; }
        .tlf-variant-cta:hover { background: #3D3935; }

        .tlf-process { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; margin-top: 3rem; }
        .tlf-step { position: relative; padding-top: 2.5rem; border-top: 1px solid #B89968; }
        .tlf-step-num { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300; font-size: 3rem; color: #B89968; line-height: 1; margin-bottom: 1.5rem; }
        .tlf-step-title { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 1.5rem; color: #0E0D0B; margin: 0 0 1rem; }
        .tlf-step-desc { font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.7; color: #3D3935; margin: 0; }

        .tlf-included { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-top: 1px solid #E8E5DD; border-bottom: 1px solid #E8E5DD; }
        .tlf-included-col { padding: 3rem 1.5rem; border-right: 1px solid #E8E5DD; }
        .tlf-included-col:last-child { border-right: none; }
        .tlf-included-num { font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 0.4em; color: #B89968; margin-bottom: 1.5rem; }
        .tlf-included-text { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 1.25rem; line-height: 1.4; color: #0E0D0B; margin: 0; }

        .tlf-ba { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .tlf-ba-card { aspect-ratio: 3/4; background: #F2EFEA; position: relative; overflow: hidden; }
        .tlf-ba-card img { width: 100%; height: 100%; object-fit: cover; }
        .tlf-ba-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; font-family: 'Cormorant Garamond', serif; font-style: italic; color: #B89968; font-size: 1.25rem; }

        .tlf-faq { max-width: 860px; margin: 0 auto; }
        .tlf-faq-item { border-bottom: 1px solid #E8E5DD; }
        .tlf-faq-q { width: 100%; background: none; border: none; padding: 2rem 0; display: flex; justify-content: space-between; align-items: center; cursor: pointer; text-align: left; font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 1.4rem; color: #0E0D0B; }
        .tlf-faq-q-mark { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.5rem; color: #B89968; transition: transform 0.3s ease; }
        .tlf-faq-q[aria-expanded="true"] .tlf-faq-q-mark { transform: rotate(45deg); }
        .tlf-faq-a { padding: 0 0 2rem; font-family: 'Inter', sans-serif; font-size: 15px; line-height: 1.75; color: #3D3935; max-width: 720px; }

        .tlf-sticky { position: fixed; bottom: 2rem; right: 2rem; background: #0E0D0B; color: #FFFFFF; padding: 18px 32px; font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 0.35em; text-transform: uppercase; border: none; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity 0.4s ease, transform 0.4s ease; transform: translateY(20px); z-index: 50; box-shadow: 0 12px 40px rgba(0,0,0,0.18); border-radius: 100px; }
        .tlf-sticky.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
        .tlf-sticky:hover { background: #3D3935; }

        @media (max-width: 900px) {
          .tlf-hero { grid-template-columns: 1fr; }
          .tlf-hero-left { padding: 6rem 1.5rem 4rem; }
          .tlf-hero-right { min-height: 60vh; }
          .tlf-scroll-hint { display: none; }
          .tlf-section { padding: 5rem 1.5rem; }
          .tlf-process { grid-template-columns: 1fr; gap: 2rem; }
          .tlf-included { grid-template-columns: 1fr 1fr; }
          .tlf-included-col { border-bottom: 1px solid #E8E5DD; }
          .tlf-included-col:nth-child(2) { border-right: none; }
          .tlf-ba { grid-template-columns: 1fr; }
          .tlf-variant { grid-template-columns: 50px 1fr; gap: 1rem; }
          .tlf-variant-meta, .tlf-variant-price { grid-column: 2; }
          .tlf-variant-cta { grid-column: 2; justify-self: start; }
        }
      `}</style>

      <section className="tlf-hero">
        <div className="tlf-hero-left">
          <div className="tlf-eyebrow">{cfg.eyebrow}</div>
          <h1 className="tlf-hero-title">
            {titleLines[0]}
            {titleLines[1] && <em>{titleLines[1]}</em>}
          </h1>
          <p className="tlf-hero-sub">{cfg.heroSubtitle}</p>
          <div className="tlf-scroll-hint">Scroll to explore</div>
        </div>
        <div className="tlf-hero-right">
          {cfg.heroMediaUrl ? (
            cfg.heroMediaType === "video" ? (
              <video className="tlf-hero-media" src={cfg.heroMediaUrl} autoPlay muted loop playsInline />
            ) : (
              <img className="tlf-hero-media" src={cfg.heroMediaUrl} alt="" />
            )
          ) : null}
        </div>
      </section>

      <section className="tlf-philosophy">
        <p>"{cfg.philosophy}"</p>
      </section>

      <section className="tlf-section" id="treatments">
        <div className="tlf-section-eyebrow">The Menu</div>
        <h2 className="tlf-section-title">Choose your <em>treatment</em>.</h2>
        <div className="tlf-variants">
          {variants.map((v, i) => (
            <div key={v.id} className="tlf-variant">
              <div className="tlf-variant-num">0{i+1}</div>
              <div>
                <div className="tlf-variant-name">{v.name}</div>
                <div className="tlf-variant-meta">{v.duration_minutes ? `${v.duration_minutes} mins` : ""}</div>
              </div>
              <div className="tlf-variant-price">£{v.price}</div>
              <button className="tlf-variant-cta" onClick={() => setActiveBooking(v)}>Book</button>
            </div>
          ))}
          {variants.length === 0 && <div style={{padding:"3rem 0",fontFamily:"Cormorant Garamond, serif",fontStyle:"italic",color:"#5A5248"}}>Treatments loading…</div>}
        </div>
      </section>

      <section style={{background:"#FAFAF7"}}>
        <div className="tlf-section">
          <div className="tlf-section-eyebrow">The Process</div>
          <h2 className="tlf-section-title">Three steps. <em>Considered throughout.</em></h2>
          <div className="tlf-process">
            {cfg.process.map((step, i) => (
              <div key={i} className="tlf-step">
                <div className="tlf-step-num">0{i+1}</div>
                <h3 className="tlf-step-title">{step.title}</h3>
                <p className="tlf-step-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tlf-section">
        <div className="tlf-section-eyebrow">What's Included</div>
        <h2 className="tlf-section-title">Every appointment, <em>complete.</em></h2>
        <div className="tlf-included">
          {cfg.included.map((it, i) => (
            <div key={i} className="tlf-included-col">
              <div className="tlf-included-num">0{i+1}</div>
              <p className="tlf-included-text">{it}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="tlf-section">
        <div className="tlf-section-eyebrow">Results</div>
        <h2 className="tlf-section-title">Honest, <em>unfiltered.</em></h2>
        <div className="tlf-ba">
          {[0,1].map(i => (
            <div key={i} className="tlf-ba-card">
              {cfg.beforeAfterImages?.[i] ? (
                <img src={cfg.beforeAfterImages[i]} alt="" />
              ) : (
                <div className="tlf-ba-placeholder">Before & After</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="tlf-section">
        <div className="tlf-section-eyebrow">FAQ</div>
        <h2 className="tlf-section-title">The <em>questions</em> we hear most.</h2>
        <div className="tlf-faq">
          {cfg.faq.map((item, i) => (
            <div key={i} className="tlf-faq-item">
              <button className="tlf-faq-q" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{item.q}</span>
                <span className="tlf-faq-q-mark">+</span>
              </button>
              {openFaq === i && <div className="tlf-faq-a">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      <button className={`tlf-sticky ${showSticky ? "show" : ""}`} onClick={() => { document.getElementById("treatments")?.scrollIntoView({behavior:"smooth"}); }}>
        Book Lip Filler →
      </button>

      {activeBooking && (
        <BookingModal
          treatment={{
            id: activeBooking.id,
            name: activeBooking.name,
            price: `£${activeBooking.price}`,
            durationMins: activeBooking.duration_minutes ?? undefined
          }}
          onClose={() => setActiveBooking(null)}
          locationId={LOCATION_ID}
          locationSlug={LOCATION_SLUG}
        />
      )}

      <Footer />
    </div>
  );
}
