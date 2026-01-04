import { useTheme } from '@/contexts/theme-provider';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';

export function ActivitiesTab() {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    return (
        <View style={styles.container}>
            <ThemedText style={styles.text}>No recent activities</ThemedText>
        </View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            padding: theme.space.xl,
            alignItems: 'center',
        },
        text: {
            color: theme.color.textSecondary,
        },
    });
