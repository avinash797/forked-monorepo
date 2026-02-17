import { useTheme } from '@/contexts/theme-provider';
import { buildComponentStyles } from '@/lib/theme/componentStyles';
import { Restaurant } from '@/types/restaurant';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface VenueCardProps {
    venue: Restaurant;
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

    const address = venue.address;

    const formatDistance = (meters: number | null | undefined) => {
        if (meters === null || meters === undefined) return null;
        if (meters < 1000) return `${Math.round(meters)}m away`;
        return `${(meters / 1000).toFixed(1)}km away`;
    };

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.05)' }}
        >
            <View style={builtStyles.card}>
                <View style={styles.header}>
                    <Text style={builtStyles.h2}>{venue.name}</Text>
                </View>

                <Text style={builtStyles.caption}>{address}</Text>

                {/* {showDistance && (
                    <Text style={builtStyles.accentTag}>
                        {formatDistance(venue.distanceMeters ?? 0)}
                    </Text>
                )} */}
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
