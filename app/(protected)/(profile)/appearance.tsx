import { ThemedSelect } from '@/components/themed-select';
import { useTheme } from '@/contexts/theme-provider';
import { ScrollView, StyleSheet, View } from 'react-native';

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

export default function AppearanceScreen() {
    const { themeName, setThemeName, themePreference, setThemePreference, theme } =
        useTheme();

    const styles = createThemedStyles(theme);

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
        >
            <View style={styles.section}>
                <ThemedSelect
                    label="Theme"
                    placeholder="Select a theme"
                    value={themeName}
                    options={THEME_OPTIONS}
                    onValueChange={(value) => setThemeName(value as any)}
                />
            </View>

            <View style={styles.section}>
                <ThemedSelect
                    label="Color Scheme"
                    placeholder="Select color scheme"
                    value={themePreference}
                    options={COLOR_SCHEME_OPTIONS}
                    onValueChange={(value) => setThemePreference(value as any)}
                />
            </View>
        </ScrollView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        scrollContent: {
            padding: theme.space.xl,
            flexGrow: 1,
        },
        section: {
            marginBottom: theme.space.md,
        },
    });
