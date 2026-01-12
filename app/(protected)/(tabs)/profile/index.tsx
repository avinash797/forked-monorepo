import { AchievementsTab } from '@/components/profile/achievements-tab';
import { ActivitiesTab } from '@/components/profile/activities-tab';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { ReviewsTab } from '@/components/profile/reviews-tab';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO_HEIGHT = 325;
const HEADER_HEIGHT = 60;

export default function ProfileScreen() {
    const { user, profile } = useAuth();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('Reviews');
    const styles = createThemedStyles(theme, insets);

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
        const backgroundColor = interpolate(
            scrollY.value,
            [HERO_HEIGHT * 0.6, HERO_HEIGHT * 0.8],
            [0.3, 0],
            Extrapolation.CLAMP
        );

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
    const location = profile?.location;
    const bio = profile?.bio;

    return (
        <ThemedView style={styles.container}>
            {/* Settings Button (Always visible but transitions) */}
            <View style={[styles.topControls, { marginTop: insets.top }]}>
                <Link href="/profile/settings" asChild>
                    <TouchableOpacity activeOpacity={0.7}>
                        <Animated.View
                            style={[
                                styles.settingsButton,
                                animatedSettingsButtonStyle,
                            ]}
                        >
                            <IconSymbol
                                name="settings"
                                size={28}
                                color={theme.color.textPrimary}
                            />
                        </Animated.View>
                    </TouchableOpacity>
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
                stickyHeaderIndices={[1]} // The index of ProfileTabs
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
                        style={[styles.heroContent, animatedHeroContentStyle]}
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
                                    <ThemedText style={styles.avatarInitials}>
                                        {getInitials(displayName)}
                                    </ThemedText>
                                </ThemedView>
                            )}
                        </View>
                        <View style={styles.heroUserDetailsContent}>
                            <ThemedText
                                type="title"
                                style={styles.displayNameHero}
                            >
                                {displayName}
                            </ThemedText>
                            {bio && (
                                <ThemedText style={styles.bio}>
                                    {bio}
                                </ThemedText>
                            )}
                            {location && (
                                <ThemedText style={styles.bio}>
                                    <IconSymbol
                                        name="pin-sharp"
                                        size={16}
                                        style={styles.locationIcon}
                                        color={theme.color.textTertiary}
                                    />
                                    {location}
                                </ThemedText>
                            )}
                        </View>

                        <Link href="/profile/edit" asChild>
                            <ThemedButton
                                variant="secondary"
                                style={styles.editProfileButton}
                            >
                                Edit Profile
                            </ThemedButton>
                        </Link>
                    </Animated.View>
                </Animated.View>

                {/* Sticky Tabs */}
                <View style={[styles.tabsContainer]}>
                    <ProfileTabs
                        tabs={['Reviews', 'Activities', 'Achievements']}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </View>

                {/* Tab Content */}
                <View style={styles.contentSection}>
                    {activeTab === 'Reviews' && (
                        <ReviewsTab userId={user?.id} />
                    )}
                    {activeTab === 'Activities' && <ActivitiesTab />}
                    {activeTab === 'Achievements' && (
                        <AchievementsTab userId={user?.id} />
                    )}
                </View>
            </Animated.ScrollView>
        </ThemedView>
    );
}

const createThemedStyles = (
    theme: ReturnType<typeof useTheme>['theme'],
    insets: any
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
            top: 0,
            right: 0,
            paddingHorizontal: theme.space.md,
            paddingTop: theme.space.sm,
            zIndex: 20,
        },
        settingsButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
        },
        stickyHeader: {
            backgroundColor: theme.color.surface,
            zIndex: 15,
            height: HEADER_HEIGHT + insets.top,
            justifyContent: 'center',
            paddingHorizontal: theme.space.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.color.border,
            // shadowColor: '#000',
            // shadowOffset: { width: 0, height: 2 },
            // shadowOpacity: 0.1,
            // shadowRadius: 4,
            // elevation: 5,
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
            marginBottom: theme.space.md,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
        },
        avatar: {
            width: 140,
            height: 140,
            borderRadius: 70,
            borderWidth: 3,
            borderColor: theme.color.border,
        },
        avatarPlaceholder: {
            width: 140,
            height: 140,
            borderRadius: 70,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: theme.color.border,
        },
        avatarInitials: {
            fontSize: 48,
            fontWeight: 'bold',
        },
        heroUserDetailsContent: {
            alignItems: 'center',
            marginBottom: theme.space.md,
        },
        displayNameHero: {},
        bio: {
            fontSize: theme.font.size.sm,
        },
        locationIcon: {
            marginRight: theme.space.md,
        },
        editProfileButton: {
            alignSelf: 'center',
        },
        tabsContainer: {
            backgroundColor: theme.color.bg,
            zIndex: 10,
        },
        contentSection: {
            backgroundColor: theme.color.bg,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            paddingTop: theme.space.md,
        },
    });
