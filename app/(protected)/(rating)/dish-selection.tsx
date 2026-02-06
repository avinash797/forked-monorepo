import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/theme-provider';
import { PrioritizedDishType, useCityDishTypes } from '@/hooks/use-dish-types';
import { useRatingStore } from '@/stores';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function DishSelectionScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    const { selectedRestaurant, setSelectedDishType } = useRatingStore();
    const { data: dishTypes, isLoading } = useCityDishTypes(
        selectedRestaurant?.city_id
    );

    useEffect(() => {
        if (!selectedRestaurant) {
            router.back();
        }
    }, [selectedRestaurant, router]);

    if (!selectedRestaurant) return null;

    const { cityDishes, otherDishes } = useMemo(() => {
        if (!dishTypes) return { cityDishes: [], otherDishes: [] };
        return {
            cityDishes: dishTypes.filter((dt) => dt.isCityKnown),
            otherDishes: dishTypes.filter((dt) => !dt.isCityKnown),
        };
    }, [dishTypes]);

    const handleDishTypeSelect = (dishType: PrioritizedDishType) => {
        setSelectedDishType(dishType);
        router.push('/(protected)/(rating)/rating');
    };

    const renderDishGrid = (
        dishes: PrioritizedDishType[],
        startIndex: number
    ) => (
        <View style={styles.dishTypesGrid}>
            {dishes.map((dishType, index) => (
                <Animated.View
                    key={dishType.id}
                    entering={FadeInDown.delay(
                        (startIndex + index) * 100
                    ).duration(400)}
                    style={styles.dishTypeWrapper}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.dishTypeCard,
                            pressed && styles.dishTypeCardPressed,
                        ]}
                        onPress={() => handleDishTypeSelect(dishType)}
                    >
                        <ThemedText style={styles.emoji}>
                            {dishType.emoji}
                        </ThemedText>
                        <ThemedText style={styles.dishTypeName}>
                            {dishType.name}
                        </ThemedText>
                        {dishType.aliases && dishType.aliases.length > 0 && (
                            <ThemedText style={styles.aliases}>
                                {dishType.aliases.slice(0, 2).join(', ')}
                            </ThemedText>
                        )}
                    </Pressable>
                </Animated.View>
            ))}
        </View>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'What did you eat?',
                    headerBackTitle: 'Back',
                }}
            />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
            >
                <ThemedView style={styles.header}>
                    <ThemedText style={styles.restaurantName}>
                        {selectedRestaurant.name}
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Select the dish type you&apos;re rating
                    </ThemedText>
                </ThemedView>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="large"
                            color={theme.color.accent}
                        />
                    </View>
                ) : (
                    <>
                        {cityDishes.length > 0 && (
                            <>
                                <ThemedText style={styles.sectionTitle}>
                                    Popular here
                                </ThemedText>
                                {renderDishGrid(cityDishes, 0)}
                            </>
                        )}

                        {otherDishes.length > 0 && (
                            <>
                                {cityDishes.length > 0 && (
                                    <ThemedText style={styles.sectionTitle}>
                                        More dishes
                                    </ThemedText>
                                )}
                                {renderDishGrid(otherDishes, cityDishes.length)}
                            </>
                        )}
                    </>
                )}

                <ThemedText style={styles.hint}>
                    We&apos;re focusing on iconic local dishes for now. More
                    categories coming soon!
                </ThemedText>
            </ScrollView>
        </>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.color.bg,
        },
        content: {
            padding: theme.space.md,
            paddingBottom: 100,
        },
        header: {
            marginBottom: theme.space.xl,
        },
        restaurantName: {
            fontSize: theme.font.size.xl,
            fontWeight: '700',
            color: theme.color.textPrimary,
            marginBottom: theme.space.xs,
        },
        subtitle: {
            fontSize: theme.font.size.md,
            color: theme.color.textSecondary,
        },
        loadingContainer: {
            padding: theme.space.xxl,
            alignItems: 'center',
        },
        sectionTitle: {
            fontSize: theme.font.size.md,
            fontWeight: '600',
            color: theme.color.textSecondary,
            marginBottom: theme.space.sm,
            marginTop: theme.space.md,
        },
        dishTypesGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space.md,
        },
        dishTypeWrapper: {
            width: '47%',
        },
        dishTypeCard: {
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            padding: theme.space.lg,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: theme.color.border,
            flex: 1,
        },
        dishTypeCardPressed: {
            transform: [{ scale: 0.97 }],
            backgroundColor: theme.color.surface2,
        },
        emoji: {
            fontSize: 48,
            lineHeight: 48,
            marginBottom: theme.space.sm,
        },
        dishTypeName: {
            fontSize: theme.font.size.md,
            fontWeight: '700',
            color: theme.color.textPrimary,
            textAlign: 'center',
        },
        aliases: {
            fontSize: theme.font.size.xs,
            color: theme.color.textTertiary,
            textAlign: 'center',
            marginTop: 4,
        },
        hint: {
            fontSize: theme.font.size.sm,
            color: theme.color.textTertiary,
            textAlign: 'center',
            marginTop: theme.space.xl,
            paddingHorizontal: theme.space.lg,
        },
    });
