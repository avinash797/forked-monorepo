import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { CONFIDENCE_TIER_LABELS } from '@forked/utils';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface ConfidenceMeterProps {
    confidenceTier: string;
    totalRatings?: number;
    style?: StyleProp<ViewStyle>;
    variant?: 'compact' | 'full';
}

/**
 * ConfidenceMeter - Visual indicator showing confidence level based on confidence_tier
 *
 * Helps users quickly assess if a dish's ranking is trustworthy:
 * - very_high: 🔥 Verified Champion
 * - high: ✓ Established
 * - medium: ⚠️ Emerging
 * - low: 🆕 New Entry
 */
export function ConfidenceMeter({
    confidenceTier,
    totalRatings = 0,
    style,
    variant = 'full',
}: ConfidenceMeterProps) {
    const { theme } = useTheme();

    const getConfidenceConfig = (tier: string) => {
        if (tier === 'very_high') {
            return {
                level: 'very_high' as const,
                label: CONFIDENCE_TIER_LABELS.very_high,
                icon: 'flame-outline' as const,
                color: theme.color.success,
                backgroundColor:
                    theme.mode === 'dark'
                        ? 'rgba(52, 211, 153, 0.15)'
                        : 'rgba(16, 185, 129, 0.1)',
            };
        }
        if (tier === 'high') {
            return {
                level: 'high' as const,
                label: CONFIDENCE_TIER_LABELS.high,
                icon: 'checkmark-circle-outline' as const,
                color: theme.color.info,
                backgroundColor:
                    theme.mode === 'dark'
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(37, 99, 235, 0.1)',
            };
        }
        if (tier === 'medium') {
            return {
                level: 'medium' as const,
                label: CONFIDENCE_TIER_LABELS.medium,
                icon: 'trending-up-outline' as const,
                color: theme.color.warning,
                backgroundColor:
                    theme.mode === 'dark'
                        ? 'rgba(251, 191, 36, 0.15)'
                        : 'rgba(245, 158, 11, 0.1)',
            };
        }
        return {
            level: 'low' as const,
            label: CONFIDENCE_TIER_LABELS.low,
            icon: 'sparkles-outline' as const,
            color: theme.color.textSecondary,
            backgroundColor:
                theme.mode === 'dark'
                    ? 'rgba(148, 163, 184, 0.15)'
                    : 'rgba(100, 116, 139, 0.1)',
        };
    };

    const config = getConfidenceConfig(confidenceTier);

    const localStyles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal:
                variant === 'compact' ? theme.space.xs : theme.space.sm,
            paddingVertical: theme.space.xxs,
            backgroundColor: config.backgroundColor,
            borderRadius: theme.radius.pill,
            borderWidth: 1,
            borderColor:
                theme.mode === 'dark'
                    ? `${config.color}40`
                    : `${config.color}30`,
            gap: theme.space.xxs,
        },
        icon: {
            width: 16,
            height: 16,
        },
        label: {
            color: config.color,
            fontSize:
                variant === 'compact' ? theme.font.size.xs : theme.font.size.sm,
            fontWeight: '600',
        },
        battles: {
            color: theme.color.textSecondary,
            fontSize:
                variant === 'compact' ? theme.font.size.xs : theme.font.size.sm,
            fontWeight: '500',
        },
    });

    return (
        <View style={[localStyles.container, style]}>
            <IconSymbol
                name={config.icon}
                size={16}
                color={config.color}
                style={localStyles.icon}
            />

            <ThemedText style={localStyles.label}>
                {config.label} {'•'}
            </ThemedText>

            {totalRatings > 0 && (
                <ThemedText style={localStyles.battles}>
                    {totalRatings} {variant === 'full' ? 'ratings' : ''}
                </ThemedText>
            )}
        </View>
    );
}
