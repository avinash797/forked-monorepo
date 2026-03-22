import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

const LEGAL_LINKS = [
    {
        label: 'Privacy Policy',
        url: 'https://www.forkedapp.com/privacy',
        icon: 'shield-checkmark-outline' as const,
    },
    {
        label: 'Terms of Service',
        url: 'https://www.forkedapp.com/terms',
        icon: 'document-text-outline' as const,
    },
];

function SettingsRow({
    icon,
    label,
    onPress,
    styles,
    theme,
}: {
    icon: React.ComponentProps<typeof IconSymbol>['name'];
    label: string;
    onPress: () => void;
    styles: ReturnType<typeof createThemedStyles>;
    theme: ReturnType<typeof useTheme>['theme'];
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? theme.opacity.pressed : 1 },
            ]}
        >
            <IconSymbol
                name={icon}
                size={20}
                color={theme.color.textSecondary}
                style={styles.rowIcon}
            />
            <ThemedText style={styles.rowLabel}>{label}</ThemedText>
            <IconSymbol
                name="chevron-forward"
                size={18}
                color={theme.color.textTertiary}
            />
        </Pressable>
    );
}

export default function SettingsScreen() {
    const { logout } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const styles = createThemedStyles(theme);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    setIsLoggingOut(true);
                    try {
                        await logout();
                    } catch (error: any) {
                        Alert.alert(
                            'Error',
                            error.message || 'Failed to logout'
                        );
                    } finally {
                        setIsLoggingOut(false);
                    }
                },
            },
        ]);
    };

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
        >
            <View>
                <SettingsRow
                    icon="person-circle-outline"
                    label="Account Settings"
                    onPress={() =>
                        router.push('/(protected)/(profile)/account')
                    }
                    styles={styles}
                    theme={theme}
                />
                <SettingsRow
                    icon="color-palette-outline"
                    label="Appearance"
                    onPress={() =>
                        router.push('/(protected)/(profile)/appearance')
                    }
                    styles={styles}
                    theme={theme}
                />

                {LEGAL_LINKS.map((link) => (
                    <SettingsRow
                        key={link.url}
                        icon={link.icon}
                        label={link.label}
                        onPress={() => Linking.openURL(link.url)}
                        styles={styles}
                        theme={theme}
                    />
                ))}

                <SettingsRow
                    icon="mail-outline"
                    label="Contact Support"
                    onPress={() =>
                        Linking.openURL('mailto:support@forkedapp.com')
                    }
                    styles={styles}
                    theme={theme}
                />

                <View style={styles.versionRow}>
                    <ThemedText style={styles.rowLabel}>App Version</ThemedText>
                    <ThemedText style={styles.versionValue}>
                        {Constants.expoConfig?.version ?? 'Unknown'}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.logoutSection}>
                <ThemedButton
                    onPress={handleLogout}
                    loading={isLoggingOut}
                    variant="secondary"
                >
                    Logout
                </ThemedButton>
            </View>
        </ScrollView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        scrollContent: {
            paddingHorizontal: theme.space.xl,
            paddingVertical: theme.space.md,
            flexGrow: 1,
            justifyContent: 'space-between',
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.xxs,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.color.border,
        },
        rowIcon: {
            marginRight: theme.space.sm,
        },
        rowLabel: {
            flex: 1,
            fontSize: theme.font.size.md,
        },
        versionRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.xxs,
        },
        versionValue: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
        },
        logoutSection: {
            marginBottom: theme.space.xxl,
        },
    });
