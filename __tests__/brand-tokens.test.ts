import { brandColors } from "@/constants/branding";
import { BUTTON_VARIANT_TOKENS } from "@/components/ui/Button";
import { iconColors } from "@/constants/ui";

/** Mirror of themeColors light/dark accents — avoids pulling AsyncStorage via the store in unit tests. */
const lightTab = {
  tabActive: brandColors.primary,
  tabInactive: brandColors.iconInactive,
  background: brandColors.background,
  border: brandColors.border,
};
const darkTab = {
  tabActive: brandColors.primaryOnDark,
  tabInactive: brandColors.iconInactive,
};

describe("coral brand tokens", () => {
  it("exports the canonical light coral palette", () => {
    expect(brandColors.primary).toBe("#FF8559");
    expect(brandColors.primaryPressed).toBe("#E96F45");
    expect(brandColors.primaryLight).toBe("#FFF0EA");
    expect(brandColors.primarySoft).toBe("#FFD9CC");
    expect(brandColors.background).toBe("#FFFDFC");
    expect(brandColors.surface).toBe("#FFFFFF");
    expect(brandColors.textPrimary).toBe("#241F1D");
    expect(brandColors.textSecondary).toBe("#756B67");
    expect(brandColors.border).toBe("#EDE4E0");
    expect(brandColors.iconInactive).toBe("#9D9692");
    expect(brandColors.success).toBe("#2FA866");
    expect(brandColors.warning).toBe("#E9A23B");
    expect(brandColors.error).toBe("#D94A4A");
  });

  it("keeps error distinct from brand coral", () => {
    expect(brandColors.error).not.toBe(brandColors.primary);
  });

  it("wires light tab colors to coral active and neutral inactive", () => {
    expect(lightTab.tabActive).toBe(brandColors.primary);
    expect(lightTab.tabInactive).toBe(brandColors.iconInactive);
    expect(lightTab.background).toBe(brandColors.background);
    expect(lightTab.border).toBe(brandColors.border);
  });

  it("uses lighter coral for dark-mode tab active state", () => {
    expect(darkTab.tabActive).toBe(brandColors.primaryOnDark);
    expect(darkTab.tabInactive).toBe(brandColors.iconInactive);
  });

  it("points icon and rating accents at coral", () => {
    expect(iconColors.brand).toBe(brandColors.primary);
    expect(iconColors.star).toBe(brandColors.primary);
    expect(iconColors.muted).toBe(brandColors.iconInactive);
  });
});

describe("button variant token hierarchy", () => {
  it("maps primary, secondary, ghost, danger, and disabled states", () => {
    expect(BUTTON_VARIANT_TOKENS.primary).toEqual({
      bg: brandColors.primaryPressed,
      text: "#FFFFFF",
    });
    expect(BUTTON_VARIANT_TOKENS.secondary.text).toBe(brandColors.primary);
    expect(BUTTON_VARIANT_TOKENS.ghost.text).toBe(brandColors.primary);
    expect(BUTTON_VARIANT_TOKENS.danger.bg).toBe(brandColors.error);
    expect(BUTTON_VARIANT_TOKENS.disabled.text).toBe(brandColors.iconInactive);
  });
});
