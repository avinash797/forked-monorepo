import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import type { TrendDirection } from '@/types/browse';
import { StyleSheet, View } from 'react-native';

interface TrendIndicatorProps {
    /** The trend direction to display */
    direction: TrendDirection;
    /** Optional rating change value (e.g., +0.5 or -0.3) */
    change?: number | null;
    /** Whether to show the change value alongside the icon */
    showChange?: boolean;
    /** Size variant for the indicator */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Configuration for each trend direction
 * Uses Unicode symbols for arrows and consistent color coding
 */
const TREND_CONFIG = {
    rising: {
        icon: '\u25B2', // ▲ Up triangle
        label: 'Rising',
    },
    falling: {
        icon: '\u25BC', // ▼ Down triangle
        label: 'Falling',
    },
    stable: {
        icon: '\u2014', // — Em dash
        label: 'Stable',
    },
    new: {
        icon: '\u2605', // ★ Star
        label: 'New',
    },
} as const;

/**
 * Displays trend direction with optional rating change
 *
 * Uses Unicode symbols for arrows:
 * - Rising (▲): Green - dish is gaining momentum
 * - Falling (▼): Red - dish is losing momentum
 * - Stable (—): Gray - no significant change
 * - New (★): Amber - dish is new (< 7 days)
 *
 * @example
 * ```tsx
 * // Simple indicator
 * <TrendIndicator direction="rising" />
 *
 * // With rating change
 * <TrendIndicator direction="rising" change={0.5} showChange />
 *
 * // Different sizes
 * <TrendIndicator direction="falling" size="lg" />
 * ```
 */
export function TrendIndicator({
    direction,
    change,
    showChange = false,
    size = 'md',
}: TrendIndicatorProps) {
    const { theme } = useTheme();
    const config = TREND_CONFIG[direction];

    // Get theme-aware colors for each direction
    const getColor = (dir: TrendDirection): string => {
        switch (dir) {
            case 'rising':
                return theme.color.success; // Green
            case 'falling':
                return theme.color.danger; // Red
            case 'stable':
                return theme.color.textSecondary; // Gray
            case 'new':
                return theme.color.warning; // Amber
            default:
                return theme.color.textSecondary;
        }
    };

    const color = getColor(direction);

    // Size configurations
    const sizes = {
        sm: { icon: 10, text: theme.font.size.xs, gap: 2 },
        md: { icon: 14, text: theme.font.size.sm, gap: 4 },
        lg: { icon: 18, text: theme.font.size.md, gap: 6 },
    };

    const currentSize = sizes[size];

    // Format the change value
    const formatChange = (value: number): string => {
        const prefix = value > 0 ? '+' : '';
        return `${prefix}${value.toFixed(1)}`;
    };

    return (
        <View style={[styles.container, { gap: currentSize.gap }]}>
            <ThemedText
                style={[
                    styles.icon,
                    {
                        color,
                        fontSize: currentSize.icon,
                    },
                ]}
                accessibilityLabel={config.label}
            >
                {config.icon}
            </ThemedText>
            {showChange && change !== null && change !== undefined && (
                <ThemedText
                    style={[
                        styles.change,
                        {
                            color,
                            fontSize: currentSize.text,
                        },
                    ]}
                >
                    {formatChange(change)}
                </ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        fontWeight: '700',
    },
    change: {
        fontWeight: '600',
    },
});
