import { ThemedButton } from '@/components/themed-button';
import { ThemedSelect } from '@/components/themed-select';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

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

export default function SettingsScreen() {
    const { logout } = useAuth();
    const { themeName, setThemeName, themePreference, setThemePreference } =
        useTheme();
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

            <View style={styles.logoutSection}>
                <ThemedButton
                    onPress={handleLogout}
                    loading={isLoggingOut}
                    variant="secondary"
                    destructive
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
