import { SearchInput } from "@/components/rating/search-input";
import { VenueCard } from "@/components/rating/venue-card";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRatingFlow } from "@/contexts/rating-flow-context";
import { useTheme } from "@/contexts/theme-provider";
import { useAddressSearch } from "@/hooks/use-address-search";
import { useLocation } from "@/hooks/use-location";
import { useCreateVenue, useVenueSearch } from "@/hooks/use-venues";
import type { Venue, VenueWithDistance } from "@/types/rating";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

type SearchResultItem =
  | { type: 'venue'; data: VenueWithDistance }
  | { type: 'mapbox'; data: any };

export default function VenueSearchScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createThemedStyles(theme);
  const { setVenue } = useRatingFlow();
  const [searchQuery, setSearchQuery] = useState("");
  const [dbVenues, setDbVenues] = useState<Venue[]>([]);
  const [mapboxSuggestions, setMapboxSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { location, hasPermission } = useLocation();
  const { searchAddress, selectAddress } = useAddressSearch({
    proximity: location ? { latitude: location.latitude, longitude: location.longitude } : null
  });

  const { searchVenues, getNearbyVenues } = useVenueSearch();
  const { createVenue, isLoading: isCreating } = useCreateVenue();



  const textColor = theme.color.textPrimary;
  const iconColor = theme.color.textTertiary;

  const debounceTimer = useRef<NodeJS.Timeout | number>(0);

  const calculateDistance = (venue: Venue): number | undefined => {
    if (!location || !venue.latitude || !venue.longitude) return undefined;

    const R = 6371000;
    const lat1 = (location.latitude * Math.PI) / 180;
    const lat2 = (venue.latitude * Math.PI) / 180;
    const deltaLat = ((venue.latitude - location.latitude) * Math.PI) / 180;
    const deltaLon = ((venue.longitude - location.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setDbVenues([]);
      setMapboxSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setDbVenues([]);
    setMapboxSuggestions([]);

    try {
      // 1. Search DB First
      const venues = await searchVenues(query);

      if (venues && venues.length > 0) {
        setDbVenues(venues);
      }
      //TODO: Reenable this when moving to production, disabling right now to preserve cost
      // else {
      //   // 2. If no DB results, search Mapbox
      //   const suggestions = await searchAddress(query);
      //   setMapboxSuggestions(suggestions);
      // }
    } catch (err: any) {
      console.error("Search error:", err);
      // searchVenues handles its own error state internally but returns [] on error mostly. 
      // If we want to capture error text we might need to look at shared state, but this is fine.
      setSearchError("Failed to search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const fetchNearbySuggestions = async () => {
    if (!location) return;

    // Check if we are already searching or have typed something
    if (searchQuery.length > 0) return;

    setIsSearching(true);
    try {
      // Parallel fetch: DB venues + Mapbox near user
      //TODO: Reenable this when moving to production, disabling right now to preserve cost, move mapbox back in the promise resolver
      const mapboxResults = null;
      const [dbResults] = await Promise.all([
        getNearbyVenues(),
        // searchAddress("restaurant")
      ]);

      if (dbResults) {
        const sortedResults = dbResults
          .map((v) => ({ ...v, distance: calculateDistance(v) }))
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        setDbVenues(sortedResults);
      }
      if (mapboxResults) setMapboxSuggestions(mapboxResults);
    } catch (err) {
      console.log("Error fetching nearby:", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (location && searchQuery === "") {
      //TODO: Reenable this when moving to production, disabling right now to preserve cost
      fetchNearbySuggestions();
    }
  }, [location, searchQuery]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // If query is empty, we don't search (we might show nearby instead)
    if (searchQuery.trim() === "") {
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 400); // Slightly longer debounce to wait for typing

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  const venuesWithDistance: VenueWithDistance[] = useMemo(() => {
    return dbVenues
      .map((venue) => ({
        ...venue,
        distanceMeters: calculateDistance(venue),
      }))
      .sort((a, b) => {
        if (a.distanceMeters === undefined) return 1;
        if (b.distanceMeters === undefined) return -1;
        return a.distanceMeters - b.distanceMeters;
      });
  }, [dbVenues, location]);

  const handleVenueSelect = (venue: Venue) => {
    setVenue(venue);
    router.push("/(protected)/(rating)/dish-selection");
  };

  const handleMapboxSelect = async (suggestion: any) => {
    try {
      setIsSearching(true); // Reuse search loading state or add specific one
      const addressData = await selectAddress(suggestion.mapbox_id);

      if (!addressData) {
        throw new Error("Could not retrieve venue details");
      }

      // Create the venue automatically
      const newVenue = await createVenue({
        name: addressData.name,
        address_street: addressData.street,
        address_city: addressData.city,
        address_state: addressData.state,
        address_zip: addressData.zip,
        address_country: addressData.country,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        cuisine_types: [], // Empty for now, user can add dishes later which imply cuisine
        price_range: null,
      });

      if (newVenue) {
        setVenue(newVenue);
        router.push("/(protected)/(rating)/dish-selection");
      } else {
        throw new Error("Failed to create venue");
      }

    } catch (err) {
      Alert.alert("Error", "Could not select this venue. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateVenue = () => {
    router.push("/(protected)/(rating)/create-venue");
  };

  const combinedData: SearchResultItem[] = [
    ...venuesWithDistance.map(v => ({ type: 'venue' as const, data: v })),
    ...mapboxSuggestions.map(s => ({ type: 'mapbox' as const, data: s }))
  ];

  const renderItem = ({ item }: { item: SearchResultItem }) => {
    if (item.type === 'venue') {
      return (
        <VenueCard
          venue={item.data}
          onPress={() => handleVenueSelect(item.data)}
          showDistance={hasPermission && location !== null}
        />
      );
    } else {
      // Mapbox suggestion
      return (
        <TouchableOpacity style={styles.mapboxItem} onPress={() => handleMapboxSelect(item.data)}>
          <View style={styles.mapboxIcon}>
            <IconSymbol name="add-location" size={24} color={iconColor} />
          </View>
          <View style={styles.mapboxContent}>
            <ThemedText type="defaultSemiBold">{item.data.name}</ThemedText>
            <ThemedText style={styles.mapboxAddress} lightColor="#666" darkColor="#999">
              {item.data.full_address}
            </ThemedText>
            <ThemedText style={styles.mapboxMeta} lightColor="#2e7d32" darkColor="#4caf50">
              New Venue
            </ThemedText>
          </View>
          <IconSymbol name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search for a restaurant..."
        isLoading={isSearching || isCreating}
      />

      {searchQuery.length === 0 && (
        <ThemedView style={styles.emptyState}>
          <ThemedText
            style={styles.emptyText}
            lightColor="#666"
            darkColor="#999"
          >
            Start typing to search
          </ThemedText>
        </ThemedView>
      )}

      {searchError && (
        <ThemedText style={styles.errorText} lightColor="#f44336" darkColor="#ff6b6b">
          {searchError}
        </ThemedText>
      )}

      {combinedData.length > 0 && (
        <FlatList
          data={combinedData}
          keyExtractor={(item) => item.type === 'venue' ? item.data.id : item.data.mapbox_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Show "Can't find?" only if we searched and found NOTHING (both DB and Mapbox empty) */}
      {searchQuery.length > 0 && !isSearching && combinedData.length === 0 && (
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>No results found.</ThemedText>
          <ThemedButton
            variant="secondary"
            onPress={handleCreateVenue}
            style={styles.createButton}
          >
            Manually Add Venue
          </ThemedButton>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.space.md,
  },
  listContent: {
    paddingVertical: theme.space.md,
    gap: theme.space.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.space.sm,
  },
  emptyText: {
    fontSize: theme.font.size.md,
    textAlign: "center",
    marginBottom: theme.space.sm,
  },
  createButton: {
    marginTop: theme.space.md,
  },
  errorText: {
    fontSize: theme.font.size.sm,
    marginTop: theme.space.sm,
    textAlign: "center",
  },
  mapboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.space.md,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: theme.radius.md,
    marginBottom: theme.space.md,
  },
  mapboxIcon: {
    marginRight: theme.space.sm,
  },
  mapboxContent: {
    flex: 1,
  },
  mapboxAddress: {
    fontSize: theme.font.size.md,
    marginTop: theme.space.xxs,
  },
  mapboxMeta: {
    fontSize: theme.font.size.xs,
    marginTop: theme.space.xxs,
    fontWeight: theme.font.weight.semibold,
  }
});
