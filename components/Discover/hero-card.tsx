import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/contexts/theme-provider';
import { Image } from 'expo-image';
import { ThemedText } from '../themed-text';
import { IconSymbol } from '../ui/icon-symbol';

interface HeroCardProps {
    dishName: string;
    restaurantName: string;
    neighborhood: string;
    distance?: string;
    score: number;
    photoPath?: string | null;
    confidence_score?: number;
    onPress: () => void;
}

export default function HeroCard({
    dishName,
    restaurantName,
    neighborhood,
    distance,
    score,
    photoPath,
    confidence_score,
    onPress,
}: HeroCardProps) {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const confidence = Math.max(1, Math.ceil((confidence_score ?? 0) * 5));
    const flames = '🔥'.repeat(confidence);

    return (
        <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                style={styles.card}
            >
                {/* Image Background */}
                <View style={styles.imageContainer}>
                    {photoPath ? (
                        <Image
                            source={{ uri: photoPath }}
                            style={styles.image}
                            contentFit="cover"
                            transition={200}
                        />
                    ) : (
                        <View style={[styles.image, styles.placeholder]}>
                            <IconSymbol
                                name="image-outline"
                                size={40}
                                color={theme.color.textSecondary}
                            />
                        </View>
                    )}

                    {/* Rank Badge */}
                    <View style={styles.rankBadge}>
                        <ThemedText style={styles.rankText}>👑 #1</ThemedText>
                    </View>
                </View>

                {/* Content Overlay/Section */}
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <ThemedText
                            type="subtitle"
                            numberOfLines={1}
                            style={styles.restaurantName}
                        >
                            {restaurantName}
                        </ThemedText>
                    </View>

                    <View style={styles.detailsRow}>
                        <ThemedText style={styles.detailText}>
                            {neighborhood}
                        </ThemedText>
                        {distance && (
                            <>
                                <ThemedText style={styles.dot}>•</ThemedText>
                                <ThemedText style={styles.detailText}>
                                    {distance}
                                </ThemedText>
                            </>
                        )}
                    </View>

                    <View style={styles.scoreRow}>
                        <ThemedText style={styles.flames}>{flames}</ThemedText>
                        <ThemedText style={styles.confidenceLabel}>
                            High Confidence
                        </ThemedText>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: theme.space.md,
            marginVertical: theme.space.sm,
        },
        card: {
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
        },
        imageContainer: {
            height: 250,
            width: '100%',
            backgroundColor: theme.color.backgroundSecondary,
            position: 'relative',
        },
        image: {
            width: '100%',
            height: '100%',
        },
        placeholder: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        rankBadge: {
            position: 'absolute',
            top: theme.space.md,
            left: theme.space.md,
            backgroundColor: 'rgba(255, 215, 0, 0.95)', // Gold
            paddingHorizontal: theme.space.sm,
            paddingVertical: 4,
            borderRadius: theme.radius.sm,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        rankText: {
            fontWeight: 'bold',
            color: '#000',
            fontSize: 14,
        },
        content: {
            padding: theme.space.md,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
        },
        restaurantName: {
            fontSize: 20,
            fontWeight: '700',
        },
        detailsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.space.sm,
        },
        detailText: {
            color: theme.color.textSecondary,
            fontSize: 14,
        },
        dot: {
            color: theme.color.textSecondary,
            marginHorizontal: 6,
        },
        scoreRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
            gap: 8,
        },
        flames: {
            fontSize: 16,
            letterSpacing: 2,
        },
        confidenceLabel: {
            fontSize: 12,
            color: theme.color.textSecondary,
            fontWeight: '600',
            textTransform: 'uppercase',
        },
    });
