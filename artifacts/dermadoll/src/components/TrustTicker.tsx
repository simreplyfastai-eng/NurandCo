export default function TrustTicker() {
  const items = [
    "DERMAL FILLERS",
    "ANTI-WRINKLE",
    "SKIN BOOSTERS",
    "FACIALS",
    "VITAMIN INJECTIONS",
    "NATURAL RESULTS",
    "5-STAR RATED",
    "LEEDS / WAKEFIELD",
  ];

  const separator = <span style={{ color: "#C8860A", margin: "0 18px" }}>✦</span>;

  const track = (
    <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}>{item}</span>
          {separator}
        </span>
      ))}
    </span>
  );

  return (
    <div style={{ height: 48, overflow: "hidden", position: "relative", display: "flex" }}>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-left { animation: marquee 28s linear infinite; display: inline-flex; }
      `}</style>

      {/* Left 55% — cream bg, dark text */}
      <div style={{
        width: "55%",
        height: "100%",
        background: "#FAF7F2",
        color: "#1A0F00",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}>
        <div className="ticker-left">
          {track}{track}
        </div>
      </div>

      {/* Right 45% — dark bg, cream text */}
      <div style={{
        width: "45%",
        height: "100%",
        background: "#1A0F00",
        color: "#FAF7F2",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}>
        <div className="ticker-left">
          {track}{track}
        </div>
      </div>

      {/* Mobile override — full dark */}
      <style>{`
        @media (max-width: 768px) {
          .ticker-left-wrap-left { display: none !important; }
          .ticker-left-wrap-right { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
