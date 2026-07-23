import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  AUTOCOMPLETE_MIN_CHARS,
  classifyPlaceTypes,
  createAutocompleteSessionToken,
  mapAutocompleteSuggestion,
  shouldFetchAutocomplete,
  normalizePlaceResourceId,
  rankDiscoverSuggestions,
} from "@/lib/places/autocomplete";

describe("places autocomplete helpers", () => {
  it("requires minimum characters before fetching", () => {
    expect(shouldFetchAutocomplete("")).toBe(false);
    expect(shouldFetchAutocomplete("a")).toBe(false);
    expect(shouldFetchAutocomplete("au")).toBe(true);
    expect(AUTOCOMPLETE_MIN_CHARS).toBe(2);
    expect(AUTOCOMPLETE_DEBOUNCE_MS).toBeGreaterThanOrEqual(250);
    expect(AUTOCOMPLETE_DEBOUNCE_MS).toBeLessThanOrEqual(350);
  });

  it("classifies restaurant, area, and address types", () => {
    expect(classifyPlaceTypes(["mexican_restaurant"])).toBe("restaurant");
    expect(classifyPlaceTypes(["neighborhood", "political"])).toBe("area");
    expect(classifyPlaceTypes(["street_address"])).toBe("address");
    expect(classifyPlaceTypes(["museum"])).toBe("other");
  });

  it("maps autocomplete suggestions with stable ids", () => {
    const mapped = mapAutocompleteSuggestion({
      placePrediction: {
        place: "places/ChIJabc",
        structuredFormat: {
          mainText: { text: "Briar Forest" },
          secondaryText: { text: "Houston, TX" },
        },
        types: ["neighborhood"],
      },
    });
    expect(mapped).toEqual({
      id: "ChIJabc",
      placeId: "ChIJabc",
      primaryText: "Briar Forest",
      secondaryText: "Houston, TX",
      kinds: ["neighborhood"],
      kind: "area",
    });
    expect(normalizePlaceResourceId("places/ChIJxyz")).toBe("ChIJxyz");
  });

  it("creates unique session tokens", () => {
    const a = createAutocompleteSessionToken();
    const b = createAutocompleteSessionToken();
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(a).not.toBe(b);
  });

  it("ignores suggestions without place ids", () => {
    expect(mapAutocompleteSuggestion({})).toBeNull();
    expect(mapAutocompleteSuggestion({ placePrediction: { text: { text: "x" } } })).toBeNull();
  });

  it("ranks cities ahead of restaurants and drops landmarks", () => {
    const ranked = rankDiscoverSuggestions(
      [
        {
          id: "1",
          placeId: "1",
          primaryText: "New York Aquarium",
          secondaryText: "Brooklyn",
          kinds: ["aquarium", "tourist_attraction"],
          kind: "other",
        },
        {
          id: "2",
          placeId: "2",
          primaryText: "New York Marriott",
          secondaryText: "NY",
          kinds: ["lodging", "hotel"],
          kind: "other",
        },
        {
          id: "3",
          placeId: "3",
          primaryText: "Russo's New York Pizzeria",
          secondaryText: "Houston, TX, USA",
          kinds: ["restaurant"],
          kind: "restaurant",
        },
        {
          id: "4",
          placeId: "4",
          primaryText: "New York, NY, USA",
          secondaryText: "",
          kinds: ["geocode"],
          kind: "address",
        },
        {
          id: "5",
          placeId: "5",
          primaryText: "Joe's Pizza",
          secondaryText: "New York, NY",
          kinds: ["restaurant"],
          kind: "restaurant",
        },
      ],
      "New York",
    );
    expect(ranked[0]?.primaryText).toBe("New York, NY, USA");
    expect(ranked.map((s) => s.primaryText)).not.toContain("Russo's New York Pizzeria");
    expect(ranked.map((s) => s.primaryText)).toContain("Joe's Pizza");
  });
});
