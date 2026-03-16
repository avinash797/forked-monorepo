import type { LeaderboardEntry } from '@/components/Discover/leaderboard-row';
import { ForkLogo } from '@/components/fork-logo';
import { DishTypeIcon } from '@/components/ui/dish-type-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';

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
    /** When true, shows personal framing ("My Top 5") instead of city framing */
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
    const { theme } = useTheme();

    const top5 = entries.slice(0, 5);
    const heroPhoto = top5[0]?.featured_photo_url ?? top5[0]?.photo_url;

    const getScoreColors = (s: number) => {
        if (s >= 7.0)
            return { bg: theme.color.success, text: theme.color.accentOn };
        if (s >= 4.0)
            return { bg: theme.color.warning, text: theme.color.accentOn };
        return { bg: theme.color.danger, text: theme.color.accentOn };
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsSharing(true);
        try {
            const uri = await captureRef(cardRef, {
                format: 'png',
                quality: 1,
            });
            const msg = isPersonal
                ? `My top ${dishTypeName} ranked on Forked 🍴`
                : `Top 5 ${dishTypeName} in ${cityName} on Forked 🍴`;

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    UTI: 'public.png',
                    dialogTitle: msg,
                });
            }
        } catch {
            // user cancelled or error
        } finally {
            setIsSharing(false);
        }
    };

    const contextLabel = isPersonal ? '' : cityName.toUpperCase();
    const styles = createStyles(theme);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent
        >
            <View style={styles.screen}>
                {/* Full-screen capturable area */}
                <View
                    ref={cardRef}
                    collapsable={false}
                    style={StyleSheet.absoluteFill}
                >
                    {/* Hero background photo */}
                    {heroPhoto ? (
                        <Image
                            source={{ uri: heroPhoto }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                        />
                    ) : (
                        <View
                            style={[StyleSheet.absoluteFill, styles.fallbackBg]}
                        />
                    )}

                    {/* Dark overlay — heavier at top + bottom for readability */}
                    <LinearGradient
                        colors={[
                            'rgba(0,0,0,0.82)',
                            'rgba(0,0,0,0.52)',
                            'rgba(0,0,0,0.52)',
                            'rgba(0,0,0,0.88)',
                        ]}
                        locations={[0, 0.28, 0.65, 1]}
                        style={StyleSheet.absoluteFill}
                    />

                    <View
                        style={[
                            styles.contentWrapper,
                            {
                                paddingTop: insets.top + 28,
                                paddingBottom: insets.bottom + 148,
                            },
                        ]}
                    >
                        {/* ─── Header ─── */}
                        <View style={styles.topHeader}>
                            {/* Branded logo box */}
                            <View style={styles.logoBox}>
                                <ForkLogo size={20} color={theme.color.textOnImage} />
                            </View>

                            {/* Title block */}
                            <View style={styles.titleBlock}>
                                <View style={styles.titleRow}>
                                    {(dishTypeIcon || dishTypeEmoji) && (
                                        <DishTypeIcon
                                            icon={dishTypeIcon}
                                            emoji={dishTypeEmoji}
                                            size={20}
                                            color={theme.color.textOnImage}
                                        />
                                    )}
                                    <Text
                                        style={[
                                            styles.titleMain,
                                            isPersonal && {
                                                fontSize: 26,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {isPersonal
                                            ? `${username}'s TOP ${dishTypeName.toUpperCase()}`
                                            : `TOP ${dishTypeName.toUpperCase()}`}
                                    </Text>
                                </View>
                                <Text style={styles.titleSub}>
                                    {contextLabel}
                                </Text>
                                <Text style={styles.titleMeta}>
                                    {!isPersonal
                                        ? 'BASED ON FORKED RATINGS'
                                        : ''}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.flex1} />

                        {/* ─── Ranking rows ─── */}
                        <View style={styles.rankingList}>
                            {top5.map((entry, idx) => {
                                const score =
                                    entry.bayesian_score ??
                                    entry.derived_score ??
                                    0;
                                const scoreColor = getScoreColors(score);

                                return (
                                    <View
                                        key={entry.restaurant_id}
                                        style={[
                                            styles.rankRow,
                                            idx < top5.length - 1 &&
                                            styles.rankRowDivider,
                                        ]}
                                    >
                                        {/* Large rank number */}
                                        <Text style={styles.rankNum}>
                                            {idx + 1}
                                        </Text>

                                        {/* Name + neighborhood */}
                                        <View style={styles.rowInfo}>
                                            <Text
                                                style={styles.restaurantName}
                                                numberOfLines={1}
                                            >
                                                {entry.restaurant_name}
                                            </Text>
                                            <Text
                                                style={styles.neighborhoodText}
                                                numberOfLines={1}
                                            >
                                                {(
                                                    entry.neighborhood_name ??
                                                    entry.city_name ??
                                                    ''
                                                ).toUpperCase()}
                                            </Text>
                                        </View>

                                        {/* Score pill */}
                                        <View
                                            style={[
                                                styles.scorePill,
                                                {
                                                    backgroundColor:
                                                        scoreColor.bg,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.scoreText,
                                                    { color: scoreColor.text },
                                                ]}
                                            >
                                                {score.toFixed(1)}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.flex1} />

                        {/* ─── Footer branding ─── */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>forkedapp.com</Text>
                        </View>
                    </View>
                </View>

                {/* Close button (excluded from capture) */}
                <Pressable
                    style={[
                        styles.closeButton,
                        { top: insets.top + 12, right: 20 },
                    ]}
                    onPress={onClose}
                    hitSlop={12}
                >
                    <IconSymbol
                        name="close-outline"
                        size={24}
                        color="rgba(255,255,255,0.8)"
                    />
                </Pressable>

                {/* Action buttons (excluded from capture) */}
                <View
                    style={[styles.actionArea, { bottom: insets.bottom + 24 }]}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.shareButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={handleShare}
                        disabled={isSharing}
                    >
                        {isSharing ? (
                            <ActivityIndicator
                                color={theme.color.accentOn}
                                size="small"
                            />
                        ) : (
                            <>
                                <IconSymbol
                                    name="share-outline"
                                    size={24}
                                    color={theme.color.accentOn}
                                />
                                <Text style={styles.shareButtonText}>
                                    Share Image
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: '#000',
        },
        fallbackBg: {
            backgroundColor: theme.color.bg,
        },
        contentWrapper: {
            flex: 1,
            paddingHorizontal: 28,
        },
        flex1: {
            flex: 1,
        },
        // ─── Header ───
        topHeader: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 14,
        },
        logoBox: {
            width: 42,
            height: 42,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.color.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
            flexShrink: 0,
        },
        titleBlock: {
            flex: 1,
            gap: 1,
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            flexWrap: 'nowrap',
        },
        titleMain: {
            fontSize: 22,
            fontFamily: 'GeistMono_900Black',
            color: theme.color.textOnImage,
            letterSpacing: 0.3,
            flexShrink: 1,
        },
        titleSub: {
            fontSize: theme.font.size.md - 1,
            fontFamily: 'GeistMono_700Bold',
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: 0.5,
            marginTop: 2,
        },
        titleMeta: {
            fontSize: 10,
            fontFamily: 'GeistMono_500Medium',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: 1.8,
            marginTop: 5,
        },
        // ─── Ranking Rows ───
        rankingList: {
            gap: 0,
        },
        rankRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.md,
            paddingVertical: 18,
        },
        rankRowDivider: {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: 'rgba(255,255,255,0.18)',
        },
        rankNum: {
            width: 42,
            fontSize: 52,
            fontFamily: 'GeistMono_900Black',
            color: theme.color.textOnImage,
            textAlign: 'center',
            lineHeight: 56,
            includeFontPadding: false,
        },
        rowInfo: {
            flex: 1,
            gap: 4,
        },
        restaurantName: {
            fontSize: theme.font.size.lg,
            fontFamily: 'GeistMono_800ExtraBold',
            color: theme.color.textOnImage,
        },
        neighborhoodText: {
            fontSize: 11,
            fontFamily: 'GeistMono_500Medium',
            color: 'rgba(255,255,255,0.50)',
            letterSpacing: 1.2,
        },
        scorePill: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
        },
        scoreText: {
            fontSize: theme.font.size.md - 1,
            fontFamily: 'GeistMono_800ExtraBold',
            letterSpacing: -0.3,
        },
        // ─── Footer ───
        footer: {
            alignItems: 'center',
        },
        footerText: {
            fontSize: 11,
            fontFamily: 'GeistMono_600SemiBold',
            color: 'rgba(255,255,255,0.28)',
            letterSpacing: 3,
        },
        // ─── Absolute Buttons ───
        closeButton: {
            position: 'absolute',
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.color.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
        },
        actionArea: {
            position: 'absolute',
            width: '100%',
            paddingHorizontal: theme.space.xl,
            zIndex: 10,
        },
        shareButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.space.sm,
            backgroundColor: theme.color.accent,
            borderRadius: theme.radius.pill,
            paddingVertical: 18,
            shadowColor: theme.color.accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
        },
        buttonPressed: {
            opacity: theme.opacity.pressed,
            transform: [{ scale: 0.98 }],
        },
        shareButtonText: {
            fontSize: theme.font.size.lg,
            fontWeight: '800',
            color: theme.color.accentOn,
            letterSpacing: 0.5,
        },
    });
