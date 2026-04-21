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

      <div style={{ background: "#F5F0EB", padding: "80px 0 0" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>The Edit</span>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 400, color: "#5C1A1A", margin: 0 }}>
            Precision. Artistry. Results.
          </h2>
        </div>

        <div style={{ overflow: "hidden", paddingBottom: 0 }}>
          <div style={{ borderTop: "1px solid #E2DDD5", borderBottom: "1px solid #E2DDD5", padding: "14px 0", overflow: "hidden", marginBottom: 1 }}>
            <div className="mq-ltr" style={{ whiteSpace: "nowrap" }}>
              {[...row1, ...row1].map((item, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", color: "#3D3D3D" }}>{item}</span>
                  {sep}
                </span>
              ))}
            </div>
          </div>
          <div style={{ borderBottom: "1px solid #E2DDD5", padding: "14px 0", overflow: "hidden" }}>
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
      </div>
    </>
  );
}
