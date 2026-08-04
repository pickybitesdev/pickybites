import { File } from "expo-file-system";
import { getSupabase, getPublicStorageUrl } from "./client";

/**
 * Read a local file as bytes for upload.
 *
 * Expo SDK 54 made `FileSystem.readAsStringAsync` a hard error rather than a
 * warning, which killed every photo upload at the read step — before any
 * network call. The `File` API also returns bytes directly, so the old
 * base64 -> atob -> Uint8Array round-trip goes away.
 */
async function readFileBytes(localUri: string): Promise<Uint8Array> {
  return new Uint8Array(await new File(localUri).arrayBuffer());
}

/** jpeg/png only — matches what the image picker returns. */
function contentTypeFor(ext: string): string {
  return ext.toLowerCase() === "png" ? "image/png" : "image/jpeg";
}

/**
 * Upload one review photo.
 *
 * Returns a discriminated result rather than `string | null`: the previous
 * signature meant a failed upload was indistinguishable from "no photo", so
 * uploads failed silently and the review saved looking fine. The reason now
 * reaches the caller and, ultimately, the user.
 */
export type PhotoUploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadReviewPhoto(
  userId: string,
  reviewId: string,
  localUri: string,
  index: number
): Promise<PhotoUploadResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Supabase not configured" };

  const ext = localUri.split(".").pop()?.split("?")[0] ?? "jpg";
  const path = `${userId}/${reviewId}/${Date.now()}-${index}.${ext}`;

  const bytes = await readFileBytes(localUri);

  const { error } = await supabase.storage
    .from("review-photos")
    .upload(path, bytes, { contentType: contentTypeFor(ext), upsert: false });

  if (error) {
    console.error("Photo upload failed:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, url: getPublicStorageUrl("review-photos", path) };
}

/** Upload several photos, reporting which failed and why. */
export async function uploadReviewPhotos(
  userId: string,
  reviewId: string,
  localUris: string[],
): Promise<{ urls: string[]; errors: string[] }> {
  const results = await Promise.all(
    localUris.map(async (uri, i) => {
      try {
        return await uploadReviewPhoto(userId, reviewId, uri, i);
      } catch (e) {
        const error = e instanceof Error ? e.message : "Upload failed";
        console.error("Photo upload threw:", error);
        return { ok: false as const, error };
      }
    }),
  );
  return {
    urls: results.flatMap((r) => (r.ok ? [r.url] : [])),
    errors: results.flatMap((r) => (r.ok ? [] : [r.error])),
  };
}

export async function uploadAvatar(userId: string, localUri: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const ext = localUri.split(".").pop()?.split("?")[0] ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  const bytes = await readFileBytes(localUri);

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { contentType: contentTypeFor(ext), upsert: true });

  if (error) {
    console.error("Avatar upload failed:", error.message);
    return null;
  }

  return getPublicStorageUrl("avatars", path);
}

