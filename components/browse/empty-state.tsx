import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { StyleSheet } from 'react-native';

interface EmptyStateProps {
    icon?:
        | 'search-outline'
        | 'restaurant-outline'
        | 'location-outline'
        | 'warning-outline'
        | 'alert-circle-outline';
    title: string;
    message: string;
    actionLabel?: string;
    onActionPress?: () => void;
}

/**
 * Reusable empty state component
 * Uses Material Icons naming convention
 * See: https://icons.expo.fyi/Index/MaterialIcons
 * Used in: All screens when no data is available
 */
export function EmptyState({
    icon = 'search-outline',
    title,
    message,
    actionLabel,
    onActionPress,
}: EmptyStateProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    return (
        <ThemedView style={styles.container}>
            <IconSymbol
                name={icon}
                size={64}
                color={theme.color.textPrimary}
                style={styles.icon}
            />

            <ThemedText type="title" style={styles.title}>
                {title}
            </ThemedText>

            <ThemedText style={styles.message}>{message}</ThemedText>

            {actionLabel && onActionPress && (
                <ThemedButton
                    variant="secondary"
                    onPress={onActionPress}
                    style={styles.button}
                >
                    {actionLabel}
                </ThemedButton>
            )}
        </ThemedView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.space.xxl,
        },
        icon: {
            marginBottom: theme.space.md,
            opacity: theme.opacity.disabled,
        },
        title: {
            fontSize: theme.font.size.lg,
            marginBottom: theme.space.xs,
            textAlign: 'center',
        },
        message: {
            fontSize: theme.font.size.md,
            textAlign: 'center',
            opacity: theme.opacity.pressed - 0.1,
            marginBottom: theme.space.lg + theme.space.xs,
        },
        button: {
            minWidth: 200,
        },
    });
