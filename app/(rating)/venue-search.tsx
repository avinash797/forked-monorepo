import { LocationStatusBanner } from "@/components/rating/location-status-banner";
import { SearchInput } from "@/components/rating/search-input";
import { VenueCard } from "@/components/rating/venue-card";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRatingFlow } from "@/contexts/rating-flow-context";
import { useGPSVerification, useLocation } from "@/hooks/use-location";
import { useVenueSearch } from "@/hooks/use-venues";
import type { Venue, VenueWithDistance } from "@/types/rating";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet } from "react-native";

export default function VenueSearchScreen() {
  const router = useRouter();
  const { setVenue, state } = useRatingFlow();
  const [searchQuery, setSearchQuery] = useState("");
  const { venues, isLoading, error } = useVenueSearch(searchQuery);
  const { location, hasPermission, isLoading: locationLoading } = useLocation();
  const gpsStatus = useGPSVerification(location, state.selectedVenue);

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

  const venuesWithDistance: VenueWithDistance[] = useMemo(() => {
    return venues
      .map((venue) => ({
        ...venue,
        distanceMeters: calculateDistance(venue),
      }))
      .sort((a, b) => {
        if (a.distanceMeters === undefined) return 1;
        if (b.distanceMeters === undefined) return -1;
        return a.distanceMeters - b.distanceMeters;
      });
  }, [venues, location]);

  const handleVenueSelect = (venue: Venue) => {
    setVenue(venue);
    router.push("/(rating)/dish-selection");
  };

  const handleCreateVenue = () => {
    router.push("/(rating)/create-venue");
  };

  return (
    <ThemedView style={styles.container}>
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by venue name or city..."
        isLoading={isLoading}
      />

      {!locationLoading && hasPermission && (
        <LocationStatusBanner status={gpsStatus} />
      )}

      {searchQuery.length === 0 && (
        <ThemedView style={styles.emptyState}>
          <ThemedText
            style={styles.emptyText}
            lightColor="#666"
            darkColor="#999"
          >
            Start typing to search for a venue
          </ThemedText>
        </ThemedView>
      )}

      {searchQuery.length > 0 && venues.length === 0 && (
        <ThemedView style={styles.emptyState}>
          <ThemedText
            style={styles.emptyText}
            lightColor="#666"
            darkColor="#999"
          >
            No venues found
          </ThemedText>
          <ThemedButton
            variant="secondary"
            onPress={handleCreateVenue}
            style={styles.createButton}
          >
            Add New Venue
          </ThemedButton>
        </ThemedView>
      )}

      {venuesWithDistance.length > 0 && (
        <>
          <FlatList
            data={venuesWithDistance}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VenueCard
                venue={item}
                onPress={() => handleVenueSelect(item)}
                showDistance={hasPermission && location !== null}
              />
            )}
            contentContainerStyle={styles.listContent}
          />

          <ThemedButton
            variant="secondary"
            onPress={handleCreateVenue}
            style={styles.bottomButton}
          >
            Can&apos;t find your venue?
          </ThemedButton>
        </>
      )}

      {error && (
        <ThemedText
          style={styles.errorText}
          lightColor="#f44336"
          darkColor="#ff6b6b"
        >
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  createButton: {
    marginTop: 16,
  },
  bottomButton: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});
