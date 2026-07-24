import type { Bookmark } from "@/lib/types";

/** Fill share-source fields for local/demo bookmarks created before migration. */
export function withBookmarkDefaults<T extends Partial<Bookmark>>(bookmark: T): T & Pick<
  Bookmark,
  | "createdVia"
  | "resolutionStatus"
  | "sourcePlatform"
  | "primarySourceTitle"
  | "primarySourceThumbnailUrl"
  | "sources"
> {
  return {
    createdVia: "in_app",
    resolutionStatus: "linked",
    sourcePlatform: null,
    primarySourceTitle: null,
    primarySourceThumbnailUrl: null,
    sources: [],
    ...bookmark,
  };
}
