export const colors = {
  background: "#080808",
  surface: "rgba(255,255,255,0.06)",
  surfaceBorder: "rgba(255,255,255,0.10)",
  accent: "#7c5cff",
  accentGlow: "rgba(124,92,255,0.35)",
  accentMid: "rgba(124,92,255,0.15)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.45)",
  errorBg: "rgba(180,30,30,0.85)",
  warningBg: "rgba(120,90,0,0.85)",
};

export const glass = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.surfaceBorder,
  borderRadius: 20,
};

export const shadows = {
  accent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
};
