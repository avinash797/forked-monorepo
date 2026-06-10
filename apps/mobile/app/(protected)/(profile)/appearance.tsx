import { ThemedSelect } from '@/components/themed-select';
import { useTheme } from '@/contexts/theme-provider';
import { ScrollView, StyleSheet, View } from 'react-native';

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
