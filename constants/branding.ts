export const APP_NAME = "PickyBites";
export const APP_NAME_PICKY = "Picky";
export const APP_NAME_BITES = "Bites";
export const APP_TAGLINE = "Eat what you love";
export const APP_SCHEME = "pickybites";
export const APP_BUNDLE_ID = "com.pickybites.app";
export const SUPPORT_EMAIL = "support@pickybites.app";

/** PickyBites coral brand palette — warm food-focused accent + neutrals */
export const brandColors = {
  primary: "#FF8559",
  primaryPressed: "#E96F45",
  primaryLight: "#FFF0EA",
  primarySoft: "#FFD9CC",
  /** Lighter coral for accents on dark surfaces */
  primaryOnDark: "#FF9B78",
  primaryMutedOnDark: "#FFB399",

  background: "#FFFDFC",
  surface: "#FFFFFF",
  textPrimary: "#241F1D",
  textSecondary: "#756B67",
  border: "#EDE4E0",
  iconInactive: "#9D9692",

  success: "#2FA866",
  warning: "#E9A23B",
  error: "#D94A4A",

  /** Dark-mode surface ladder (unchanged structure) */
  backgroundDark: "#0F1219",
  navy: "#1E2330",
  navySoft: "#2D3345",

  // ---- Temporary aliases (rose/navy era) — prefer semantic keys above ----
  rose: "#FF8559",
  roseLight: "#FF9B78",
  roseDark: "#FF8559",
  roseMuted: "#FFB399",
  grey: "#9D9692",
  greyLight: "#9D9692",
} as const;

export const APP_STORE_TAGLINE =
  "Rate restaurants, log dishes, and discover spots your friends love — eat what you love.";

export const APP_STORE_DESCRIPTION = `${APP_NAME} is the social food app for people who care what they eat.

• Rate restaurants and dishes on a 1–10 scale
• Discover nearby spots and see what's trending in your city
• Follow friends and compare taste match scores
• Build lists, save bucket-list spots, and track your Taste DNA

Download ${APP_NAME} and start eating what you love.`;
