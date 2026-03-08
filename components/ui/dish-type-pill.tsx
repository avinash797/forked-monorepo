import { DishType } from '@/types/dishes';
import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ThemedText } from '../themed-text';

const DishTypePill = (dishType: DishType) => {
    const { name, emoji, icon } = dishType;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {icon ? (
                <SvgXml xml={icon} width={20} height={20} />
            ) : (
                emoji && (
                    <ThemedText style={{ fontSize: 16 }}>{emoji}</ThemedText>
                )
            )}
            <ThemedText style={{ fontWeight: '600' }}>{name}</ThemedText>
        </View>
    );
};

export default DishTypePill;
