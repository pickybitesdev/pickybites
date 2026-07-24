/** Normalized share intake models for iOS Share Extension + Android ACTION_SEND. */

export type SourcePlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "google_maps"
  | "yelp"
  | "restaurant_website"
  | "web"
  | "unknown";

export type IncomingShareStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "cancelled"
  | "failed";

export type IncomingSharedContent = {
  id: string;
  rawText: string | null;
  originalUrl: string | null;
  canonicalUrl: string | null;
  sourcePlatform: SourcePlatform;
  receivedAt: string;
  status: IncomingShareStatus;
  sourceTitle?: string | null;
  sourceThumbnailUrl?: string | null;
};

export type PendingShareRecord = IncomingSharedContent & {
  consumedAt?: string | null;
  resumeToken?: string | null;
  androidIntentHash?: string | null;
};

export type RestaurantCandidate = {
  restaurantId?: string | null;
  googlePlaceId?: string | null;
  yelpBusinessId?: string | null;
  name: string;
  address: string;
  city: string;
  neighborhood?: string | null;
  cuisine: string;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  provider: "google" | "yelp" | "pickybites" | "metadata";
  confidence: number;
  confidenceReason: string;
};

export type RestaurantResolutionResult = {
  status: "resolved" | "multiple" | "unresolved";
  confidence: number;
  candidates: RestaurantCandidate[];
  extractedName?: string;
  extractedLocation?: string;
  sourceTitle?: string | null;
  sourceThumbnailUrl?: string | null;
};

export type BookmarkResolutionStatus = "linked" | "link_only" | "pending_link";

export type BookmarkCreatedVia =
  | "discover"
  | "share_extension"
  | "manual"
  | "in_app"
  | "restaurant"
  | "feed";

export type SavedItemSource = {
  id: string;
  savedRestaurantId: string;
  userId: string;
  sourceUrl: string;
  canonicalUrl: string;
  sourcePlatform: SourcePlatform;
  title: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
};
