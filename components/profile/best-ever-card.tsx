import { ScoreBadge } from '@/components/score-badge';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { BestEverDish } from '@/hooks/use-user-stats';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';

interface BestEverCardProps {
    item: BestEverDish;
    index: number;
    onPress?: () => void;
}

export function BestEverCard({ item, index, onPress }: BestEverCardProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `My best ${item.dish_type_name}? ${item.restaurant_name} in ${item.city_name}! Scored ${item.derived_score?.toFixed(1)}/10 on Forked`,
                title: `My Best ${item.dish_type_name}`,
            });
        } catch {
            // User cancelled or error
        }
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={styles.container}
        >
            <Pressable
                style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                ]}
                onPress={onPress}
            >
                <Image
                    source={{ uri: item.photo_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                />

                {/* Emoji or Icon badge */}
                <View style={styles.emojiBadge}>
                    {item.dish_type_icon ? (
                        <SvgXml xml={item.dish_type_icon} width={24} height={24} />
                    ) : (
                        <ThemedText style={styles.emoji}>
                            {item.dish_type_emoji}
                        </ThemedText>
                    )}
                </View>

                {/* Score badge */}
                <View style={styles.scoreBadgeContainer}>
                    <ScoreBadge score={item.derived_score ?? 0} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <ThemedText style={styles.dishType}>
                        Best {item.dish_type_name}
                    </ThemedText>
                    <ThemedText style={styles.restaurantName} numberOfLines={1}>
                        {item.restaurant_name}
                    </ThemedText>
                    <ThemedText style={styles.city} numberOfLines={1}>
                        {item.city_name}
                    </ThemedText>
                </View>

                {/* Share button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.shareButton,
                        pressed && styles.shareButtonPressed,
                    ]}
                    onPress={handleShare}
                    hitSlop={8}
                >
                    <IconSymbol name="share-outline" size={20} color="#fff" />
                </Pressable>
            </Pressable>
        </Animated.View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            width: '100%',
        },
        card: {
            height: 200,
            borderRadius: theme.radius.lg,
            borderCurve: 'continuous',
            overflow: 'hidden',
            backgroundColor: theme.color.surface,
        },
        cardPressed: {
            transform: [{ scale: 0.98 }],
            opacity: 0.9,
        },
        image: {
            ...StyleSheet.absoluteFillObject,
        },
        gradient: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '60%',
        },
        emojiBadge: {
            position: 'absolute',
            top: theme.space.sm,
            left: theme.space.sm,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.space.sm,
            paddingVertical: theme.space.xs,
        },
        emoji: {
            fontSize: 24,
        },
        scoreBadgeContainer: {
            position: 'absolute',
            top: theme.space.sm,
            right: theme.space.sm,
        },
        content: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: theme.space.md,
        },
        dishType: {
            fontSize: theme.font.size.xs,
            fontWeight: '600',
            color: 'rgba(255,255,255,0.8)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 2,
        },
        restaurantName: {
            fontSize: theme.font.size.lg,
            fontWeight: '700',
            color: '#fff',
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
        },
        city: {
            fontSize: theme.font.size.sm,
            color: 'rgba(255,255,255,0.8)',
            marginTop: 2,
        },
        shareButton: {
            position: 'absolute',
            bottom: theme.space.md,
            right: theme.space.md,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        shareButtonPressed: {
            backgroundColor: 'rgba(0,0,0,0.6)',
        },
    });
