import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { buildComponentStyles } from '@/lib/theme/componentStyles';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { user, profile } = useAuth();
    const { theme } = useTheme();
    const builtStyles = buildComponentStyles(theme);
    const styles = createThemedStyles(theme);

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
        </SafeAreaView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        safeArea: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: theme.space.xl,
        },
        settingsButton: {
            marginRight: -theme.space.xs,
        },
        profileSection: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: theme.space.md,
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
