import { ForkLogo } from '@/components/fork-logo';
import { DishTypeIcon } from '@/components/ui/dish-type-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { BestEverDish } from '@/hooks/use-user-stats';
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

interface BestEverShareModalProps {
    visible: boolean;
    onClose: () => void;
    item: BestEverDish;
    username: string;
    displayName: string;
}

export function BestEverShareModal({
    visible,
    onClose,
    item,
    username,
    displayName,
}: BestEverShareModalProps) {
    const insets = useSafeAreaInsets();
    const cardRef = useRef<View>(null);
    const [isSharing, setIsSharing] = useState(false);
    const { theme } = useTheme();

    const score = item.derived_score ?? 0;

    const getScoreColors = (s: number) => {
        if (s >= 7.0)
            return { bg: theme.color.success, text: theme.color.accentOn };
        if (s >= 4.0)
            return { bg: theme.color.warning, text: theme.color.accentOn };
        return { bg: theme.color.danger, text: theme.color.accentOn };
    };

    const scoreColor = getScoreColors(score);

    const captureOptions = {
        format: 'png' as const,
        quality: 1,
        pixelRatio: 3,
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsSharing(true);
        try {
            const uri = await captureRef(cardRef, captureOptions);
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    UTI: 'public.png',
                    dialogTitle: `My best ${item.dish_type_name}? ${item.restaurant_name} in ${item.city_name}! Scored ${score.toFixed(1)}/10 on Forked 🍴`,
                });
            }
        } catch {
            // user cancelled or error
        } finally {
            setIsSharing(false);
        }
    };

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
                    {item.photo_url ? (
                        <Image
                            source={{ uri: item.photo_url }}
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
                        {/* Spacer top */}
                        <View style={styles.flex1} />

                        {/* White Card */}
                        <View style={styles.card}>
                            {/* Card header: username + logo */}
                            <View style={styles.cardHeader}>
                                <View style={styles.userInfo}>
                                    <Text style={styles.displayName}>
                                        {`${displayName || 'My'}'s Best ${item.dish_type_name} Ever`}
                                    </Text>
                                </View>
                                <ForkLogo size={32} color={theme.color.gold} />
                            </View>

                            {/* Photo */}
                            {item.photo_url ? (
                                <View style={styles.photoContainer}>
                                    <Image
                                        source={{ uri: item.photo_url }}
                                        style={styles.photo}
                                        contentFit="cover"
                                    />
                                </View>
                            ) : null}

                            {/* Restaurant name + score */}
                            <View style={styles.restaurantRow}>
                                <View style={styles.restaurantInfo}>
                                    <View style={styles.dishLabelRow}>
                                        {(item.dish_type_icon ||
                                            item.dish_type_emoji) && (
                                            <DishTypeIcon
                                                icon={item.dish_type_icon}
                                                emoji={item.dish_type_emoji}
                                                size={16}
                                                color={theme.color.textPrimary}
                                            />
                                        )}
                                        <Text style={styles.dishLabel}>
                                            {item.variation_name ??
                                                item.dish_type_name}
                                        </Text>
                                    </View>
                                    <Text
                                        style={styles.restaurantName}
                                        numberOfLines={2}
                                    >
                                        {item.restaurant_name}
                                    </Text>
                                    <Text style={styles.cityName}>
                                        <IconSymbol
                                            name="pin"
                                            size={16}
                                            color={theme.color.textPrimary}
                                        />
                                        {item.neighborhood_name
                                            ? `${item.neighborhood_name}, `
                                            : ''}
                                        {item.city_name}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.scoreBadge,
                                        { backgroundColor: scoreColor.bg },
                                    ]}
                                >
                                    <Text style={styles.scoreValue}>
                                        {score.toFixed(1)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Spacer bottom */}
                        <View style={styles.flex1} />

                        {/* Footer branding */}
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

                {/* Share button (absolute, excluded from capture) */}
                <View
                    style={[styles.actionArea, { bottom: insets.bottom + 24 }]}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.shareButton,
                            pressed && styles.shareButtonPressed,
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
            paddingHorizontal: 24,
        },
        flex1: {
            flex: 1,
        },
        // ─── White Card ───
        card: {
            backgroundColor: theme.color.surface2,
            borderRadius: theme.radius.xl,
            padding: theme.space.lg,
            gap: theme.space.md,
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
        userInfo: {
            gap: 2,
        },
        displayName: {
            fontSize: 17,
            fontFamily: 'GeistMono_700Bold',
            color: theme.color.textPrimary,
        },
        usernameHandle: {
            fontSize: theme.font.size.sm,
            fontFamily: 'GeistMono_500Medium',
            color: theme.color.textSecondary,
        },
        photoContainer: {
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
        },
        photo: {
            width: '100%',
            height: 200,
            borderRadius: theme.radius.lg,
        },
        restaurantRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.space.sm,
        },
        restaurantInfo: {
            flex: 1,
            gap: 4,
        },
        dishLabelRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 2,
        },
        dishLabel: {
            fontSize: theme.font.size.xs,
            fontFamily: 'GeistMono_600SemiBold',
            color: theme.color.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        restaurantName: {
            fontSize: theme.font.size.lg + 2,
            fontFamily: 'GeistMono_800ExtraBold',
            color: theme.color.textPrimary,
            letterSpacing: -0.3,
        },
        cityName: {
            fontSize: theme.font.size.sm,
            fontFamily: 'GeistMono_500Medium',
            color: theme.color.textSecondary,
        },
        scoreBadge: {
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
        },
        scoreValue: {
            fontSize: theme.font.size.lg,
            fontFamily: 'GeistMono_900Black',
            color: theme.color.accentOn,
            letterSpacing: -0.5,
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
        shareButtonPressed: {
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
