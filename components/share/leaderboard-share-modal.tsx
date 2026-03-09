import { IconSymbol } from '@/components/ui/icon-symbol';
import { DishTypeIcon } from '@/components/ui/dish-type-icon';
import { useTheme } from '@/contexts/theme-provider';
import type { LeaderboardEntry } from '@/components/Discover/leaderboard-row';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    Share,
    StyleSheet,
    Text,
    View,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

const MEDAL_COLORS = {
    1: { bg: '#F59E0B', border: '#D97706', label: '#78350F' },
    2: { bg: '#9CA3AF', border: '#6B7280', label: '#1F2937' },
    3: { bg: '#CD7F32', border: '#B45309', label: '#451A03' },
} as const;

const SCORE_COLORS = (score: number) => {
    if (score >= 7.0) return { bg: '#059669', text: '#fff' };
    if (score >= 4.0) return { bg: '#D97706', text: '#fff' };
    return { bg: '#DC2626', text: '#fff' };
};

interface LeaderboardShareModalProps {
    visible: boolean;
    onClose: () => void;
    dishTypeName: string;
    /** SVG string — rendered first when available */
    dishTypeIcon?: string | null;
    /** Emoji fallback when no SVG icon */
    dishTypeEmoji?: string | null;
    cityName: string;
    username: string;
    entries: LeaderboardEntry[];
    /** When true, shows personal framing ("My Top 3") instead of city framing */
    isPersonal?: boolean;
}

export function LeaderboardShareModal({
    visible,
    onClose,
    dishTypeName,
    dishTypeIcon,
    dishTypeEmoji,
    cityName,
    username,
    entries,
    isPersonal = false,
}: LeaderboardShareModalProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const cardRef = useRef<View>(null);
    const [isSharing, setIsSharing] = useState(false);

    const top3 = entries.slice(0, 3);

    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsSharing(true);
        try {
            const uri = await captureRef(cardRef, {
                format: 'jpg',
                quality: 0.95,
            });
            const msg = isPersonal
                ? `My top ${dishTypeName} ranked on Forked 🍴`
                : `${username ? `${username}'s` : 'Community'} Top 3 ${dishTypeName} in ${cityName} on Forked 🍴`;
            await Share.share({
                url: uri,
                message: Platform.OS === 'android' ? msg : undefined,
            });
        } catch {
            // user cancelled or error
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent
        >
            <LinearGradient
                colors={['#0d0117', '#12082a', '#1c0e35', '#0f0c1e']}
                locations={[0, 0.35, 0.7, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.screen, { paddingTop: insets.top }]}
            >
                {/* Close button */}
                <Pressable
                    style={styles.closeButton}
                    onPress={onClose}
                    hitSlop={12}
                >
                    <IconSymbol name="close-outline" size={26} color="rgba(255,255,255,0.8)" />
                </Pressable>

                {/* Shareable card area */}
                <View style={styles.cardWrapper}>
                    <View ref={cardRef} collapsable={false}>
                        <LinearGradient
                            colors={['#0d0117', '#12082a', '#1c0e35', '#0f0c1e']}
                            locations={[0, 0.35, 0.7, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.shareCard}
                        >
                            {/* Decorative glow blobs */}
                            <View style={styles.glowTopRight} />
                            <View style={styles.glowBottomLeft} />

                            {/* Header branding */}
                            <View style={styles.brandRow}>
                                <Text style={styles.brandText}>FORKED</Text>
                            </View>

                            {/* Title */}
                            <View style={styles.titleBlock}>
                                <Text style={styles.usernameLabel}>
                                    {username ? `@${username}` : isPersonal ? 'My' : 'Community'}
                                </Text>
                                <View style={styles.titleMainRow}>
                                    {(dishTypeIcon || dishTypeEmoji) && (
                                        <View style={styles.dishIconWrap}>
                                            <DishTypeIcon
                                                icon={dishTypeIcon}
                                                emoji={dishTypeEmoji}
                                                size={30}
                                                color="#ffffff"
                                            />
                                        </View>
                                    )}
                                    <Text style={styles.titleMain}>
                                        {isPersonal ? 'My' : 'Top 3'} {dishTypeName}
                                    </Text>
                                </View>
                                {!isPersonal && cityName ? (
                                    <Text style={styles.titleCity}>in {cityName}</Text>
                                ) : null}
                            </View>

                            {/* Divider */}
                            <View style={styles.divider} />

                            {/* Top 3 cards */}
                            <View style={styles.rankingList}>
                                {top3.map((entry, idx) => {
                                    const rank = (idx + 1) as 1 | 2 | 3;
                                    const medal = MEDAL_COLORS[rank];
                                    const score = entry.bayesian_score ?? entry.derived_score ?? 0;
                                    const scoreColor = SCORE_COLORS(score);
                                    const photoUri = entry.featured_photo_url ?? entry.photo_url;

                                    return (
                                        <View key={entry.restaurant_id} style={styles.rankCard}>
                                            {/* Rank badge */}
                                            <View style={[styles.rankBadge, { backgroundColor: medal.bg, borderColor: medal.border }]}>
                                                <Text style={[styles.rankNum, { color: medal.label }]}>
                                                    {rank}
                                                </Text>
                                            </View>

                                            {/* Photo */}
                                            <View style={styles.photoWrap}>
                                                {photoUri ? (
                                                    <Image
                                                        source={{ uri: photoUri }}
                                                        style={styles.photo}
                                                        contentFit="cover"
                                                    />
                                                ) : (
                                                    <View style={[styles.photo, styles.photoPlaceholder]}>
                                                        <Text style={styles.photoPlaceholderText}>🍽️</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Info */}
                                            <View style={styles.cardInfo}>
                                                <Text style={styles.restaurantName} numberOfLines={1}>
                                                    {entry.restaurant_name}
                                                </Text>
                                                <Text style={styles.neighborhoodText} numberOfLines={1}>
                                                    {entry.neighborhood_name ?? entry.city_name ?? ''}
                                                </Text>
                                            </View>

                                            {/* Score */}
                                            <View style={[styles.scorePill, { backgroundColor: scoreColor.bg }]}>
                                                <Text style={[styles.scoreText, { color: scoreColor.text }]}>
                                                    {score.toFixed(1)}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>forked.app</Text>
                            </View>
                        </LinearGradient>
                    </View>
                </View>

                {/* Share action button */}
                <View style={[styles.actionArea, { paddingBottom: insets.bottom + 16 }]}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.shareButton,
                            pressed && styles.shareButtonPressed,
                        ]}
                        onPress={handleShare}
                        disabled={isSharing}
                    >
                        {isSharing ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <IconSymbol name="share-outline" size={20} color="#fff" />
                                <Text style={styles.shareButtonText}>Share Image</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </LinearGradient>
        </Modal>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    closeButton: {
        alignSelf: 'flex-end',
        marginRight: 20,
        marginTop: 8,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    shareCard: {
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        paddingTop: 28,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    glowTopRight: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#ee6c2b',
        opacity: 0.15,
    },
    glowBottomLeft: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#7c3aed',
        opacity: 0.18,
    },
    brandRow: {
        alignItems: 'center',
        marginBottom: 20,
    },
    brandText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#ee6c2b',
        letterSpacing: 4,
    },
    titleBlock: {
        alignItems: 'center',
        marginBottom: 20,
    },
    titleMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    dishIconWrap: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    usernameLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    titleMain: {
        fontSize: 28,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.5,
        textAlign: 'center',
        lineHeight: 32,
    },
    titleCity: {
        fontSize: 15,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.55)',
        marginTop: 4,
        letterSpacing: 0.2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    rankingList: {
        gap: 10,
    },
    rankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 10,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankNum: {
        fontSize: 14,
        fontWeight: '800',
    },
    photoWrap: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    photo: {
        width: 52,
        height: 52,
        borderRadius: 10,
    },
    photoPlaceholder: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoPlaceholderText: {
        fontSize: 22,
    },
    cardInfo: {
        flex: 1,
        gap: 3,
    },
    restaurantName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
    neighborhoodText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    scorePill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        minWidth: 44,
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 1,
        fontWeight: '500',
    },
    actionArea: {
        width: '100%',
        paddingHorizontal: 24,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#ee6c2b',
        borderRadius: 16,
        paddingVertical: 16,
    },
    shareButtonPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
    shareButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.2,
    },
});
