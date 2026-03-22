import { ThemedButton } from '@/components/themed-button';
import { ThemedSelect } from '@/components/themed-select';
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

const THEME_OPTIONS = [
    { label: 'Default (Warm Orange)', value: 'default' },
    { label: 'Gen Z (Bold Red)', value: 'genZ' },
    { label: 'Foodies (Premium)', value: 'foodies' },
    { label: 'Critics (Editorial)', value: 'critics' },
] as const;

const COLOR_SCHEME_OPTIONS = [
    { label: 'System Default', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
] as const;

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

export default function SettingsScreen() {
    const { logout } = useAuth();
    const { theme, themeName, setThemeName, themePreference, setThemePreference } =
        useTheme();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Appearance
                </ThemedText>

                <ThemedSelect
                    label="Theme"
                    placeholder="Select a theme"
                    value={themeName}
                    options={THEME_OPTIONS}
                    onValueChange={(value) => setThemeName(value as any)}
                />

                <View style={{ height: 16 }} />

                <ThemedSelect
                    label="Color Scheme"
                    placeholder="Select color scheme"
                    value={themePreference}
                    options={COLOR_SCHEME_OPTIONS}
                    onValueChange={(value) => setThemePreference(value as any)}
                />
            </View>

            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Legal
                </ThemedText>
                {LEGAL_LINKS.map((link) => (
                    <Pressable
                        key={link.url}
                        onPress={() => Linking.openURL(link.url)}
                        style={({ pressed }) => [
                            {
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 4,
                                borderBottomWidth: StyleSheet.hairlineWidth,
                                borderBottomColor: theme.color.border,
                                opacity: pressed ? 0.6 : 1,
                            },
                        ]}
                    >
                        <IconSymbol
                            name={link.icon}
                            size={20}
                            color={theme.color.textSecondary}
                            style={{ marginRight: 12 }}
                        />
                        <ThemedText style={{ flex: 1, fontSize: 16 }}>
                            {link.label}
                        </ThemedText>
                        <IconSymbol
                            name="chevron-forward"
                            size={18}
                            color={theme.color.textTertiary}
                        />
                    </Pressable>
                ))}
            </View>

            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Support
                </ThemedText>
                <Pressable
                    onPress={() =>
                        Linking.openURL('mailto:support@forkedapp.com')
                    }
                    style={({ pressed }) => [
                        {
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            paddingHorizontal: 4,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.color.border,
                            opacity: pressed ? 0.6 : 1,
                        },
                    ]}
                >
                    <IconSymbol
                        name="mail-outline"
                        size={20}
                        color={theme.color.textSecondary}
                        style={{ marginRight: 12 }}
                    />
                    <ThemedText style={{ flex: 1, fontSize: 16 }}>
                        Contact Support
                    </ThemedText>
                    <IconSymbol
                        name="chevron-forward"
                        size={18}
                        color={theme.color.textTertiary}
                    />
                </Pressable>
            </View>

            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    About
                </ThemedText>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 4,
                    }}
                >
                    <ThemedText style={{ fontSize: 16 }}>
                        App Version
                    </ThemedText>
                    <ThemedText
                        style={{
                            fontSize: 16,
                            color: theme.color.textSecondary,
                        }}
                    >
                        {Constants.expoConfig?.version ?? 'Unknown'}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Account
                </ThemedText>
                <Pressable
                    onPress={() => router.push('/(protected)/(profile)/account')}
                    style={({ pressed }) => [
                        {
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            paddingHorizontal: 4,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.color.border,
                            opacity: pressed ? 0.6 : 1,
                        },
                    ]}
                >
                    <IconSymbol
                        name="person-circle-outline"
                        size={20}
                        color={theme.color.textSecondary}
                        style={{ marginRight: 12 }}
                    />
                    <ThemedText style={{ flex: 1, fontSize: 16 }}>
                        Email, Password & Delete Account
                    </ThemedText>
                    <IconSymbol
                        name="chevron-forward"
                        size={18}
                        color={theme.color.textTertiary}
                    />
                </Pressable>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        justifyContent: 'space-between',
        flexGrow: 1,
    },
    header: {
        marginBottom: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    logoutSection: {
        marginTop: 16,
        marginBottom: 32,
    },
});
