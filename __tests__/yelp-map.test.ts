import {
  mapYelpBusiness,
  safeMapYelpBusiness,
  yelpBusinessToPlaceResult,
  yelpPlaceId,
  priceLevelFromYelp,
  cuisineFromYelpCategories,
} from "@/lib/places/yelp-map";

describe("yelp-map", () => {
  it("maps a valid Yelp business payload", () => {
    const enrichment = mapYelpBusiness({
      id: "abc",
      name: "Taco Spot",
      rating: 4.5,
      review_count: 120,
      url: "https://yelp.com/biz/abc",
      image_url: "https://img.example/a.jpg",
    });
    expect(enrichment).toEqual({
      yelpId: "abc",
      rating: 4.5,
      reviewCount: 120,
      url: "https://yelp.com/biz/abc",
      imageUrl: "https://img.example/a.jpg",
      name: "Taco Spot",
    });
  });

  it("returns null without an id", () => {
    expect(mapYelpBusiness({ name: "No Id", rating: 4 })).toBeNull();
    expect(mapYelpBusiness(null)).toBeNull();
  });

  it("soft-fails on unexpected shapes", () => {
    expect(safeMapYelpBusiness(undefined)).toBeNull();
    expect(safeMapYelpBusiness("nope")).toBeNull();
    expect(safeMapYelpBusiness({ id: "x", rating: 3.2 })?.rating).toBe(3.2);
  });

  it("maps a full business to PlaceResult with yelp: id", () => {
    const place = yelpBusinessToPlaceResult({
      id: "biz-1",
      name: "Nori House",
      rating: 4.8,
      review_count: 210,
      url: "https://yelp.com/biz/nori",
      image_url: "https://img.example/n.jpg",
      price: "$$",
      is_closed: false,
      categories: [{ alias: "sushi", title: "Sushi Bars" }],
      coordinates: { latitude: 34.05, longitude: -118.25 },
      location: {
        address1: "123 Sunset",
        city: "Los Angeles",
        state: "CA",
        display_address: ["123 Sunset", "Los Angeles, CA"],
      },
    });
    expect(place).toMatchObject({
      googlePlaceId: "yelp:biz-1",
      name: "Nori House",
      city: "Los Angeles",
      cuisine: "Japanese",
      priceLevel: 2,
      priceLevelKnown: true,
      latitude: 34.05,
      longitude: -118.25,
      openNow: true,
      yelpId: "biz-1",
      yelpRating: 4.8,
    });
    expect(yelpPlaceId("biz-1")).toBe("yelp:biz-1");
  });

  it("maps price and cuisine helpers", () => {
    expect(priceLevelFromYelp("$")).toEqual({ level: 1, known: true });
    expect(priceLevelFromYelp(undefined).known).toBe(false);
    expect(cuisineFromYelpCategories([{ title: "Thai" }])).toBe("Thai");
    expect(cuisineFromYelpCategories([{ alias: "pizza" }])).toBe("Italian");
  });
});
