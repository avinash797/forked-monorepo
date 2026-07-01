import { useTheme } from '@/contexts/theme-provider';
import { DishType } from '@forked/types/dishes';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DishTypePill from '../ui/dish-type-pill';

export default function DishTypePills({
    dishTypes,
    selectedDishType,
    handleDishTypeSelect,
    initialDishTypeId,
}: {
    dishTypes: DishType[];
    selectedDishType: DishType | null;
    handleDishTypeSelect: (dishType: DishType | null) => void;
    initialDishTypeId?: string;
}) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);

    useEffect(() => {
        if (dishTypes?.length) {
            const isSelectedValid =
                selectedDishType &&
                dishTypes.some((dt) => dt.id === selectedDishType.id);

            if (!isSelectedValid) {
                // Prefer the initial dish type from URL params if provided
                const initialMatch = initialDishTypeId
                    ? dishTypes.find((dt) => dt.id === initialDishTypeId)
                    : undefined;
                handleDishTypeSelect(initialMatch ?? dishTypes[0]);
            }
        } else {
            handleDishTypeSelect(null);
        }
    }, [dishTypes, selectedDishType, handleDishTypeSelect, initialDishTypeId]);

    return (
        <View style={styles.chipContainer}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScrollContent}
                fadingEdgeLength={10}
            >
                <View style={{ paddingHorizontal: theme.space.xs }} />
                {dishTypes?.map((dishType, index) => {
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
                                    onPress={() => {
                                        if (process.env.EXPO_OS === 'ios') {
                                            Haptics.impactAsync(
                                                Haptics.ImpactFeedbackStyle
                                                    .Light
                                            );
                                        }
                                        handleDishTypeSelect(dishType);
                                    }}
                                    style={({ pressed }) => [
                                        styles.chipPressable,
                                        pressed &&
                                            process.env.EXPO_OS === 'ios' && {
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
            borderCurve: 'continuous',
            backgroundColor: theme.color.surface,
            borderWidth: 1.5,
            borderColor: theme.color.border,
            margin: theme.space.xs,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
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
            boxShadow: `0px 2px 8px ${theme.color.accent}4D`,
        },
    });
