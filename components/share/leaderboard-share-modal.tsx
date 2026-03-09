import type { LeaderboardEntry } from '@/components/Discover/leaderboard-row';
import { ForkLogo } from '@/components/fork-logo';
import { DishTypeIcon } from '@/components/ui/dish-type-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
    GeistMono_500Medium,
    GeistMono_600SemiBold,
    GeistMono_700Bold,
    GeistMono_800ExtraBold,
    GeistMono_900Black,
} from '@expo-google-fonts/geist-mono';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
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
    const insets = useSafeAreaInsets();
    const cardRef = useRef<View>(null);
    const [isSharing, setIsSharing] = useState(false);

    const [fontsLoaded] = useFonts({
        GeistMono_500Medium,
        GeistMono_600SemiBold,
        GeistMono_700Bold,
        GeistMono_800ExtraBold,
        GeistMono_900Black,
    });

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
                : `Top 3 ${dishTypeName} in ${cityName} on Forked 🍴`;

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/jpeg',
                    UTI: 'public.jpeg',
                    dialogTitle: msg,
                });
            }
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
            <View style={styles.screen}>
                {/* Full-screen capturable area */}
                <View ref={cardRef} collapsable={false} style={StyleSheet.absoluteFill}>
                    <LinearGradient
                        colors={['#0d0117', '#12082a', '#1c0e35', '#0f0c1e']}
                        locations={[0, 0.35, 0.7, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        {/* Decorative glows */}
                        <View style={styles.glowTopRight} />
                        <View style={styles.glowBottomLeft} />

                        <View style={[styles.contentWrapper, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 140 }]}>

                            {/* Spacer bottom */}
                            <View style={styles.flex1} />
                            {/* White Card */}
                            <View style={styles.card}>
                                {/* Card header: context label + logo */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.headerInfo}>
                                        {(dishTypeIcon || dishTypeEmoji) && (
                                            <DishTypeIcon
                                                icon={dishTypeIcon}
                                                emoji={dishTypeEmoji}
                                                size={20}
                                                color="#1a1a2e"
                                            />
                                        )}
                                        <Text style={styles.headerLabel}>
                                            {isPersonal ? (username ? `@${username}` : 'Personal') : cityName}
                                        </Text>
                                    </View>
                                    <ForkLogo size={32} color="#1a1a2e" />
                                </View>

                                {/* Ranking rows */}
                                <View style={styles.rankingList}>
                                    {top3.map((entry, idx) => {
                                        const rank = (idx + 1) as 1 | 2 | 3;
                                        const medal = MEDAL_COLORS[rank];
                                        const score = entry.bayesian_score ?? entry.derived_score ?? 0;
                                        const scoreColor = SCORE_COLORS(score);
                                        const photoUri = entry.featured_photo_url ?? entry.photo_url;

                                        return (
                                            <View key={entry.restaurant_id} style={styles.rankRow}>
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
                                                <View style={styles.rowInfo}>
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
                            </View>

                            {/* Footer branding */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>forkedapp.com</Text>
                            </View>
                            {/* Spacer bottom */}
                            <View style={styles.flex1} />

                        </View>
                    </LinearGradient>
                </View>

                {/* Close button (absolute, excluded from capture) */}
                <Pressable
                    style={[styles.closeButton, { top: insets.top + 12, right: 20 }]}
                    onPress={onClose}
                    hitSlop={12}
                >
                    <IconSymbol name="close-outline" size={24} color="rgba(255,255,255,0.8)" />
                </Pressable>

                {/* Share button (absolute, excluded from capture) */}
                <View style={[styles.actionArea, { bottom: insets.bottom + 24 }]}>
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
                                <IconSymbol name="share-outline" size={24} color="#fff" />
                                <Text style={styles.shareButtonText}>Share Image</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000',
    },
    gradient: {
        flex: 1,
    },
    glowTopRight: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: '#ee6c2b',
        opacity: 0.2,
    },
    glowBottomLeft: {
        position: 'absolute',
        bottom: -50,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#7c3aed',
        opacity: 0.18,
    },
    contentWrapper: {
        flex: 1,
        paddingHorizontal: 24,
    },
    flex1: {
        flex: 1,
    },
    // ─── White Card ───
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerLabel: {
        fontSize: 15,
        fontFamily: 'GeistMono_700Bold',
        color: '#1a1a2e',
    },
    // ─── Ranking Rows ───
    rankingList: {
        gap: 12,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rankBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankNum: {
        fontSize: 14,
        fontFamily: 'GeistMono_900Black',
    },
    photoWrap: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    photo: {
        width: 56,
        height: 56,
        borderRadius: 12,
    },
    photoPlaceholder: {
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoPlaceholderText: {
        fontSize: 24,
    },
    rowInfo: {
        flex: 1,
        gap: 2,
    },
    restaurantName: {
        fontSize: 16,
        fontFamily: 'GeistMono_800ExtraBold',
        color: '#1a1a2e',
    },
    neighborhoodText: {
        fontSize: 13,
        fontFamily: 'GeistMono_500Medium',
        color: '#6b7280',
    },
    scorePill: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: {
        fontSize: 15,
        fontFamily: 'GeistMono_800ExtraBold',
        letterSpacing: -0.3,
    },
    // ─── Footer ───
    footer: {
        alignItems: 'center',
        marginTop: 16,
    },
    footerText: {
        fontSize: 14,
        fontFamily: 'GeistMono_600SemiBold',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 2,
    },
    // ─── Absolute Buttons ───
    closeButton: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    actionArea: {
        position: 'absolute',
        width: '100%',
        paddingHorizontal: 24,
        zIndex: 10,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#ee6c2b',
        borderRadius: 24,
        paddingVertical: 18,
        shadowColor: '#ee6c2b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    shareButtonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    shareButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
});
