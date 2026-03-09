import { useTheme } from '@/contexts/theme-provider';
import { DishType } from '@/types/dishes';
import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../themed-text';
import { DishTypeIcon } from './dish-type-icon';

const DishTypePill = (dishType: DishType) => {
    const { name, emoji, icon } = dishType;
    const { theme } = useTheme();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <DishTypeIcon icon={icon} emoji={emoji} size={18} color={theme.color.accent} />
            <ThemedText style={{ fontWeight: '600' }}>{name}</ThemedText>
        </View>
    );
};

export default DishTypePill;
