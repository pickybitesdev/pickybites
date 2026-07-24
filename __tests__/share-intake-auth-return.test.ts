import { resolveAuthReturnTo } from "@/lib/navigation";

describe("resolveAuthReturnTo", () => {
  it("resumes share-import with pending id", () => {
    expect(resolveAuthReturnTo("/share-import", "share-abc")).toEqual({
      pathname: "/share-import",
      params: { pendingId: "share-abc" },
    });
  });

  it("rejects open redirects", () => {
    expect(resolveAuthReturnTo("//evil.com")).toBeNull();
    expect(resolveAuthReturnTo("https://evil.com")).toBeNull();
    expect(resolveAuthReturnTo("/admin")).toBeNull();
  });

  it("allows discover return", () => {
    expect(resolveAuthReturnTo("/(tabs)/discover")).toBe("/(tabs)/discover");
  });
});
