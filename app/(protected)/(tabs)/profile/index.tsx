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
import { buildComponentStyles } from '@/lib/theme/componentStyles';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { user, profile } = useAuth();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('Reviews');
    const builtStyles = buildComponentStyles(theme);
    const styles = createThemedStyles(theme);
    const { width } = useWindowDimensions();

    const scrollY = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const headerNameStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [100, 150], // Adjust these values based on where the name disappears
            [0, 1],
            Extrapolation.CLAMP
        );
        return {
            opacity,
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

    return (
        <SafeAreaView edges={['top']} style={builtStyles.screen}>
            <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                    <Animated.Text
                        style={[
                            styles.headerTitle,
                            { color: theme.color.textPrimary },
                            headerNameStyle,
                        ]}
                    >
                        {displayName}
                    </Animated.Text>
                </View>
                <Link href="/profile/settings" asChild>
                    <Pressable style={styles.settingsButton}>
                        <IconSymbol
                            name="settings"
                            size={28}
                            color={theme.color.textPrimary}
                        />
                    </Pressable>
                </Link>
            </View>

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                stickyHeaderIndices={[2]} // The index of ProfileTabs
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. Profile Hero Section */}
                <View style={styles.profileSection}>
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
                                    { backgroundColor: theme.color.surface },
                                ]}
                            >
                                <ThemedText style={styles.avatarInitials}>
                                    {getInitials(displayName)}
                                </ThemedText>
                            </ThemedView>
                        )}
                    </View>

                    <ThemedText type="title" style={styles.name}>
                        {displayName}
                    </ThemedText>

                    <Link href="/profile/edit" asChild>
                        <ThemedButton
                            variant="secondary"
                            style={styles.editProfileButton}
                        >
                            Edit Profile
                        </ThemedButton>
                    </Link>
                </View>

                {/* 2. Divider/Spacing before tabs if needed */}
                <View style={{ height: theme.space.sm }} />

                {/* 3. Sticky Tabs (Index 2) */}
                <View style={{ backgroundColor: theme.color.bg }}>
                    <ProfileTabs
                        tabs={['Reviews', 'Activities', 'Achievements']}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </View>

                {/* 4. Tab Content */}
                <View>
                    {activeTab === 'Reviews' && (
                        <ReviewsTab userId={user?.id} />
                    )}
                    {activeTab === 'Activities' && <ActivitiesTab />}
                    {activeTab === 'Achievements' && (
                        <AchievementsTab userId={user?.id} />
                    )}
                </View>
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: theme.color.bg,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: theme.space.xl,
            paddingVertical: theme.space.md,
            borderBottomWidth: 1,
            borderBottomColor: 'transparent', // Or theme.color.border if you want a line
            zIndex: 10,
            height: 60, // Fixed height for header for accurate zIndexes
        },
        headerTitleContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            // Offset for the settings button to keep title centered
            marginLeft: 28,
        },
        headerTitle: {
            fontSize: theme.font.size.lg,
            fontWeight: 'bold',
        },
        settingsButton: {
            // alignSelf: 'flex-end',
        },
        scrollContent: {
            // Padding top to account for the fixed header
            paddingTop: 60,
            minHeight: '100%',
        },
        profileSection: {
            alignItems: 'center',
            paddingTop: theme.space.md,
            paddingBottom: theme.space.md,
        },
        avatarContainer: {
            marginBottom: theme.space.md,
            shadowColor: theme.color.bg,
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
        },
        avatar: {
            width: 120,
            height: 120,
            borderRadius: 60,
        },
        avatarPlaceholder: {
            width: 120,
            height: 120,
            borderRadius: 60,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.color.border,
        },
        avatarInitials: {
            fontSize: 40,
            fontWeight: 'bold',
        },
        name: {
            marginBottom: theme.space.md,
            textAlign: 'center',
            fontSize: theme.font.size.xl,
        },
        editProfileButton: {
            alignSelf: 'center',
            marginBottom: theme.space.lg,
        },
    });
