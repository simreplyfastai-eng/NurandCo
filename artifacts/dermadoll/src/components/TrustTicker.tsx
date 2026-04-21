export default function TreatmentMarquee() {
  const row1 = ["Cheek Filler", "Skin Booster", "Polynucleotides", "Lip Blush", "Wisp Hybrids", "Anti-Wrinkle", "Tear Trough", "Jaw Filler"];
  const row2 = ["Skin Booster", "NaturalèLips™", "Polynucleotides", "Facial Contouring", "Dermaplaning", "Microneedling", "B12 Injections", "Profhilo"];

  const sep = <span style={{ color: "#C9A96E", margin: "0 20px", fontSize: 10 }}>✦</span>;

  return (
    <>
      <style>{`
        @keyframes marquee-ltr { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marquee-rtl { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .mq-ltr { animation: marquee-ltr 30s linear infinite; display: inline-flex; align-items: center; }
        .mq-rtl { animation: marquee-rtl 30s linear infinite; display: inline-flex; align-items: center; }
        .mq-ltr:hover, .mq-rtl:hover { animation-play-state: paused; }
      `}</style>

      <div style={{ background: "#5C1A1A", overflow: "hidden" }}>
        <div style={{ borderBottom: "1px solid rgba(201,169,110,0.25)", padding: "16px 0", overflow: "hidden" }}>
          <div className="mq-ltr" style={{ whiteSpace: "nowrap" }}>
            {[...row1, ...row1].map((item, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", color: "#F5F0EB" }}>{item}</span>
                {sep}
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 0", overflow: "hidden" }}>
          <div className="mq-rtl" style={{ whiteSpace: "nowrap" }}>
            {[...row2, ...row2].map((item, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 14, color: "#C9A96E", letterSpacing: "0.5px" }}>{item}</span>
                {sep}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
