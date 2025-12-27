import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import type { Venue, VenueWithDistance } from '@/types/rating';

interface VenueCardProps {
  venue: Venue | VenueWithDistance;
  onPress: () => void;
  showDistance?: boolean;
}

export function VenueCard({ venue, onPress, showDistance = true }: VenueCardProps) {
  const address = `${venue.address_city}, ${venue.address_state}`;
  const cuisines = venue.cuisine_types.join(', ');
  const distance = 'distanceMeters' in venue ? venue.distanceMeters : null;

  const formatDistance = (meters: number | null | undefined) => {
    if (meters === null || meters === undefined) return null;
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  const priceRange = venue.price_range
    ? '$'.repeat(venue.price_range)
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <ThemedView style={styles.card}>
        <ThemedView style={styles.header}>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {venue.name}
          </ThemedText>
          {priceRange && (
            <ThemedText style={styles.price}>{priceRange}</ThemedText>
          )}
        </ThemedView>

        {cuisines && (
          <ThemedText style={styles.cuisines} lightColor="#666" darkColor="#999">
            {cuisines}
          </ThemedText>
        )}

        <ThemedText style={styles.address} lightColor="#666" darkColor="#999">
          {address}
        </ThemedText>

        {showDistance && distance !== null && (
          <ThemedText style={styles.distance} lightColor="#ee6c2b" darkColor="#ff8c50">
            {formatDistance(distance)}
          </ThemedText>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    flex: 1,
  },
  price: {
    fontSize: 14,
    marginLeft: 8,
  },
  cuisines: {
    fontSize: 14,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    marginBottom: 4,
  },
  distance: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});
