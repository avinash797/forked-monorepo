import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-provider';
import { BestEverDish, useMyBestEver } from '@/hooks/use-user-stats';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BestEverCard } from './best-ever-card';

interface BestEverSectionProps {
    userId?: string;
}

export function BestEverSection({ userId }: BestEverSectionProps) {
    const { theme } = useTheme();
    const { data: bestEverDishes, isLoading } = useMyBestEver(userId);
    const styles = createThemedStyles(theme);

    if (isLoading) {
        return (
            <Animated.View
                entering={FadeInDown.duration(400)}
                style={styles.container}
            >
                <View style={styles.header}>
                    <ThemedText style={styles.title}>Your Best Ever</ThemedText>
                </View>
                <View style={styles.loadingContainer}>
                    <ThemedText style={styles.emptyText}>Loading...</ThemedText>
                </View>
            </Animated.View>
        );
    }

    if (!bestEverDishes || bestEverDishes.length === 0) {
        return (
            <Animated.View
                entering={FadeInDown.duration(400)}
                style={styles.container}
            >
                <View style={styles.header}>
                    <ThemedText style={styles.title}>Your Best Ever</ThemedText>
                </View>
                <View style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyText}>
                        Rate some dishes to see your best picks here!
                    </ThemedText>
                </View>
            </Animated.View>
        );
    }

    const renderItem = ({
        item,
        index,
    }: {
        item: BestEverDish;
        index: number;
    }) => (
        <View style={styles.cardWrapper}>
            <BestEverCard item={item} index={index} />
        </View>
    );

    return (
        <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.container}
        >
            <View style={styles.header}>
                <ThemedText style={styles.title}>Your Best Ever</ThemedText>
            </View>
            <FlatList
                data={bestEverDishes}
                renderItem={renderItem}
                keyExtractor={(item) => item.rating_id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </Animated.View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            marginTop: theme.space.lg,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            marginBottom: theme.space.sm,
        },
        title: {
            fontSize: theme.font.size.lg,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
        },
        listContent: {
            paddingHorizontal: theme.space.md,
            gap: theme.space.md,
        },
        cardWrapper: {
            width: 280,
        },
        loadingContainer: {
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.xl,
            alignItems: 'center',
        },
        emptyContainer: {
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.xl,
            alignItems: 'center',
        },
        emptyText: {
            color: theme.color.textSecondary,
            fontSize: theme.font.size.sm,
            textAlign: 'center',
        },
    });
