import type {
  Comment, Dish, Follow, Like, List, ListItem,
  Restaurant, Review, ReviewPhoto, User,
} from "./types";
import { scoresFromOverall } from "./review-scores";
import { cuisineImage, FOOD_IMAGES } from "./images";

function mockReview(
  base: Omit<
    Review,
    | "categoryScores"
    | "ratingManualOverride"
    | "waitTime"
    | "wouldReturn"
    | "wouldRecommend"
    | "ratingValue"
    | "ratingMax"
    | "normalizedRating"
    | "visibility"
  > &
    Partial<
      Pick<
        Review,
        | "categoryScores"
        | "ratingManualOverride"
        | "waitTime"
        | "wouldReturn"
        | "wouldRecommend"
        | "ratingValue"
        | "ratingMax"
        | "normalizedRating"
        | "visibility"
      >
    >,
): Review {
  const ratingMax = base.ratingMax ?? 10;
  const ratingValue = base.ratingValue ?? base.rating;
  return {
    ...base,
    ratingValue,
    ratingMax,
    normalizedRating: base.normalizedRating ?? Math.min(100, Math.max(0, ratingValue * (100 / ratingMax))),
    visibility: base.visibility ?? "friends",
    categoryScores: base.categoryScores ?? scoresFromOverall(base.rating),
    ratingManualOverride: base.ratingManualOverride ?? false,
    waitTime: base.waitTime ?? null,
    wouldReturn: base.wouldReturn ?? null,
    wouldRecommend: base.wouldRecommend ?? null,
  };
}

function mockDish(
  d: Omit<Dish, "ratingValue" | "ratingMax" | "normalizedRating"> &
    Partial<Pick<Dish, "ratingValue" | "ratingMax" | "normalizedRating">>,
): Dish {
  const ratingMax = d.ratingMax ?? 10;
  const ratingValue = d.ratingValue ?? d.rating;
  return {
    ...d,
    ratingValue,
    ratingMax,
    normalizedRating: d.normalizedRating ?? Math.min(100, Math.max(0, ratingValue * (100 / ratingMax))),
  };
}

export const DEMO_EMAIL = "alex@example.com";
export const DEMO_PASSWORD = "Demo1234!";

export const MOCK_USERS: User[] = [
  { id: "user-1", email: "alex@example.com", username: "alextastes", displayName: "Alex Rivera", avatarUrl: null, city: "Los Angeles", bio: "Always hunting for hidden gems. Taco enthusiast.", favoriteCuisines: ["Mexican", "Japanese", "Italian"], hasCompletedTasteQuiz: true, createdAt: "2024-01-15T10:00:00Z" },
  { id: "user-2", email: "jordan@example.com", username: "jordanbites", displayName: "Jordan Kim", avatarUrl: null, city: "New York", bio: "Fine dining by night, pizza by day.", favoriteCuisines: ["Italian", "French"], hasCompletedTasteQuiz: true, createdAt: "2024-02-20T10:00:00Z" },
  { id: "user-3", email: "sam@example.com", username: "samspoon", displayName: "Sam Patel", avatarUrl: null, city: "Chicago", bio: "Spice tolerance: legendary. Butter chicken evangelist.", favoriteCuisines: ["Indian", "Thai"], hasCompletedTasteQuiz: true, createdAt: "2024-03-10T10:00:00Z" },
  { id: "user-4", email: "maya@example.com", username: "mayaeats", displayName: "Maya Chen", avatarUrl: null, city: "Miami", bio: "Caribbean food obsessed. Jerk chicken critic.", favoriteCuisines: ["Caribbean", "Spanish"], hasCompletedTasteQuiz: true, createdAt: "2024-04-05T10:00:00Z" },
  { id: "user-5", email: "riley@example.com", username: "rileyramen", displayName: "Riley Okafor", avatarUrl: null, city: "San Francisco", bio: "Ramen rankings are my personality.", favoriteCuisines: ["Japanese", "Korean"], hasCompletedTasteQuiz: true, createdAt: "2024-05-12T10:00:00Z" },
  { id: "user-6", email: "taylor@example.com", username: "taylorthai", displayName: "Taylor Brooks", avatarUrl: null, city: "Austin", bio: "Hot take: pad thai is underrated.", favoriteCuisines: ["Thai", "Vietnamese"], hasCompletedTasteQuiz: true, createdAt: "2024-06-18T10:00:00Z" },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
  { id: "rest-1", name: "Nori House", address: "123 Sunset Blvd", city: "Los Angeles", cuisine: "Japanese", priceLevel: 3, imageUrl: FOOD_IMAGES.japanese, createdAt: "2024-01-01T10:00:00Z" },
  { id: "rest-2", name: "Luna Trattoria", address: "45 Mulberry St", city: "New York", cuisine: "Italian", priceLevel: 2, imageUrl: FOOD_IMAGES.italian, createdAt: "2024-01-02T10:00:00Z" },
  { id: "rest-3", name: "Taco Libre", address: "789 Mission St", city: "Los Angeles", cuisine: "Mexican", priceLevel: 1, imageUrl: FOOD_IMAGES.mexican, createdAt: "2024-01-03T10:00:00Z" },
  { id: "rest-4", name: "Saffron Garden", address: "22 Devon Ave", city: "Chicago", cuisine: "Indian", priceLevel: 2, imageUrl: FOOD_IMAGES.indian, createdAt: "2024-01-04T10:00:00Z" },
  { id: "rest-5", name: "Island Spice", address: "88 Ocean Dr", city: "Miami", cuisine: "Caribbean", priceLevel: 2, imageUrl: FOOD_IMAGES.caribbean, createdAt: "2024-01-05T10:00:00Z" },
  { id: "rest-6", name: "Green Bowl", address: "501 Vegan Way", city: "Los Angeles", cuisine: "Mediterranean", priceLevel: 2, imageUrl: FOOD_IMAGES.mediterranean, createdAt: "2024-01-06T10:00:00Z" },
  { id: "rest-7", name: "Bangkok Street", address: "312 Congress Ave", city: "Austin", cuisine: "Thai", priceLevel: 1, imageUrl: FOOD_IMAGES.thai, createdAt: "2024-01-07T10:00:00Z" },
  { id: "rest-8", name: "Seoul Kitchen", address: "901 Market St", city: "San Francisco", cuisine: "Korean", priceLevel: 2, imageUrl: FOOD_IMAGES.korean, createdAt: "2024-01-08T10:00:00Z" },
  { id: "rest-9", name: "Le Petit Bistro", address: "14 Rue Imaginary", city: "New York", cuisine: "French", priceLevel: 4, imageUrl: FOOD_IMAGES.french, createdAt: "2024-01-09T10:00:00Z" },
  { id: "rest-10", name: "Smash & Sauce", address: "220 Main St", city: "Austin", cuisine: "American", priceLevel: 2, imageUrl: FOOD_IMAGES.burger, createdAt: "2024-01-10T10:00:00Z" },
  { id: "rest-11", name: "Golden Dragon", address: "55 Grant Ave", city: "San Francisco", cuisine: "Chinese", priceLevel: 2, imageUrl: FOOD_IMAGES.chinese, createdAt: "2024-01-11T10:00:00Z" },
  { id: "rest-12", name: "Pho Real", address: "77 Sunset Strip", city: "Los Angeles", cuisine: "Vietnamese", priceLevel: 1, imageUrl: FOOD_IMAGES.vietnamese, createdAt: "2024-01-12T10:00:00Z" },
  { id: "rest-13", name: "Olive & Thyme", address: "3 Harbor View", city: "Miami", cuisine: "Greek", priceLevel: 2, imageUrl: FOOD_IMAGES.greek, createdAt: "2024-01-13T10:00:00Z" },
  { id: "rest-14", name: "Ramen Lab", address: "404 Valencia St", city: "San Francisco", cuisine: "Japanese", priceLevel: 2, imageUrl: FOOD_IMAGES.ramen, createdAt: "2024-01-14T10:00:00Z" },
  { id: "rest-15", name: "Tapas y Vino", address: "18 La Rambla", city: "Miami", cuisine: "Spanish", priceLevel: 3, imageUrl: FOOD_IMAGES.spanish, createdAt: "2024-01-15T10:00:00Z" },
];

export const MOCK_REVIEWS: Review[] = [
  mockReview({ id: "rev-1", userId: "user-1", restaurantId: "rest-1", rating: 9.2, text: "Omakase was flawless. The uni nigiri melted on contact.", visitDate: "2025-11-12", tags: ["Date Night", "Worth the Wait", "Great Service"], createdAt: "2025-11-13T10:00:00Z", categoryScores: { foodQuality: 9.8, service: 9.5, atmosphere: 9.0, value: 8.5 }, wouldReturn: true, wouldRecommend: true }),
  mockReview({ id: "rev-2", userId: "user-1", restaurantId: "rest-3", rating: 8.7, text: "Best al pastor in the city. Pineapple hits different here.", visitDate: "2025-10-05", tags: ["Casual", "Hidden Gem"], createdAt: "2025-10-06T10:00:00Z" }),
  mockReview({ id: "rev-3", userId: "user-2", restaurantId: "rest-2", rating: 8.5, text: "Cacio e pepe was silky. Cozy corner table vibes.", visitDate: "2025-09-20", tags: ["Casual", "Date Night"], createdAt: "2025-09-21T10:00:00Z" }),
  mockReview({ id: "rev-4", userId: "user-3", restaurantId: "rest-4", rating: 9.5, text: "Butter chicken rewired my brain. Naan was pillowy perfection.", visitDate: "2025-11-01", tags: ["Hidden Gem", "Great Service"], createdAt: "2025-11-02T10:00:00Z" }),
  mockReview({ id: "rev-5", userId: "user-4", restaurantId: "rest-5", rating: 9.8, text: "Best jerk chicken outside Jamaica. Smoky, spicy, unforgettable.", visitDate: "2025-12-01", tags: ["Hidden Gem", "Casual"], createdAt: "2025-12-02T10:00:00Z" }),
  mockReview({ id: "rev-6", userId: "user-4", restaurantId: "rest-2", rating: 9.0, text: "Tiramisu is unreal. Worth the trip to Mulberry alone.", visitDate: "2025-11-18", tags: ["Date Night"], createdAt: "2025-11-19T10:00:00Z" }),
  mockReview({ id: "rev-7", userId: "user-2", restaurantId: "rest-1", rating: 9.8, text: "Life-changing sushi. Chef's counter is the move.", visitDate: "2025-12-01", tags: ["Date Night", "Worth the Wait"], createdAt: "2025-12-02T10:00:00Z", waitTime: "30_60" }),
  mockReview({ id: "rev-8", userId: "user-5", restaurantId: "rest-14", rating: 9.6, text: "Tonkotsu broth took 18 hours and it shows. Rich, creamy heaven.", visitDate: "2025-12-10", tags: ["Hidden Gem", "Worth the Wait"], createdAt: "2025-12-11T10:00:00Z" }),
  mockReview({ id: "rev-9", userId: "user-6", restaurantId: "rest-7", rating: 8.9, text: "Drunken noodles with perfect wok hei. Spice level 4 was no joke.", visitDate: "2025-11-25", tags: ["Casual", "Hidden Gem"], createdAt: "2025-11-26T10:00:00Z" }),
  mockReview({ id: "rev-10", userId: "user-3", restaurantId: "rest-8", rating: 9.1, text: "Bibimbap stone bowl crackled for minutes. Crispy rice bottom FTW.", visitDate: "2025-10-15", tags: ["Casual", "Great Service"], createdAt: "2025-10-16T10:00:00Z" }),
  mockReview({ id: "rev-11", userId: "user-2", restaurantId: "rest-9", rating: 9.4, text: "Duck confit fell off the bone. Classic French done right.", visitDate: "2025-12-05", tags: ["Date Night", "Worth the Wait"], createdAt: "2025-12-06T10:00:00Z" }),
  mockReview({ id: "rev-12", userId: "user-5", restaurantId: "rest-10", rating: 8.3, text: "Double smash patty with secret sauce. Messy in the best way.", visitDate: "2025-11-08", tags: ["Casual"], createdAt: "2025-11-09T10:00:00Z" }),
  mockReview({ id: "rev-13", userId: "user-1", restaurantId: "rest-6", rating: 8.8, text: "Falafel wrap was crisp outside, herbaceous inside. Vegan-friendly win.", visitDate: "2025-12-15", tags: ["Vegan Friendly", "Casual"], createdAt: "2025-12-16T10:00:00Z" }),
  mockReview({ id: "rev-14", userId: "user-6", restaurantId: "rest-12", rating: 9.0, text: "Pho broth simmered for 12 hours — you can taste every hour.", visitDate: "2025-12-08", tags: ["Hidden Gem", "Casual"], createdAt: "2025-12-09T10:00:00Z" }),
  mockReview({ id: "rev-15", userId: "user-4", restaurantId: "rest-15", rating: 8.6, text: "Patatas bravas with aioli that could convert skeptics.", visitDate: "2025-11-30", tags: ["Date Night", "Great Service"], createdAt: "2025-12-01T09:00:00Z" }),
  mockReview({ id: "rev-16", userId: "user-5", restaurantId: "rest-11", rating: 8.4, text: "Soup dumplings burst with hot broth. Order two baskets minimum.", visitDate: "2025-10-22", tags: ["Casual", "Hidden Gem"], createdAt: "2025-10-23T10:00:00Z" }),
  mockReview({ id: "rev-17", userId: "user-3", restaurantId: "rest-13", rating: 8.2, text: "Lamb souvlaki with tzatziki so garlicky it haunted me (compliment).", visitDate: "2025-12-12", tags: ["Casual"], createdAt: "2025-12-13T10:00:00Z" }),
  // Extra friend activity so Feed feels full in demo mode
  mockReview({ id: "rev-18", userId: "user-2", restaurantId: "rest-15", rating: 9.1, text: "Sangria + gambas — the patio at golden hour is the whole point.", visitDate: "2026-07-18", tags: ["Date Night", "Great Service"], createdAt: "2026-07-18T21:00:00Z" }),
  mockReview({ id: "rev-19", userId: "user-5", restaurantId: "rest-8", rating: 8.7, text: "Short rib jjigae healed me. Bring someone who doesn’t mind sharing.", visitDate: "2026-07-17", tags: ["Casual", "Worth the Wait"], createdAt: "2026-07-17T19:30:00Z" }),
  mockReview({ id: "rev-20", userId: "user-6", restaurantId: "rest-12", rating: 9.3, text: "Rare beef pho, extra herbs, no shortcuts. This is the one.", visitDate: "2026-07-16", tags: ["Hidden Gem", "Casual"], createdAt: "2026-07-16T13:00:00Z" }),
  mockReview({ id: "rev-21", userId: "user-4", restaurantId: "rest-13", rating: 8.9, text: "Horiatiki salad tasted like summer. Order the grilled octopus too.", visitDate: "2026-07-15", tags: ["Date Night", "Vegan Friendly"], createdAt: "2026-07-15T18:45:00Z" }),
  mockReview({ id: "rev-22", userId: "user-3", restaurantId: "rest-7", rating: 9.0, text: "Green curry that actually tastes green — bright, herbal, addictive.", visitDate: "2026-07-14", tags: ["Casual", "Hidden Gem"], createdAt: "2026-07-14T20:10:00Z" }),
  mockReview({ id: "rev-23", userId: "user-2", restaurantId: "rest-10", rating: 8.4, text: "Smash burger dripped down my wrist. Zero regrets.", visitDate: "2026-07-12", tags: ["Casual"], createdAt: "2026-07-12T12:20:00Z" }),
  mockReview({ id: "rev-24", userId: "user-5", restaurantId: "rest-1", rating: 9.5, text: "Hand roll flight was theater. Sit at the counter if you can.", visitDate: "2026-07-10", tags: ["Date Night", "Worth the Wait", "Great Service"], createdAt: "2026-07-10T22:00:00Z" }),
  mockReview({ id: "rev-25", userId: "user-6", restaurantId: "rest-4", rating: 8.8, text: "Garlic naan disappeared in 90 seconds. Butter chicken still undefeated.", visitDate: "2026-07-08", tags: ["Casual", "Great Service"], createdAt: "2026-07-08T19:00:00Z" }),
  mockReview({ id: "rev-26", userId: "user-4", restaurantId: "rest-3", rating: 8.6, text: "Carnitas tacos with salsa verde that clears your sinuses (affectionately).", visitDate: "2026-07-06", tags: ["Casual", "Hidden Gem"], createdAt: "2026-07-06T14:30:00Z" }),
  mockReview({ id: "rev-27", userId: "user-3", restaurantId: "rest-14", rating: 9.2, text: "Spicy miso ramen punched up just right. Egg was jammy perfection.", visitDate: "2026-07-04", tags: ["Worth the Wait", "Casual"], createdAt: "2026-07-04T21:15:00Z" }),
];

export const MOCK_REVIEW_PHOTOS: ReviewPhoto[] = [
  { id: "rp-1", reviewId: "rev-1", url: FOOD_IMAGES.sushi, createdAt: "2025-11-13T10:00:00Z" },
  { id: "rp-2", reviewId: "rev-2", url: FOOD_IMAGES.tacos, createdAt: "2025-10-06T10:00:00Z" },
  { id: "rp-3", reviewId: "rev-5", url: FOOD_IMAGES.caribbean, createdAt: "2025-12-02T10:00:00Z" },
  { id: "rp-4", reviewId: "rev-8", url: FOOD_IMAGES.ramen, createdAt: "2025-12-11T10:00:00Z" },
  { id: "rp-5", reviewId: "rev-4", url: FOOD_IMAGES.indian, createdAt: "2025-11-02T10:00:00Z" },
  { id: "rp-6", reviewId: "rev-11", url: FOOD_IMAGES.french, createdAt: "2025-12-06T10:00:00Z" },
  { id: "rp-7", reviewId: "rev-13", url: FOOD_IMAGES.mediterranean, createdAt: "2025-12-16T10:00:00Z" },
  { id: "rp-8", reviewId: "rev-9", url: FOOD_IMAGES.thai, createdAt: "2025-11-26T10:00:00Z" },
  { id: "rp-9", reviewId: "rev-18", url: FOOD_IMAGES.spanish, createdAt: "2026-07-18T21:00:00Z" },
  { id: "rp-10", reviewId: "rev-19", url: FOOD_IMAGES.korean, createdAt: "2026-07-17T19:30:00Z" },
  { id: "rp-11", reviewId: "rev-20", url: FOOD_IMAGES.vietnamese, createdAt: "2026-07-16T13:00:00Z" },
  { id: "rp-12", reviewId: "rev-21", url: FOOD_IMAGES.greek, createdAt: "2026-07-15T18:45:00Z" },
  { id: "rp-13", reviewId: "rev-22", url: FOOD_IMAGES.thai, createdAt: "2026-07-14T20:10:00Z" },
  { id: "rp-14", reviewId: "rev-23", url: FOOD_IMAGES.burger, createdAt: "2026-07-12T12:20:00Z" },
  { id: "rp-15", reviewId: "rev-24", url: FOOD_IMAGES.japanese, createdAt: "2026-07-10T22:00:00Z" },
  { id: "rp-16", reviewId: "rev-25", url: FOOD_IMAGES.indian, createdAt: "2026-07-08T19:00:00Z" },
  { id: "rp-17", reviewId: "rev-26", url: FOOD_IMAGES.mexican, createdAt: "2026-07-06T14:30:00Z" },
  { id: "rp-18", reviewId: "rev-27", url: FOOD_IMAGES.ramen, createdAt: "2026-07-04T21:15:00Z" },
  { id: "rp-19", reviewId: "rev-3", url: FOOD_IMAGES.italian, createdAt: "2025-09-21T10:00:00Z" },
  { id: "rp-20", reviewId: "rev-7", url: FOOD_IMAGES.sushi, createdAt: "2025-12-02T10:00:00Z" },
  { id: "rp-21", reviewId: "rev-12", url: FOOD_IMAGES.burger, createdAt: "2025-11-09T10:00:00Z" },
  { id: "rp-22", reviewId: "rev-14", url: FOOD_IMAGES.vietnamese, createdAt: "2025-12-09T10:00:00Z" },
  { id: "rp-23", reviewId: "rev-15", url: FOOD_IMAGES.spanish, createdAt: "2025-12-01T09:00:00Z" },
  { id: "rp-24", reviewId: "rev-16", url: FOOD_IMAGES.chinese, createdAt: "2025-10-23T10:00:00Z" },
];

export const MOCK_DISHES: Dish[] = [
  mockDish({ id: "dish-1", reviewId: "rev-1", restaurantId: "rest-1", name: "Uni Nigiri", rating: 9.8, notes: "Buttery perfection", photoUrl: FOOD_IMAGES.sushi, isBestDish: true, createdAt: "2025-11-13T10:00:00Z" }),
  mockDish({ id: "dish-2", reviewId: "rev-2", restaurantId: "rest-3", name: "Al Pastor Tacos", rating: 9.2, notes: "Pineapple + pork magic", photoUrl: FOOD_IMAGES.tacos, isBestDish: true, createdAt: "2025-10-06T10:00:00Z" }),
  mockDish({ id: "dish-3", reviewId: "rev-3", restaurantId: "rest-2", name: "Cacio e Pepe", rating: 8.8, notes: "Perfectly emulsified", photoUrl: FOOD_IMAGES.pasta, isBestDish: true, createdAt: "2025-09-21T10:00:00Z" }),
  mockDish({ id: "dish-4", reviewId: "rev-4", restaurantId: "rest-4", name: "Butter Chicken", rating: 9.9, notes: "Creamy, smoky", photoUrl: FOOD_IMAGES.indian, isBestDish: true, createdAt: "2025-11-02T10:00:00Z" }),
  mockDish({ id: "dish-5", reviewId: "rev-5", restaurantId: "rest-5", name: "Jerk Chicken", rating: 10.0, notes: "Smoky, spicy, perfect", photoUrl: FOOD_IMAGES.caribbean, isBestDish: true, createdAt: "2025-12-02T10:00:00Z" }),
  mockDish({ id: "dish-6", reviewId: "rev-6", restaurantId: "rest-2", name: "Tiramisu", rating: 9.5, notes: "Light, coffee-forward", photoUrl: FOOD_IMAGES.dessert, isBestDish: true, createdAt: "2025-11-19T10:00:00Z" }),
  mockDish({ id: "dish-7", reviewId: "rev-8", restaurantId: "rest-14", name: "Tonkotsu Ramen", rating: 9.7, notes: "Broth for days", photoUrl: FOOD_IMAGES.ramen, isBestDish: true, createdAt: "2025-12-11T10:00:00Z" }),
  mockDish({ id: "dish-8", reviewId: "rev-9", restaurantId: "rest-7", name: "Drunken Noodles", rating: 9.0, notes: "Wok hei on point", photoUrl: FOOD_IMAGES.thai, isBestDish: true, createdAt: "2025-11-26T10:00:00Z" }),
  mockDish({ id: "dish-9", reviewId: "rev-11", restaurantId: "rest-9", name: "Duck Confit", rating: 9.6, notes: "Fell off the bone", photoUrl: FOOD_IMAGES.french, isBestDish: true, createdAt: "2025-12-06T10:00:00Z" }),
  mockDish({ id: "dish-10", reviewId: "rev-12", restaurantId: "rest-10", name: "Double Smash Burger", rating: 8.5, notes: "Secret sauce slaps", photoUrl: FOOD_IMAGES.burger, isBestDish: true, createdAt: "2025-11-09T10:00:00Z" }),
];

export const MOCK_LIKES: Like[] = [
  { id: "like-1", reviewId: "rev-1", userId: "user-2", createdAt: "2025-11-14T10:00:00Z" },
  { id: "like-2", reviewId: "rev-5", userId: "user-1", createdAt: "2025-12-03T10:00:00Z" },
  { id: "like-3", reviewId: "rev-4", userId: "user-4", createdAt: "2025-11-03T10:00:00Z" },
  { id: "like-4", reviewId: "rev-8", userId: "user-1", createdAt: "2025-12-12T10:00:00Z" },
  { id: "like-5", reviewId: "rev-7", userId: "user-1", createdAt: "2025-12-03T10:00:00Z" },
  { id: "like-6", reviewId: "rev-9", userId: "user-2", createdAt: "2025-11-27T10:00:00Z" },
  { id: "like-7", reviewId: "rev-11", userId: "user-4", createdAt: "2025-12-07T10:00:00Z" },
  { id: "like-8", reviewId: "rev-5", userId: "user-3", createdAt: "2025-12-04T10:00:00Z" },
  { id: "like-9", reviewId: "rev-14", userId: "user-5", createdAt: "2025-12-10T10:00:00Z" },
  { id: "like-10", reviewId: "rev-1", userId: "user-4", createdAt: "2025-11-15T10:00:00Z" },
];

export const MOCK_COMMENTS: Comment[] = [
  { id: "c-1", reviewId: "rev-1", userId: "user-2", text: "Adding this to my list!", createdAt: "2025-11-14T12:00:00Z" },
  { id: "c-2", reviewId: "rev-5", userId: "user-1", text: "Need to try this ASAP!", createdAt: "2025-12-03T10:00:00Z" },
  { id: "c-3", reviewId: "rev-8", userId: "user-1", text: "Ramen Lab never misses.", createdAt: "2025-12-12T11:00:00Z" },
  { id: "c-4", reviewId: "rev-4", userId: "user-2", text: "Their garlic naan is insane too.", createdAt: "2025-11-03T14:00:00Z" },
  { id: "c-5", reviewId: "rev-9", userId: "user-6", text: "Level 4 is the sweet spot, trust me.", createdAt: "2025-11-27T09:00:00Z" },
  { id: "c-6", reviewId: "rev-11", userId: "user-1", text: "Book the window table if you can.", createdAt: "2025-12-07T16:00:00Z" },
];

export const MOCK_FOLLOWS: Follow[] = [
  { id: "f-1", followerId: "user-1", followingId: "user-2", createdAt: "2024-05-01T10:00:00Z" },
  { id: "f-2", followerId: "user-1", followingId: "user-4", createdAt: "2024-05-02T10:00:00Z" },
  { id: "f-3", followerId: "user-2", followingId: "user-1", createdAt: "2024-05-03T10:00:00Z" },
  { id: "f-4", followerId: "user-1", followingId: "user-5", createdAt: "2024-06-01T10:00:00Z" },
  { id: "f-5", followerId: "user-1", followingId: "user-3", createdAt: "2024-06-15T10:00:00Z" },
  { id: "f-6", followerId: "user-4", followingId: "user-1", createdAt: "2024-07-01T10:00:00Z" },
  { id: "f-7", followerId: "user-5", followingId: "user-1", createdAt: "2024-07-10T10:00:00Z" },
  { id: "f-8", followerId: "user-1", followingId: "user-6", createdAt: "2024-08-01T10:00:00Z" },
];

export const MOCK_LISTS: List[] = [
  { id: "list-1", userId: "user-1", name: "Date Night Spots", description: "Romantic favorites", isPublic: true, createdAt: "2024-07-01T10:00:00Z" },
  { id: "list-2", userId: "user-1", name: "Hidden Gems", description: "Under the radar", isPublic: true, createdAt: "2024-08-01T10:00:00Z" },
  { id: "list-3", userId: "user-1", name: "LA Must-Tries", description: "Local favorites", isPublic: true, createdAt: "2024-09-01T10:00:00Z" },
];

export const MOCK_LIST_ITEMS: ListItem[] = [
  { id: "li-1", listId: "list-1", restaurantId: "rest-1", note: "Anniversary spot", position: 1, createdAt: "2024-07-02T10:00:00Z" },
  { id: "li-2", listId: "list-2", restaurantId: "rest-3", note: "Taco heaven", position: 1, createdAt: "2024-08-02T10:00:00Z" },
  { id: "li-3", listId: "list-2", restaurantId: "rest-5", note: "Caribbean gem", position: 2, createdAt: "2024-08-03T10:00:00Z" },
  { id: "li-4", listId: "list-3", restaurantId: "rest-12", note: "Best pho in town", position: 1, createdAt: "2024-09-02T10:00:00Z" },
  { id: "li-5", listId: "list-1", restaurantId: "rest-9", note: "Splurge night", position: 2, createdAt: "2024-09-15T10:00:00Z" },
  { id: "li-6", listId: "list-3", restaurantId: "rest-6", note: "Healthy lunch", position: 2, createdAt: "2024-10-01T10:00:00Z" },
];

export const CURRENT_USER_ID = "user-1";
