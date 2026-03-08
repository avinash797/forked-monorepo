import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface StatsRowProps {
    totalDishes: number;
    totalCities: number;
    totalBattles: number;
}

export function StatsRow({
    totalDishes,
    totalCities,
    totalBattles,
}: StatsRowProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    return (
        <Animated.View entering={FadeIn.duration(400)}>
            <ThemedView style={styles.container}>
                <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>
                        {totalDishes}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>dishes</ThemedText>
                </View>

                <View style={styles.divider} />

                <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>
                        {totalCities}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>cities</ThemedText>
                </View>

                <View style={styles.divider} />

                <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>
                        {totalBattles}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>battles</ThemedText>
                </View>
            </ThemedView>
        </Animated.View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingVertical: theme.space.lg,
            paddingHorizontal: theme.space.md,
            marginHorizontal: theme.space.md,
            borderRadius: theme.radius.lg,
            borderCurve: 'continuous',
            backgroundColor: theme.color.surface,
        },
        statItem: {
            flex: 1,
            alignItems: 'center',
        },
        statValue: {
            fontSize: theme.font.size.xxl,
            lineHeight: theme.font.size.xxl,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
            fontVariant: ['tabular-nums'] as any,
        },
        statLabel: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginTop: theme.space.xxs,
        },
        divider: {
            width: 1,
            height: 40,
            backgroundColor: theme.color.border,
        },
    });
