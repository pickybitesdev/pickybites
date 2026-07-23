import {
  PROFILE_MENU,
  PROFILE_SETTINGS_MIN_TOUCH,
  profileMenuHasBites,
  profileMenuHasFriends,
  profileMenuHasLists,
  profileMenuHasSettings,
  profileMenuHasTasteDna,
  profileMenuHasWrapped,
  profileMenuLabels,
} from "@/lib/profile-menu";

describe("profile menu configuration", () => {
  it("keeps Rankings only (Journal lives on Bites tab)", () => {
    expect(profileMenuLabels()).toEqual(["Rankings"]);
  });

  it("does not include Taste DNA, Friends, or Food Journal", () => {
    expect(profileMenuHasTasteDna()).toBe(false);
    expect(profileMenuHasFriends()).toBe(false);
    expect(PROFILE_MENU.some((i) => i.label === "Food Journal")).toBe(false);
  });

  it("does not include Settings, Bites, Lists, or Food Wrapped", () => {
    expect(profileMenuHasSettings()).toBe(false);
    expect(profileMenuHasBites()).toBe(false);
    expect(profileMenuHasLists()).toBe(false);
    expect(profileMenuHasWrapped()).toBe(false);
  });

  it("routes Rankings correctly", () => {
    expect(PROFILE_MENU.find((i) => i.label === "Rankings")?.href).toBe("/rankings");
  });

  it("requires a 44pt settings touch target", () => {
    expect(PROFILE_SETTINGS_MIN_TOUCH).toBe(44);
  });
});
