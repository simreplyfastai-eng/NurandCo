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

  const separator = (
    <span style={{ color: "#C9A96E", margin: "0 20px", fontSize: 10 }}>✦</span>
  );

  const track = (
    <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#1C1C1E",
          }}>
            {item}
          </span>
          {separator}
        </span>
      ))}
    </span>
  );

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 32s linear infinite;
          display: inline-flex;
          align-items: center;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div style={{
        background: "#EDE7DC",
        height: 52,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        position: "relative",
      }}>
        {/* Left fade */}
        <div style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: 80,
          background: "linear-gradient(90deg, #EDE7DC, transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }} />
        {/* Right fade */}
        <div style={{
          position: "absolute",
          right: 0, top: 0, bottom: 0,
          width: 80,
          background: "linear-gradient(270deg, #EDE7DC, transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }} />

        <div className="ticker-track">
          {track}{track}
        </div>
      </div>
    </>
  );
}
