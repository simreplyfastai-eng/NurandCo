export const brand = {
  name: "Nur & Co Aesthetics",
  tagline: "Considered aesthetics.",

  wordmark: {
    line1: "NUR & CO",
    line2: "AESTHETICS",
    style: "italic",
  },

  colors: {
    bgPrimary:    "#F4EFE6",
    bgSecondary:  "#EBE3D4",
    bgDark:       "#0E0D0B",
    textPrimary:  "#0E0D0B",
    textSecondary:"#6B6258",
    primary:      "#0E0D0B",
    accent:       "#B89968",
    accentDark:   "#9A7E50",
    border:       "#D9CFBC",
    success:      "#4F7A4A",
    error:        "#A33E3E",
  },

  fonts: {
    heading: "'Cormorant Garamond', serif",
    body:    "'Inter', sans-serif",
  },

  type: {
    wordmarkLine1: { weight: 500, italic: true,  tracking: "0.18em" },
    wordmarkLine2: { weight: 400, italic: true,  tracking: "0.32em" },
    h1:            { weight: 400, italic: false, tracking: "0.02em" },
    body:          { weight: 400, italic: false, tracking: "0" },
  },

  borderRadius: {
    sm:   "2px",
    md:   "4px",
    lg:   "8px",
    full: "9999px",
  },
} as const;
