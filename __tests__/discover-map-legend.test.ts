import { readFileSync } from "fs";
import { join } from "path";

describe("DiscoverMap legend removal", () => {
  it("does not render Rated / Nearby / spots legend chrome", () => {
    const src = readFileSync(
      join(__dirname, "../components/maps/DiscoverMap.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/>Rated</);
    expect(src).not.toMatch(/>Nearby</);
    expect(src).not.toMatch(/spots`/);
    expect(src).not.toMatch(/legendBottomPad/);
  });
});
