import { useTheme } from '@/contexts/theme-provider';
import { buildComponentStyles } from '@/lib/theme/componentStyles';
import type { Venue, VenueWithDistance } from '@/types/rating';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface VenueCardProps {
    venue: Venue | VenueWithDistance;
    onPress: () => void;
    showDistance?: boolean;
}

export function VenueCard({
    venue,
    onPress,
    showDistance = true,
}: VenueCardProps) {
    const { theme } = useTheme();
    const builtStyles = buildComponentStyles(theme);
    const styles = createThemedStyles(theme);

    const address = `${venue.address_city}, ${venue.address_state}`;
    const cuisines = venue.cuisine_types.join(', ');
    const distance = 'distanceMeters' in venue ? venue.distanceMeters : null;

    const formatDistance = (meters: number | null | undefined) => {
        if (meters === null || meters === undefined) return null;
        if (meters < 1000) return `${Math.round(meters)}m away`;
        return `${(meters / 1000).toFixed(1)}km away`;
    };

    const priceRange = venue.price_range ? '$'.repeat(venue.price_range) : null;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
        >
            <View style={builtStyles.card}>
                <View style={styles.header}>
                    <Text style={builtStyles.h2}>{venue.name}</Text>
                    {priceRange && (
                        <Text style={builtStyles.body}>{priceRange}</Text>
                    )}
                </View>

                {cuisines && (
                    <Text style={builtStyles.caption}>{cuisines}</Text>
                )}

                <Text style={builtStyles.caption}>{address}</Text>

                {showDistance && distance !== null && (
                    <Text style={builtStyles.accentTag}>
                        {formatDistance(distance)}
                    </Text>
                )}
            </View>
        </Pressable>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.space.xxs,
            backgroundColor: 'transparent',
        },
    });
