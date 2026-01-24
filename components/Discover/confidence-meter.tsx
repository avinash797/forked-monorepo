import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface ConfidenceMeterProps {
    confidenceScore: number;
    totalBattles?: number;
    style?: StyleProp<ViewStyle>;
    variant?: 'compact' | 'full';
}

/**
 * ConfidenceMeter - Visual indicator showing confidence level based on confidence_score
 *
 * Helps users quickly assess if a dish's ranking is trustworthy:
 * - High confidence: score ≥ 0.8 (🔥 Verified Champion)
 * - Medium confidence: score 0.5-0.79 (✓ Established)
 * - Low confidence: score 0.3-0.49 (⚠️ Emerging)
 * - Very low: score < 0.3 (🆕 New Entry)
 *
 * Used in: HeroCard, Rising Star cards, Leaderboard rows
 */
export function ConfidenceMeter({
    confidenceScore,
    totalBattles = 0,
    style,
    variant = 'full',
}: ConfidenceMeterProps) {
    const { theme } = useTheme();

    const getConfidenceConfig = (score: number) => {
        if (score >= 0.8) {
            return {
                level: 'high' as const,
                label: 'Verified',
                icon: 'flame-outline' as const,
                color: theme.color.success,
                backgroundColor:
                    theme.mode === 'dark'
                        ? 'rgba(52, 211, 153, 0.15)'
                        : 'rgba(16, 185, 129, 0.1)',
            };
        }
        if (score >= 0.5) {
            return {
                level: 'medium' as const,
                label: 'Established',
                icon: 'checkmark-circle-outline' as const,
                color: theme.color.info,
                backgroundColor:
                    theme.mode === 'dark'
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(37, 99, 235, 0.1)',
            };
        }
        if (score >= 0.3) {
            return {
                level: 'low' as const,
                label: 'Emerging',
                icon: 'trending-up-outline' as const,
                color: theme.color.warning,
                backgroundColor:
                    theme.mode === 'dark'
                        ? 'rgba(251, 191, 36, 0.15)'
                        : 'rgba(245, 158, 11, 0.1)',
            };
        }
        return {
            level: 'very-low' as const,
            label: 'New',
            icon: 'sparkles-outline' as const,
            color: theme.color.textSecondary,
            backgroundColor:
                theme.mode === 'dark'
                    ? 'rgba(148, 163, 184, 0.15)'
                    : 'rgba(100, 116, 139, 0.1)',
        };
    };

    const config = getConfidenceConfig(confidenceScore);

    const localStyles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: variant === 'compact' ? theme.space.xs : theme.space.sm,
            paddingVertical: variant === 'compact' ? theme.space.xxs : theme.space.xs,
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
            fontSize: variant === 'compact' ? theme.font.size.xs : theme.font.size.sm,
            fontWeight: '600',
        },
        battles: {
            color: theme.color.textSecondary,
            fontSize: variant === 'compact' ? theme.font.size.xs : theme.font.size.sm,
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
            {variant === 'full' && (
                <ThemedText style={localStyles.label}>
                    {config.label}
                </ThemedText>
            )}
            {totalBattles > 0 && (
                <ThemedText style={localStyles.battles}>
                    {totalBattles} {variant === 'full' ? 'battles' : ''}
                </ThemedText>
            )}
        </View>
    );
}
