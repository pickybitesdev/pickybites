import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Coordinates } from "@/lib/places/types";
import {
  autocompletePlaces,
  isGooglePlacesConfigured,
  resolvePlaceDetails,
  searchPlacesByText,
} from "@/lib/places/google";
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  createAutocompleteSessionToken,
  rankDiscoverSuggestions,
  shouldFetchAutocomplete,
  type PlaceSuggestion,
  type PlaceSuggestionKind,
  type ResolvedSearchPlace,
} from "@/lib/places/autocomplete";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { hapticSelection } from "@/lib/haptics";
import {
  PLACES_SIGN_IN_REQUIRED_MESSAGE,
  PLACES_UNAVAILABLE_MESSAGE,
} from "@/lib/discover-view";
import type { PlacesSearchStatus } from "@/lib/places/google";

export type DiscoverPlaceSearchHandle = {
  focus: () => void;
  clear: () => void;
  dismissSuggestions: () => void;
};

function iconForKind(kind: PlaceSuggestionKind): keyof typeof Ionicons.glyphMap {
  if (kind === "restaurant") return "restaurant-outline";
  if (kind === "address") return "navigate-outline";
  if (kind === "area") return "location-outline";
  return "search-outline";
}

function kindLabel(kind: PlaceSuggestionKind): string {
  if (kind === "restaurant") return "Restaurant";
  if (kind === "address") return "Address";
  if (kind === "area") return "Area";
  return "Place";
}

export const DiscoverPlaceSearch = forwardRef<
  DiscoverPlaceSearchHandle,
  {
    coords: Coordinates | null;
    onResolvedPlace: (place: ResolvedSearchPlace) => void;
    onNotFound?: () => void;
    onActiveChange?: (active: boolean) => void;
    placeholder?: string;
    /** When omitted, falls back to isGooglePlacesConfigured() (legacy). */
    searchStatus?: PlacesSearchStatus;
  }
>(function DiscoverPlaceSearch(
  {
    coords,
    onResolvedPlace,
    onNotFound,
    onActiveChange,
    placeholder = "Search city, neighborhood, or restaurant",
    searchStatus,
  },
  ref,
) {
  const colors = useThemedColors();
  const inputRef = useRef<TextInput>(null);
  const sessionTokenRef = useRef(createAutocompleteSessionToken());
  const requestGen = useRef(0);
  /** Skip one autocomplete cycle after a successful selection (avoids reopening the same query). */
  const suppressAutocompleteRef = useRef(false);
  /** True from suggestion tap until resolve finishes — keeps panel closed and ignores stale autocomplete. */
  const selectionInFlightRef = useRef(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const resolvedStatus: PlacesSearchStatus =
    searchStatus ?? (isGooglePlacesConfigured() ? "ready" : "unavailable");
  const placesReady = resolvedStatus === "ready";
  const unavailableMessage =
    resolvedStatus === "sign_in" ? PLACES_SIGN_IN_REQUIRED_MESSAGE : PLACES_UNAVAILABLE_MESSAGE;

  const setPanelOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      onActiveChange?.(next);
    },
    [onActiveChange],
  );

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      setQuery("");
      setSuggestions([]);
      setPanelOpen(false);
      setError(null);
      sessionTokenRef.current = createAutocompleteSessionToken();
    },
    dismissSuggestions: () => setPanelOpen(false),
  }));

  const dismissPanel = useCallback(() => {
    setPanelOpen(false);
    setSuggestions([]);
    Keyboard.dismiss();
    inputRef.current?.blur();
  }, [setPanelOpen]);

  const runAutocomplete = useCallback(
    async (text: string) => {
      if (!placesReady || !shouldFetchAutocomplete(text) || selectionInFlightRef.current) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      const gen = ++requestGen.current;
      setLoading(true);
      setError(null);
      try {
        // Skip tight location bias for longer queries so out-of-state cities
        // (e.g. "New York" while in Houston) can surface cleanly.
        const remoteQuery = text.trim().length >= 4;
        const results = await autocompletePlaces(text, {
          coords: remoteQuery ? null : coords,
          sessionToken: sessionTokenRef.current,
        });
        if (gen !== requestGen.current || selectionInFlightRef.current) return;
        setSuggestions(rankDiscoverSuggestions(results ?? [], text));
        setPanelOpen(true);
      } catch {
        if (gen !== requestGen.current || selectionInFlightRef.current) return;
        setSuggestions([]);
        setError("We couldn’t load search suggestions.");
        setPanelOpen(true);
      } finally {
        if (gen === requestGen.current) setLoading(false);
      }
    },
    [coords, placesReady, setPanelOpen],
  );

  useEffect(() => {
    if (suppressAutocompleteRef.current) {
      suppressAutocompleteRef.current = false;
      return;
    }
    if (!query.trim()) {
      setSuggestions([]);
      setError(null);
      setLoading(false);
      return;
    }
    const t = setTimeout(() => runAutocomplete(query), AUTOCOMPLETE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, runAutocomplete]);

  const finishWithResolved = (resolved: ResolvedSearchPlace | null) => {
    if (!resolved) {
      selectionInFlightRef.current = false;
      suppressAutocompleteRef.current = false;
      onNotFound?.();
      return;
    }
    hapticSelection();
    // Clear the field so the same query doesn't reopen the suggestion sheet.
    suppressAutocompleteRef.current = true;
    requestGen.current += 1;
    setQuery("");
    setSuggestions([]);
    setPanelOpen(false);
    setError(null);
    setLoading(false);
    sessionTokenRef.current = createAutocompleteSessionToken();
    Keyboard.dismiss();
    inputRef.current?.blur();
    selectionInFlightRef.current = false;
    onResolvedPlace(resolved);
  };

  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    // Close immediately — don't wait for place-details network round-trip.
    suppressAutocompleteRef.current = true;
    requestGen.current += 1;
    selectionInFlightRef.current = true;
    dismissPanel();
    setResolving(true);
    setError(null);
    try {
      const token = sessionTokenRef.current;
      const resolved = await resolvePlaceDetails(suggestion.placeId, token);
      finishWithResolved(resolved);
    } catch {
      selectionInFlightRef.current = false;
      suppressAutocompleteRef.current = false;
      setError("We couldn’t find that place.");
      setPanelOpen(true);
    } finally {
      setResolving(false);
    }
  };

  const submitSearch = async () => {
    const text = query.trim();
    if (!text) return;
    if (!placesReady) return;
    suppressAutocompleteRef.current = true;
    requestGen.current += 1;
    selectionInFlightRef.current = true;
    dismissPanel();
    setResolving(true);
    setError(null);
    try {
      // Prefer global text resolve for city/state jumps.
      const results = await searchPlacesByText(text, undefined);
      const first = results[0] ?? null;
      if (!first) {
        selectionInFlightRef.current = false;
        suppressAutocompleteRef.current = false;
        onNotFound?.();
        return;
      }
      finishWithResolved(first);
    } catch {
      selectionInFlightRef.current = false;
      suppressAutocompleteRef.current = false;
      setError("We couldn’t find that place.");
      onNotFound?.();
      setPanelOpen(true);
    } finally {
      setResolving(false);
    }
  };

  const showPanel =
    !resolving &&
    !selectionInFlightRef.current &&
    open &&
    (suggestions.length > 0 || !!error || (query.trim().length >= 2 && !loading));

  if (!placesReady) {
    return (
      <View className={`rounded-xl px-1 py-1 ${ui.surface.inset}`} testID="discover-search-unavailable">
        <Text className={`text-xs ${ui.text.secondary}`}>{unavailableMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.field, showPanel && styles.fieldActive]}
        className={ui.surface.search}
      >
        <Ionicons name="search" size={18} color={colors.iconMuted} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            if (v.trim()) setPanelOpen(true);
            else setPanelOpen(false);
          }}
          onFocus={() => {
            if (suggestions.length || error || query.trim().length >= 2) setPanelOpen(true);
          }}
          onBlur={() => {
            // Delay so suggestion press can register; always close (selection dismisses earlier).
            setTimeout(() => {
              if (!selectionInFlightRef.current) setPanelOpen(false);
            }, 180);
          }}
          onSubmitEditing={submitSearch}
          placeholder={placeholder}
          accessibilityLabel="Search city, neighborhood, or restaurant"
          returnKeyType="search"
          style={styles.input}
          placeholderTextColor={colors.placeholder}
          autoCorrect={false}
        />
        {loading || resolving ? (
          <ActivityIndicator size="small" color={colors.spinner} />
        ) : query.length > 0 ? (
          <Pressable
            onPress={() => {
              setQuery("");
              setSuggestions([]);
              setPanelOpen(false);
              setError(null);
              sessionTokenRef.current = createAutocompleteSessionToken();
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={brandColors.iconInactive} />
          </Pressable>
        ) : null}
      </View>

      {showPanel ? (
        <View style={styles.dropdown} testID="discover-search-suggestions">
          {error ? (
            <View style={styles.messageRow}>
              <Text className={`text-[13px] ${ui.text.secondary}`}>{error}</Text>
              <Pressable
                onPress={() => runAutocomplete(query)}
                accessibilityRole="button"
                accessibilityLabel="Try again"
                style={styles.tryAgain}
              >
                <Text style={styles.tryAgainText}>Try Again</Text>
              </Pressable>
            </View>
          ) : suggestions.length === 0 && !loading ? (
            <View style={styles.messageRow}>
              <Text className={`text-[13px] ${ui.text.secondary}`}>No matching places found.</Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              bounces={false}
              style={styles.list}
            >
              {suggestions.map((s, index) => (
                <Pressable
                  key={s.id}
                  onPress={() => selectSuggestion(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.primaryText}${s.secondaryText ? `, ${s.secondaryText}` : ""}, ${kindLabel(s.kind)}`}
                  style={({ pressed }) => [
                    styles.row,
                    index === suggestions.length - 1 && styles.rowLast,
                    pressed && { backgroundColor: brandColors.primaryLight },
                  ]}
                  testID={`discover-search-suggestion-${s.id}`}
                >
                  <Ionicons
                    name={iconForKind(s.kind)}
                    size={18}
                    color={brandColors.primary}
                    style={styles.rowIcon}
                  />
                  <View style={styles.rowText}>
                    <Text style={styles.primary} numberOfLines={1}>
                      {s.primaryText}
                    </Text>
                    <Text style={styles.secondary} numberOfLines={1}>
                      {[kindLabel(s.kind), s.secondaryText].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    zIndex: 40,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  fieldActive: {
    borderColor: brandColors.primarySoft,
    backgroundColor: brandColors.surface,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: brandColors.textPrimary,
    paddingVertical: 10,
  },
  clearBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: brandColors.surface,
    borderWidth: 1,
    borderColor: brandColors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 12,
  },
  list: {
    maxHeight: 220,
  },
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brandColors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    marginTop: 1,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  primary: {
    fontSize: 14,
    fontWeight: "600",
    color: brandColors.textPrimary,
  },
  secondary: {
    fontSize: 11,
    color: brandColors.textSecondary,
  },
  messageRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  tryAgain: {
    alignSelf: "flex-start",
    minHeight: 40,
    justifyContent: "center",
  },
  tryAgainText: {
    color: brandColors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});
