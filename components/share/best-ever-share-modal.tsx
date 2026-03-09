import { IconSymbol } from '@/components/ui/icon-symbol';
import { BestEverDish } from '@/hooks/use-user-stats';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    Pressable,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

const SCORE_COLORS = (score: number) => {
    if (score >= 7.0) return { bg: '#059669', accent: '#34D399', text: '#fff' };
    if (score >= 4.0) return { bg: '#D97706', accent: '#FBBF24', text: '#fff' };
    return { bg: '#DC2626', accent: '#F87171', text: '#fff' };
};

interface BestEverShareModalProps {
    visible: boolean;
    onClose: () => void;
    item: BestEverDish;
    username: string;
}

export function BestEverShareModal({
    visible,
    onClose,
    item,
    username,
}: BestEverShareModalProps) {
    const insets = useSafeAreaInsets();
    const cardRef = useRef<View>(null);
    const [isSharing, setIsSharing] = useState(false);

    const score = item.derived_score ?? 0;
    const scoreColor = SCORE_COLORS(score);

    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsSharing(true);
        try {
            const uri = await captureRef(cardRef, {
                format: 'jpg',
                quality: 0.95,
            });
            await Share.share({
                url: uri,
                message: Platform.OS === 'android'
                    ? `My best ${item.dish_type_name}? ${item.restaurant_name} in ${item.city_name}! Scored ${score.toFixed(1)}/10 on Forked 🍴`
                    : undefined,
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
                colors={['#0a0014', '#100a24', '#1a0e34', '#0d0c1e']}
                locations={[0, 0.3, 0.65, 1]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
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

                {/* Shareable card */}
                <View style={styles.cardWrapper}>
                    <View ref={cardRef} collapsable={false}>
                        <LinearGradient
                            colors={['#0a0014', '#100a24', '#1a0e34', '#0d0c1e']}
                            locations={[0, 0.3, 0.65, 1]}
                            start={{ x: 0.1, y: 0 }}
                            end={{ x: 0.9, y: 1 }}
                            style={styles.shareCard}
                        >
                            {/* Decorative glows */}
                            <View style={[styles.glow, styles.glowTop, { backgroundColor: scoreColor.accent }]} />
                            <View style={styles.glowPurple} />

                            {/* Branding */}
                            <View style={styles.brandRow}>
                                <Text style={styles.brandText}>FORKED</Text>
                            </View>

                            {/* Header title */}
                            <View style={styles.titleBlock}>
                                <Text style={styles.usernameLabel}>
                                    {username ? `@${username}` : 'My'}
                                </Text>
                                <Text style={styles.titleMain}>
                                    Best {item.dish_type_emoji ? `${item.dish_type_emoji} ` : ''}
                                    {item.dish_type_name}
                                </Text>
                            </View>

                            {/* Photo */}
                            <View style={styles.photoContainer}>
                                <Image
                                    source={{ uri: item.photo_url }}
                                    style={styles.photo}
                                    contentFit="cover"
                                />
                                {/* Score overlay */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                                    style={styles.photoGradient}
                                />
                                <View style={[styles.scoreBadge, { backgroundColor: scoreColor.bg }]}>
                                    <Text style={styles.scoreValue}>{score.toFixed(1)}</Text>
                                    <Text style={styles.scoreMax}>/10</Text>
                                </View>
                            </View>

                            {/* Restaurant info */}
                            <View style={styles.infoBlock}>
                                <Text style={styles.restaurantName} numberOfLines={2}>
                                    {item.restaurant_name}
                                </Text>
                                <Text style={styles.cityName}>{item.city_name}</Text>
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <View style={styles.footerDivider} />
                                <Text style={styles.footerText}>forked.app</Text>
                            </View>
                        </LinearGradient>
                    </View>
                </View>

                {/* Share button */}
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
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    glow: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        opacity: 0.12,
    },
    glowTop: {
        top: -80,
        right: -60,
    },
    glowPurple: {
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#7c3aed',
        opacity: 0.2,
    },
    brandRow: {
        alignItems: 'center',
        marginBottom: 16,
    },
    brandText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#ee6c2b',
        letterSpacing: 4,
    },
    titleBlock: {
        alignItems: 'center',
        marginBottom: 18,
    },
    usernameLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    titleMain: {
        fontSize: 26,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.5,
        textAlign: 'center',
        lineHeight: 30,
    },
    photoContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: 240,
        borderRadius: 20,
    },
    photoGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '45%',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    scoreBadge: {
        position: 'absolute',
        bottom: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 2,
    },
    scoreValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    scoreMax: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },
    infoBlock: {
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
    },
    restaurantName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    cityName: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
    },
    footer: {
        marginTop: 18,
        alignItems: 'center',
        gap: 8,
    },
    footerDivider: {
        height: 1,
        width: 60,
        backgroundColor: 'rgba(255,255,255,0.12)',
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
