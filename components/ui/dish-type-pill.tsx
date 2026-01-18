import { DishType } from '@/types/dishTypes';
import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../themed-text';

const DishTypePill = (dishType: DishType) => {
    const { name } = dishType;
    return (
        <View>
            <ThemedText>{name}</ThemedText>
        </View>
    );
};

export default DishTypePill;
