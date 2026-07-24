import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ui } from "@/constants/ui";
import { brandColors } from "@/constants/branding";
import { useAppStore } from "@/store/useAppStore";
import { track } from "@/lib/analytics";
import { domainFromUrl } from "@/lib/share-intake/url";
import {
  getPendingShare,
  markShareConsumed,
  setShareStatus,
} from "@/lib/share-intake/pending-queue";
import { resolveRestaurantFromShare } from "@/lib/share-intake/resolve-restaurant";
import { shareIntakeUserMessage } from "@/lib/share-intake/errors";
import type {
  PendingShareRecord,
  RestaurantCandidate,
  RestaurantResolutionResult,
} from "@/lib/share-intake/types";
import { getCurrentCoordinates } from "@/lib/location";
import { searchRestaurantsByText } from "@/lib/places/google";
import { cn } from "@/lib/utils";

type Step = "loading" | "resolved" | "multiple" | "unresolved" | "search" | "success";

function platformLabel(p: string): string {
  const map: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    facebook: "Facebook",
    google_maps: "Google Maps",
    yelp: "Yelp",
    restaurant_website: "Website",
    web: "Web",
    unknown: "Link",
  };
  return map[p] ?? "Link";
}

export function ShareImportScreen({ pendingId }: { pendingId: string }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const saveShareToTryNext = useAppStore((s) => s.saveShareToTryNext);
  const [pending, setPending] = useState<PendingShareRecord | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [resolution, setResolution] = useState<RestaurantResolutionResult | null>(null);
  const [selected, setSelected] = useState<RestaurantCandidate | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedBookmarkId, setSavedBookmarkId] = useState<string | null>(null);
  const [alreadyExisted, setAlreadyExisted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RestaurantCandidate[]>([]);
  const [searching, setSearching] = useState(false);

  const runResolve = useCallback(async (record: PendingShareRecord) => {
    setStep("loading");
    setError(null);
    track("restaurant_resolution_started", { platform: record.sourcePlatform });
    await setShareStatus(record.id, "processing");
    try {
      const coords = await getCurrentCoordinates();
      const result = await resolveRestaurantFromShare({
        originalUrl: record.originalUrl,
        canonicalUrl: record.canonicalUrl,
        rawText: record.rawText,
        sourcePlatform: record.sourcePlatform,
        coords,
      });
      setResolution(result);
      if (result.status === "resolved" && result.candidates[0]) {
        setSelected(result.candidates[0]);
        setStep("resolved");
        track("restaurant_resolution_resolved", {
          platform: record.sourcePlatform,
          confidence: result.confidence,
        });
      } else if (result.status === "multiple") {
        setStep("multiple");
        track("restaurant_resolution_multiple", {
          platform: record.sourcePlatform,
          count: result.candidates.length,
        });
      } else {
        setStep("unresolved");
        track("restaurant_resolution_failed", { platform: record.sourcePlatform });
      }
    } catch {
      setStep("unresolved");
      setError(shareIntakeUserMessage("LOOKUP_FAILED"));
      track("restaurant_resolution_failed", { platform: record.sourcePlatform });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      track("share_target_opened");
      const record = await getPendingShare(pendingId);
      if (cancelled) return;
      if (!record) {
        setError(shareIntakeUserMessage("NO_URL"));
        setStep("unresolved");
        return;
      }
      if (!record.originalUrl && !record.canonicalUrl) {
        setError(shareIntakeUserMessage("NO_URL"));
        setPending(record);
        setStep("unresolved");
        return;
      }
      setPending(record);
      track("share_received", { platform: record.sourcePlatform });
      track("source_platform_detected", {
        platform: record.sourcePlatform,
        domain: domainFromUrl(record.canonicalUrl) ?? undefined,
      });

      if (!isAuthenticated) {
        router.replace({
          pathname: "/login",
          params: { returnTo: "/share-import", pendingId: record.id },
        });
        return;
      }
      await runResolve(record);
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingId, isAuthenticated, runResolve]);

  const save = async (linkOnly: boolean) => {
    if (!pending?.canonicalUrl && !pending?.originalUrl) return;
    const url = pending.canonicalUrl ?? pending.originalUrl!;
    setSaving(true);
    setError(null);
    const result = await saveShareToTryNext({
      placeName: linkOnly
        ? resolution?.sourceTitle || resolution?.extractedName || "Restaurant not linked"
        : selected?.name || "Restaurant",
      placeAddress: linkOnly ? "" : selected?.address,
      placeCity: linkOnly ? resolution?.extractedLocation || "" : selected?.city,
      placeCuisine: linkOnly ? null : (selected?.cuisine as never) ?? null,
      placeImageUrl: linkOnly ? resolution?.sourceThumbnailUrl ?? null : selected?.photoUrl,
      latitude: linkOnly ? null : selected?.latitude ?? null,
      longitude: linkOnly ? null : selected?.longitude ?? null,
      googlePlaceId: linkOnly ? null : selected?.googlePlaceId ?? null,
      restaurantId: linkOnly ? null : selected?.restaurantId ?? null,
      note: note.trim() || null,
      linkOnly,
      sourcePlatform: pending.sourcePlatform,
      sourceUrl: pending.originalUrl ?? url,
      canonicalUrl: pending.canonicalUrl ?? url,
      sourceTitle: resolution?.sourceTitle ?? null,
      sourceThumbnailUrl: resolution?.sourceThumbnailUrl ?? null,
    });
    setSaving(false);
    if (!result.ok) {
      setError(shareIntakeUserMessage("SAVE_FAILED"));
      return;
    }
    await markShareConsumed(pending.id, "confirmed");
    setSavedBookmarkId(result.bookmark.id);
    setAlreadyExisted(result.alreadyExisted);
    setStep("success");
    track(linkOnly ? "share_saved_link_only" : "share_saved_to_try_next", {
      platform: pending.sourcePlatform,
      alreadyExisted: result.alreadyExisted,
    });
  };

  const cancel = async () => {
    if (pending) await markShareConsumed(pending.id, "cancelled");
    track("share_cancelled");
    router.replace("/(tabs)/discover");
  };

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const coords = await getCurrentCoordinates();
      const places = await searchRestaurantsByText(q, coords ?? undefined);
      setSearchResults(
        places.slice(0, 8).map((p) => ({
          googlePlaceId: p.googlePlaceId,
          name: p.name,
          address: p.address,
          city: p.city,
          cuisine: p.cuisine,
          latitude: p.latitude,
          longitude: p.longitude,
          photoUrl: p.imageUrl,
          provider: "google" as const,
          confidence: 0.8,
          confidenceReason: "User search",
        })),
      );
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  return (
    <ScrollView
      className={`flex-1 ${ui.screen}`}
      contentContainerClassName="px-4 pb-10 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="pt-2 gap-1">
        <Text className={`text-2xl font-bold ${ui.text.primary}`}>Import to PickyBites</Text>
        <Text className={`text-sm ${ui.text.muted}`}>
          Turn this find into your next food stop.
        </Text>
      </View>

      {pending ? (
        <Card className="gap-2 py-4">
          <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
            From {platformLabel(pending.sourcePlatform)}
          </Text>
          {resolution?.sourceTitle ? (
            <Text className={`text-base font-semibold ${ui.text.primary}`} numberOfLines={2}>
              {resolution.sourceTitle}
            </Text>
          ) : null}
          <Text className={`text-xs ${ui.text.faint}`} numberOfLines={2}>
            {pending.originalUrl ?? pending.rawText}
          </Text>
        </Card>
      ) : null}

      {step === "loading" ? (
        <View className="items-center py-10 gap-3">
          <ActivityIndicator size="large" color={brandColors.primary} />
          <Text className={`text-sm ${ui.text.secondary}`}>Finding the restaurant…</Text>
        </View>
      ) : null}

      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

      {(step === "resolved" || step === "multiple") && selected ? (
        <CandidateCard candidate={selected} selected />
      ) : null}

      {step === "resolved" && selected ? (
        <View className="gap-3">
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor="#9D9692"
            className={`rounded-2xl px-4 py-3 text-base ${ui.surface.search} ${ui.text.primary}`}
          />
          <Button
            label="Save to Try Next"
            loading={saving}
            onPress={() => void save(false)}
          />
          <Button
            label="Change Restaurant"
            variant="secondary"
            onPress={() => {
              track("restaurant_changed");
              setStep("multiple");
            }}
          />
          <Button label="Cancel" variant="ghost" onPress={() => void cancel()} />
        </View>
      ) : null}

      {step === "multiple" ? (
        <View className="gap-3">
          <Text className={`text-lg font-bold ${ui.text.primary}`}>We found a few matches</Text>
          {(resolution?.candidates ?? []).map((c) => (
            <Pressable
              key={`${c.googlePlaceId}-${c.name}`}
              onPress={() => setSelected(c)}
            >
              <CandidateCard candidate={c} selected={selected?.googlePlaceId === c.googlePlaceId} />
            </Pressable>
          ))}
          <Button
            label="Confirm Restaurant"
            disabled={!selected}
            onPress={() => setStep("resolved")}
          />
          <Button
            label="Search Restaurant"
            variant="secondary"
            onPress={() => setStep("search")}
          />
          <Button label="Cancel" variant="ghost" onPress={() => void cancel()} />
        </View>
      ) : null}

      {step === "unresolved" ? (
        <View className="gap-3">
          <Text className={`text-lg font-bold ${ui.text.primary}`}>Which restaurant is this?</Text>
          <Text className={`text-sm ${ui.text.muted}`}>
            {error ?? shareIntakeUserMessage("LOOKUP_FAILED")}
          </Text>
          <Button label="Search Restaurant" onPress={() => setStep("search")} />
          <Button
            label="Save Link Only"
            variant="secondary"
            loading={saving}
            onPress={() => void save(true)}
          />
          <Button label="Cancel" variant="ghost" onPress={() => void cancel()} />
        </View>
      ) : null}

      {step === "search" ? (
        <View className="gap-3">
          <Text className={`text-lg font-bold ${ui.text.primary}`}>Search Restaurant</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Name or city"
            placeholderTextColor="#9D9692"
            className={`rounded-2xl px-4 py-3 text-base ${ui.surface.search} ${ui.text.primary}`}
            onSubmitEditing={() => void runSearch()}
            returnKeyType="search"
          />
          <Button label="Search" loading={searching} onPress={() => void runSearch()} />
          {searchResults.map((c) => (
            <Pressable
              key={c.googlePlaceId ?? c.name}
              onPress={() => {
                setSelected(c);
                setStep("resolved");
                track("restaurant_changed");
              }}
            >
              <CandidateCard candidate={c} />
            </Pressable>
          ))}
          <Button label="Back" variant="ghost" onPress={() => setStep("unresolved")} />
        </View>
      ) : null}

      {step === "success" ? (
        <View className="items-center gap-4 py-6">
          <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center">
            <Ionicons name="checkmark" size={36} color={brandColors.success} />
          </View>
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>Saved to Try Next</Text>
          <Text className={`text-sm text-center ${ui.text.secondary}`}>
            {alreadyExisted
              ? "Already in Try Next. We added the new link."
              : selected?.name || pending?.sourcePlatform
                ? `${selected?.name ?? "Link"} · ${platformLabel(pending?.sourcePlatform ?? "unknown")}`
                : "Your find is ready when you are."}
          </Text>
          <Button
            label="Continue Browsing"
            onPress={() => {
              track("share_continue_browsing");
              if (pending?.originalUrl) {
                // Prefer returning toward the shared content when possible
                router.replace("/(tabs)/discover");
              } else {
                router.replace("/(tabs)/discover");
              }
            }}
            className="w-full"
          />
          <Button
            label="Open in PickyBites"
            variant="secondary"
            className="w-full"
            onPress={() => {
              track("share_opened_in_app");
              if (savedBookmarkId && selected?.restaurantId) {
                router.replace(`/restaurant/${selected.restaurantId}`);
              } else if (savedBookmarkId) {
                router.replace(`/try-next/${savedBookmarkId}`);
              } else {
                router.replace({ pathname: "/(tabs)/bites", params: { segment: "want_to_try" } });
              }
            }}
          />
          <Button
            label="View Try Next"
            variant="ghost"
            className="w-full"
            onPress={() => {
              router.replace({ pathname: "/(tabs)/bites", params: { segment: "want_to_try" } });
            }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

function CandidateCard({
  candidate,
  selected,
}: {
  candidate: RestaurantCandidate;
  selected?: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex-row gap-3 py-3",
        selected && "border-2 border-savr-500",
      )}
    >
      {candidate.photoUrl ? (
        <Image
          source={{ uri: candidate.photoUrl }}
          style={{ width: 64, height: 64, borderRadius: 12 }}
        />
      ) : (
        <View className={`w-16 h-16 rounded-xl items-center justify-center ${ui.surface.muted}`}>
          <Ionicons name="restaurant" size={24} color={brandColors.primary} />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <Text className={`font-semibold ${ui.text.primary}`} numberOfLines={1}>
          {candidate.name}
        </Text>
        <Text className={`text-xs ${ui.text.muted}`} numberOfLines={1}>
          {[candidate.cuisine, candidate.city || candidate.address].filter(Boolean).join(" · ")}
        </Text>
        {candidate.confidenceReason ? (
          <Text className={`text-[10px] ${ui.text.faint}`}>{candidate.confidenceReason}</Text>
        ) : null}
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={brandColors.primary} /> : null}
    </Card>
  );
}
