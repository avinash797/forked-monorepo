import { DishType } from '@/types/dishes';
import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../themed-text';

const DishTypePill = (dishType: DishType) => {
    const { name, emoji } = dishType;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {emoji && <ThemedText style={{ fontSize: 16 }}>{emoji}</ThemedText>}
            <ThemedText style={{ fontWeight: '600' }}>{name}</ThemedText>
        </View>
    );
};

export default DishTypePill;
