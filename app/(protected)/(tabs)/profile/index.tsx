import { BadgesSection } from '@/components/profile/badges-section';
import { BestEverSection } from '@/components/profile/best-ever-section';
import { StatsRow } from '@/components/profile/stats-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useUserStats } from '@/hooks/use-user-stats';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import {
    SafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';

const HERO_HEIGHT = 340;
const HEADER_HEIGHT = 60;

export default function ProfileScreen() {
    const { user, profile } = useAuth();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = createThemedStyles(theme, insets);

    // Fetch user stats
    const { data: userStats, isLoading: isStatsLoading } = useUserStats(
        user?.id
    );

    const scrollY = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Animated styles for hero section (avatar area)
    const animatedHeroStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, HERO_HEIGHT * 0.7],
            [1, 0],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            scrollY.value,
            [-100, 0],
            [1.2, 1],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [0, HERO_HEIGHT],
            [0, HERO_HEIGHT * 0.4],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [{ scale }, { translateY }],
        };
    });

    // Animated styles for hero content (name and button)
    const animatedHeroContentStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, HERO_HEIGHT * 0.5],
            [1, 0],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [0, HERO_HEIGHT * 0.5],
            [0, -20],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    // Animated style for the sticky header
    const animatedHeaderStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [HERO_HEIGHT * 0.6, HERO_HEIGHT * 0.8],
            [0, 1],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [HERO_HEIGHT * 0.6, HERO_HEIGHT * 0.8],
                        [-10, 0],
                        Extrapolation.CLAMP
                    ),
                },
            ],
        };
    });

    // Animated style for settings button background
    const animatedSettingsButtonStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: theme.color.surface,
        };
    });

    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const displayName =
        profile?.display_name || user?.email?.split('@')[0] || 'User';
    const avatarUrl = profile?.avatar_url;
    const username = profile?.username || null;
    const bio = profile?.bio || null;
    const homeCity = profile?.home_city
        ? `${profile.home_city.name}${profile.home_city.state ? `, ${profile.home_city.state}` : ''}`
        : null;

    return (
        <SafeAreaView style={styles.container}>
            <ThemedView style={styles.container}>
                {/* Settings Button (Always visible but transitions) */}
                <View style={[styles.topControls]}>
                    <Link href="/profile/edit" asChild>
                        <Pressable>
                            {({ pressed }) => (
                                <Animated.View
                                    style={[
                                        styles.settingsButton,
                                        animatedSettingsButtonStyle,
                                        pressed && styles.settingsButtonPressed,
                                    ]}
                                >
                                    <IconSymbol
                                        name="pencil"
                                        size={28}
                                        color={theme.color.textPrimary}
                                    />
                                </Animated.View>
                            )}
                        </Pressable>
                    </Link>
                    <Link href="/profile/settings" asChild>
                        <Pressable>
                            {({ pressed }) => (
                                <Animated.View
                                    style={[
                                        styles.settingsButton,
                                        animatedSettingsButtonStyle,
                                        pressed && styles.settingsButtonPressed,
                                    ]}
                                >
                                    <IconSymbol
                                        name="settings-outline"
                                        size={28}
                                        color={theme.color.textPrimary}
                                    />
                                </Animated.View>
                            )}
                        </Pressable>
                    </Link>
                </View>

                {/* Animated Sticky Header */}
                <Animated.View
                    style={[
                        styles.stickyHeader,
                        { paddingTop: insets.top },
                        animatedHeaderStyle,
                    ]}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.headerTitleContainer}>
                            <ThemedText
                                style={styles.headerTitle}
                                numberOfLines={1}
                            >
                                {displayName}
                            </ThemedText>
                        </View>
                    </View>
                </Animated.View>

                <Animated.ScrollView
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Animated Hero Section */}
                    <Animated.View
                        style={[
                            styles.heroSection,
                            { backgroundColor: theme.color.bg },
                            animatedHeroStyle,
                        ]}
                    >
                        {/* Hero Content */}
                        <Animated.View
                            style={[
                                styles.heroContent,
                                animatedHeroContentStyle,
                            ]}
                        >
                            <View style={styles.avatarContainer}>
                                {avatarUrl ? (
                                    <Image
                                        source={{ uri: avatarUrl }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <ThemedView
                                        style={[
                                            styles.avatarPlaceholder,
                                            {
                                                backgroundColor:
                                                    theme.color.surface,
                                            },
                                        ]}
                                    >
                                        <ThemedText
                                            style={styles.avatarInitials}
                                        >
                                            {getInitials(displayName)}
                                        </ThemedText>
                                    </ThemedView>
                                )}
                            </View>
                            <View style={styles.heroUserDetailsContent}>
                                <ThemedText
                                    type="title"
                                    style={styles.displayNameHero}
                                    selectable
                                >
                                    {displayName}
                                </ThemedText>
                                {username && (
                                    <ThemedText style={styles.usernameText}>
                                        @{username}
                                    </ThemedText>
                                )}
                                {homeCity && (
                                    <View style={styles.locationRow}>
                                        <IconSymbol
                                            name="location-outline"
                                            size={16}
                                            color={theme.color.textSecondary}
                                        />
                                        <ThemedText style={styles.locationText}>
                                            {homeCity}
                                        </ThemedText>
                                    </View>
                                )}
                                {bio && (
                                    <ThemedText
                                        style={styles.bioText}
                                        numberOfLines={3}
                                    >
                                        {bio}
                                    </ThemedText>
                                )}
                            </View>
                        </Animated.View>
                    </Animated.View>

                    {/* Stats Row */}
                    <StatsRow
                        totalDishes={userStats?.total_ratings ?? 0}
                        totalCities={userStats?.cities_rated_in ?? 0}
                        totalBattles={userStats?.total_comparisons ?? 0}
                    />

                    {/* Best Ever Section */}
                    <BestEverSection userId={user?.id} />

                    {/* Badges Section */}
                    <BadgesSection userId={user?.id} />
                </Animated.ScrollView>
            </ThemedView>
        </SafeAreaView>
    );
}

const createThemedStyles = (
    theme: ReturnType<typeof useTheme>['theme'],
    insets: ReturnType<typeof useSafeAreaInsets>
) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: insets.bottom + theme.space.xl,
        },
        topControls: {
            position: 'absolute',
            left: 0,
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-between',
            paddingHorizontal: theme.space.md,
            paddingTop: theme.space.sm,
            zIndex: 20,
        },
        settingsButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            borderCurve: 'continuous',
            alignItems: 'center',
            justifyContent: 'center',
        },
        settingsButtonPressed: {
            opacity: 0.7,
        },
        stickyHeader: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.color.surface,
            zIndex: 15,
            height: HEADER_HEIGHT + insets.top,
            justifyContent: 'center',
            paddingHorizontal: theme.space.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.color.border,
        },
        headerContent: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerTitleContainer: {
            alignItems: 'center',
        },
        headerTitle: {
            fontSize: theme.font.size.md,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
        },
        heroSection: {
            height: HERO_HEIGHT,
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
        },
        heroContent: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: 'center',
            padding: theme.space.md,
        },
        avatarContainer: {
            marginBottom: theme.space.sm,

        },
        avatar: {
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 3,
            borderColor: theme.color.border,
        },
        avatarPlaceholder: {
            width: 120,
            height: 120,
            borderRadius: 60,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: theme.color.border,
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
        },
        avatarInitials: {
            fontSize: 40,
            lineHeight: 40,
            fontWeight: 'bold',
        },
        heroUserDetailsContent: {
            alignItems: 'center',
            marginBottom: theme.space.sm,
        },
        displayNameHero: {},
        usernameText: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginTop: 2,
        },
        bioText: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            textAlign: 'center',
            marginTop: theme.space.xs,
            paddingHorizontal: theme.space.md,
        },
        locationRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xxs,
            marginTop: theme.space.xxs,
        },
        locationText: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
        },
        editProfileButton: {
            alignSelf: 'center',
        },
    });
