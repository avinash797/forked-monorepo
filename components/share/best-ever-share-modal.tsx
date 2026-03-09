import { ForkLogo } from '@/components/fork-logo';
import { DishTypeIcon } from '@/components/ui/dish-type-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BestEverDish } from '@/hooks/use-user-stats';
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

const SCORE_COLORS = (score: number) => {
    if (score >= 7.0) return { bg: '#059669', text: '#fff' };
    if (score >= 4.0) return { bg: '#D97706', text: '#fff' };
    return { bg: '#DC2626', text: '#fff' };
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

    const [fontsLoaded] = useFonts({
        GeistMono_500Medium,
        GeistMono_600SemiBold,
        GeistMono_700Bold,
        GeistMono_800ExtraBold,
        GeistMono_900Black,
    });

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
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/jpeg',
                    UTI: 'public.jpeg',
                    dialogTitle: `My best ${item.dish_type_name}? ${item.restaurant_name} in ${item.city_name}! Scored ${score.toFixed(1)}/10 on Forked 🍴`,
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
                            {/* Spacer top */}
                            <View style={styles.flex1} />

                            {/* Headline */}
                            <Text style={styles.headline}>
                                {username ? `${username}'s` : 'My'} best {item.dish_type_name} ever
                            </Text>

                            {/* White Card */}
                            <View style={styles.card}>
                                {/* Card header: username + logo */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.userInfo}>
                                        <Text style={styles.displayName}>
                                            {username || 'My'}
                                        </Text>
                                        <Text style={styles.usernameHandle}>
                                            {username ? `@${username}` : ''}
                                        </Text>
                                    </View>
                                    <ForkLogo size={32} color="#1a1a2e" />
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
                                            {(item.dish_type_icon || item.dish_type_emoji) && (
                                                <DishTypeIcon
                                                    icon={item.dish_type_icon}
                                                    emoji={item.dish_type_emoji}
                                                    size={16}
                                                    color="#1a1a2e"
                                                />
                                            )}
                                            <Text style={styles.dishLabel}>Best {item.dish_type_name}</Text>
                                        </View>
                                        <Text style={styles.restaurantName} numberOfLines={2}>
                                            {item.restaurant_name}
                                        </Text>
                                        <Text style={styles.cityName}>
                                            {item.city_name}
                                        </Text>
                                    </View>
                                    <View style={[styles.scoreBadge, { backgroundColor: scoreColor.bg }]}>
                                        <Text style={styles.scoreValue}>{score.toFixed(1)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Spacer bottom */}
                            <View style={styles.flex1} />

                            {/* Footer branding */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>forked.app</Text>
                            </View>
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
    headline: {
        fontSize: 32,
        fontFamily: 'GeistMono_900Black',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: -1,
        lineHeight: 38,
        marginBottom: 28,
        paddingHorizontal: 8,
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
    userInfo: {
        gap: 2,
    },
    displayName: {
        fontSize: 17,
        fontFamily: 'GeistMono_700Bold',
        color: '#1a1a2e',
    },
    usernameHandle: {
        fontSize: 14,
        fontFamily: 'GeistMono_500Medium',
        color: '#6b7280',
    },
    photoContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: 200,
        borderRadius: 16,
    },
    restaurantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
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
        fontSize: 12,
        fontFamily: 'GeistMono_600SemiBold',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    restaurantName: {
        fontSize: 20,
        fontFamily: 'GeistMono_800ExtraBold',
        color: '#1a1a2e',
        letterSpacing: -0.3,
    },
    cityName: {
        fontSize: 14,
        fontFamily: 'GeistMono_500Medium',
        color: '#6b7280',
    },
    scoreBadge: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreValue: {
        fontSize: 18,
        fontFamily: 'GeistMono_900Black',
        color: '#fff',
        letterSpacing: -0.5,
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
