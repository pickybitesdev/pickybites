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
  it("has no secondary menu rows (Rankings removed from Profile)", () => {
    expect(profileMenuLabels()).toEqual([]);
  });

  it("does not include Taste DNA, Friends, or Food Journal", () => {
    expect(profileMenuHasTasteDna()).toBe(false);
    expect(profileMenuHasFriends()).toBe(false);
    expect(PROFILE_MENU.some((i) => i.label === "Food Journal")).toBe(false);
  });

  it("does not include Settings, Bites, Lists, Food Wrapped, or Rankings", () => {
    expect(profileMenuHasSettings()).toBe(false);
    expect(profileMenuHasBites()).toBe(false);
    expect(profileMenuHasLists()).toBe(false);
    expect(profileMenuHasWrapped()).toBe(false);
    expect(PROFILE_MENU.some((i) => i.label === "Rankings")).toBe(false);
  });

  it("requires a 44pt settings touch target", () => {
    expect(PROFILE_SETTINGS_MIN_TOUCH).toBe(44);
  });
});
