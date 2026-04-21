export default function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "0 40px",
        lineHeight: 0,
        background: "transparent",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Left long line */}
      <div style={{
        flex: 1,
        height: 1,
        background: "linear-gradient(90deg, transparent, #3D3D3D)",
        opacity: 0.18,
      }} />

      {/* Left short tick */}
      <div style={{
        width: 18,
        height: 1,
        background: "#C9A96E",
        opacity: 0.22,
      }} />

      {/* Centre ornament */}
      <span style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 13,
        color: "#C9A96E",
        opacity: 0.7,
        lineHeight: 1,
        letterSpacing: 4,
        userSelect: "none",
      }}>
        ✦
      </span>

      {/* Right short tick */}
      <div style={{
        width: 18,
        height: 1,
        background: "#C9A96E",
        opacity: 0.22,
      }} />

      {/* Right long line */}
      <div style={{
        flex: 1,
        height: 1,
        background: "linear-gradient(270deg, transparent, #3D3D3D)",
        opacity: 0.18,
      }} />
    </div>
  );
}
