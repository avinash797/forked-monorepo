import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useDishTypes } from '@/hooks/use-dish-types';
import { useUserStats } from '@/hooks/use-user-stats';
import { DishType } from '@/types/dishes';
import React, { useEffect, useMemo } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DishTypePill from '../ui/dish-type-pill';

export default function DishTypePills({
    selectedDishType,
    handleDishTypeSelect,
    view = 'global',
}: {
    selectedDishType: DishType | null;
    handleDishTypeSelect: (dishType: DishType) => void;
    view?: 'global' | 'personal';
}) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const { user, profile } = useAuth();

    const { data: dishTypes, isLoading: dishTypesLoading } = useDishTypes();

    // Fetch user stats
    const { data: userStats, isLoading: isStatsLoading } = useUserStats(
        user?.id
    );

    const displayDishTypes = useMemo(() => {
        if (view === 'personal' && userStats) {
            if (!userStats.dishes_by_type) {
                return [];
            }
            return dishTypes?.filter((dishType) =>
                Object.keys(userStats.dishes_by_type).includes(dishType.name)
            );
        }
        return dishTypes;
    }, [dishTypes, userStats, view]);

    useEffect(() => {
        if (!selectedDishType && displayDishTypes?.length) {
            handleDishTypeSelect(displayDishTypes[0]);
        }
    }, [displayDishTypes, selectedDishType, handleDishTypeSelect]);

    return (
        <View style={styles.chipContainer}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScrollContent}
                fadingEdgeLength={10}
            >
                <View style={{ paddingHorizontal: theme.space.xs }} />
                {displayDishTypes?.map((dishType, index) => {
                    const isSelected = dishType.id === selectedDishType?.id;
                    return (
                        <Animated.View
                            key={dishType.id}
                            entering={FadeInDown.delay(index * 50).duration(
                                400
                            )}
                        >
                            <Animated.View
                                style={[
                                    styles.chip,
                                    isSelected && styles.chipSelected,
                                    isSelected && styles.chipWrapperSelected,
                                ]}
                            >
                                <Pressable
                                    onPress={() =>
                                        handleDishTypeSelect(dishType)
                                    }
                                    style={({ pressed }) => [
                                        styles.chipPressable,
                                        pressed &&
                                            Platform.OS === 'ios' && {
                                                opacity: 0.7,
                                            },
                                    ]}
                                    android_ripple={{
                                        color: isSelected
                                            ? 'rgba(255, 255, 255, 0.2)'
                                            : 'rgba(0, 0, 0, 0.1)',
                                        borderless: false,
                                        foreground: true,
                                    }}
                                >
                                    <DishTypePill {...dishType} />
                                </Pressable>
                            </Animated.View>
                        </Animated.View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        chipContainer: {
            paddingVertical: 2,
        },
        chipScrollContent: {
            alignItems: 'center',
        },
        chip: {
            borderRadius: theme.radius.sm,
            backgroundColor: theme.color.surface,
            borderWidth: 1.5,
            borderColor: theme.color.border,
            margin: theme.space.xs,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
            overflow: 'hidden',
        },
        chipPressable: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm - 2,
            gap: theme.space.xs,
        },
        chipWrapperSelected: {
            transform: [{ scale: 1.05 }],
            zIndex: 1,
        },
        chipSelected: {
            backgroundColor: theme.color.accentSoft,
            borderColor: theme.color.accent,
            shadowColor: theme.color.accent,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
    });
