import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import { formatScore, getScoreTier } from '@forked/utils';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface ScoreBadgeProps {
    score: number;
    style?: StyleProp<ViewStyle>;
}

export function ScoreBadge({ score, style }: ScoreBadgeProps) {
    const { theme } = useTheme();

    // Determine text and gradient colors using tokens
    const textDark =
        theme.mode === 'dark' ? theme.color.bg : theme.color.textPrimary;
    const textLight = theme.color.textOnImage;

    const getBadgeConfig = (score: number) => {
        const tier = getScoreTier(score);
        if (tier === 'high') {
            return {
                colors: [
                    theme.color.success,
                    theme.mode === 'dark' ? '#10B981' : '#059669',
                ] as const,
                text: theme.mode === 'dark' ? textDark : textLight,
                borderColor:
                    theme.mode === 'dark'
                        ? 'rgba(52, 211, 153, 0.4)'
                        : 'rgba(16, 185, 129, 0.3)',
            };
        }
        if (tier === 'mid') {
            return {
                colors: [
                    theme.color.warning,
                    theme.mode === 'dark' ? '#F59E0B' : '#D97706',
                ] as const,
                text: textDark,
                borderColor:
                    theme.mode === 'dark'
                        ? 'rgba(251, 191, 36, 0.4)'
                        : 'rgba(245, 158, 11, 0.3)',
            };
        }
        return {
            colors: [
                theme.color.danger,
                theme.mode === 'dark' ? '#EF4444' : '#DC2626',
            ] as const,
            text: theme.mode === 'dark' ? textDark : textLight,
            borderColor:
                theme.mode === 'dark'
                    ? 'rgba(248, 113, 113, 0.4)'
                    : 'rgba(239, 68, 68, 0.3)',
        };
    };

    const config = getBadgeConfig(score);

    const localStyles = StyleSheet.create({
        container: {
            borderRadius: theme.radius.md,
            borderCurve: 'continuous',
            backgroundColor: 'transparent',
            boxShadow: `0px ${theme.shadow.sm.y}px ${theme.shadow.sm.radius}px rgba(0, 0, 0, ${theme.shadow.sm.opacity})`,
        },
        gradient: {
            paddingHorizontal: theme.space.xs + 2,
            paddingVertical: theme.space.xxs,
            borderRadius: theme.radius.md,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: config.borderColor,
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 40,
        },
        text: {
            color: config.text,
            fontWeight: '800',
            fontSize: theme.font.size.sm,
            letterSpacing: -0.2,
            fontVariant: ['tabular-nums'],
        },
    });

    return (
        <View style={[localStyles.container, style]}>
            <LinearGradient
                colors={config.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={localStyles.gradient}
            >
                <ThemedText style={localStyles.text}>
                    {formatScore(score)}
                </ThemedText>
            </LinearGradient>
        </View>
    );
}
