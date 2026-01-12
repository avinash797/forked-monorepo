import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { Pressable, StyleSheet } from 'react-native';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    onSeeAllPress?: () => void;
    seeAllLabel?: string | React.ReactNode;
}

/**
 * Section header with title, optional subtitle, and "See All" link
 * Used in: Home feed, detail screens for section dividers
 */
export function SectionHeader({
    title,
    subtitle,
    onSeeAllPress,
    seeAllLabel = 'See All',
}: SectionHeaderProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    return (
        <ThemedView
            style={[
                styles.container,
                onSeeAllPress
                    ? { paddingHorizontal: theme.space.md }
                    : { paddingHorizontal: theme.space.xs },
            ]}
        >
            <ThemedView style={styles.textContainer}>
                <ThemedText type="title" style={styles.title}>
                    {title}
                </ThemedText>
                {subtitle && (
                    <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
                )}
            </ThemedView>

            {onSeeAllPress && (
                <Pressable
                    onPress={onSeeAllPress}
                    style={styles.seeAllButton}
                    hitSlop={16}
                >
                    <ThemedText type="link" style={styles.seeAllText}>
                        {seeAllLabel}
                    </ThemedText>
                </Pressable>
            )}
        </ThemedView>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.space.xs,
        },
        textContainer: {
            flex: 1,
        },
        title: {
            fontSize: theme.font.size.lg,
            marginBottom: theme.space.xxs,
        },
        subtitle: {
            fontSize: theme.font.size.sm,
            opacity: theme.opacity.pressed - 0.1,
        },
        seeAllButton: {
            paddingLeft: theme.space.sm,
        },
        seeAllText: {
            fontSize: theme.font.size.sm,
        },
    });
