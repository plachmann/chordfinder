export const colors = {
  background: "#1a1410",
  surface: "rgba(180,140,80,0.08)",
  surfaceBorder: "rgba(184,148,62,0.20)",
  accent: "#d4892f",
  accentGlow: "rgba(212,137,47,0.35)",
  accentMid: "rgba(212,137,47,0.15)",
  brass: "#b8943e",
  brassGlow: "rgba(184,148,62,0.30)",
  textPrimary: "#f0e6d0",
  textSecondary: "rgba(210,190,150,0.55)",
  errorBg: "rgba(180,50,30,0.85)",
  warningBg: "rgba(160,110,20,0.85)",
};

export const glass = {
  backgroundColor: "rgba(30,22,14,0.92)",
  borderWidth: 1,
  borderColor: colors.surfaceBorder,
  borderRadius: 12,
};

export const shadows = {
  accent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 6,
  },
};
